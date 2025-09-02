use crate::{VideoNugget, ProcessingResult, VideoInfo};
use crate::video_processor::VideoProcessor;
use crate::ffmpeg_processor::FFmpegProcessor;
use crate::speech_recognition::SpeechRecognizer;
use crate::ai_analyzer::{AIAnalyzer, ContentAnalysis};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchJob {
    pub id: String,
    pub name: String,
    pub urls: Vec<String>,
    pub config: BatchConfig,
    pub status: BatchStatus,
    pub created_at: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub progress: BatchProgress,
    pub results: Vec<BatchResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchConfig {
    pub video_config: HashMap<String, serde_json::Value>,
    pub output_directory: String,
    pub export_formats: Vec<String>,
    pub enable_ai_analysis: bool,
    pub enable_transcript: bool,
    pub enable_social_formats: bool,
    pub concurrent_jobs: usize,
    pub retry_failed: bool,
    pub max_retries: u32,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum BatchStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
    Paused,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchProgress {
    pub total_videos: usize,
    pub processed_videos: usize,
    pub failed_videos: usize,
    pub current_video: Option<String>,
    pub percentage: f64,
    pub eta_minutes: Option<f64>,
    pub start_time: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchResult {
    pub url: String,
    pub video_info: Option<VideoInfo>,
    pub nuggets: Vec<VideoNugget>,
    pub analysis: Option<ContentAnalysis>,
    pub output_files: Vec<String>,
    pub status: ProcessingStatus,
    pub error_message: Option<String>,
    pub processing_time_seconds: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Success,
    Failed,
    Skipped,
    Retrying,
}

pub struct BatchProcessor {
    jobs: HashMap<String, BatchJob>,
    ffmpeg_processor: FFmpegProcessor,
    speech_recognizer: SpeechRecognizer,
    ai_analyzer: Option<AIAnalyzer>,
}

impl BatchProcessor {
    pub fn new(ai_analyzer: Option<AIAnalyzer>) -> Result<Self, String> {
        Ok(Self {
            jobs: HashMap::new(),
            ffmpeg_processor: FFmpegProcessor::new()?,
            speech_recognizer: SpeechRecognizer::new()?,
            ai_analyzer,
        })
    }

    pub fn create_batch_job(&mut self, name: String, urls: Vec<String>, config: BatchConfig) -> String {
        let job_id = Uuid::new_v4().to_string();
        
        let job = BatchJob {
            id: job_id.clone(),
            name,
            urls: urls.clone(),
            config,
            status: BatchStatus::Pending,
            created_at: chrono::Utc::now().to_rfc3339(),
            started_at: None,
            completed_at: None,
            progress: BatchProgress {
                total_videos: urls.len(),
                processed_videos: 0,
                failed_videos: 0,
                current_video: None,
                percentage: 0.0,
                eta_minutes: None,
                start_time: None,
            },
            results: Vec::new(),
        };

        self.jobs.insert(job_id.clone(), job);
        job_id
    }

    pub async fn start_batch_job(&mut self, job_id: &str) -> Result<(), String> {
        let job = self.jobs.get_mut(job_id)
            .ok_or("Batch job not found")?;

        if job.status != BatchStatus::Pending {
            return Err("Job is not in pending state".to_string());
        }

        job.status = BatchStatus::Running;
        job.started_at = Some(chrono::Utc::now().to_rfc3339());
        job.progress.start_time = Some(chrono::Utc::now().timestamp());

        // Create a copy of the job for processing
        let mut job_copy = job.clone();
        
        // Process videos concurrently
        let concurrent_jobs = job_copy.config.concurrent_jobs.min(job_copy.urls.len());
        let (tx, mut rx) = mpsc::channel::<BatchResult>(concurrent_jobs);

        // Spawn processing tasks
        let urls = job_copy.urls.clone();
        let config = job_copy.config.clone();
        
        tokio::spawn(async move {
            let semaphore = tokio::sync::Semaphore::new(concurrent_jobs);
            let mut tasks = Vec::new();

            for url in urls {
                let permit = semaphore.acquire().await.unwrap();
                let tx = tx.clone();
                let config = config.clone();
                
                let task = tokio::spawn(async move {
                    let _permit = permit; // Keep permit alive
                    let result = Self::process_single_video(&url, &config).await;
                    let _ = tx.send(result).await;
                });
                
                tasks.push(task);
            }

            drop(tx); // Close the channel when all tasks are spawned
            
            for task in tasks {
                let _ = task.await;
            }
        });

        // Collect results
        while let Some(result) = rx.recv().await {
            if let Some(job) = self.jobs.get_mut(job_id) {
                job.results.push(result.clone());
                job.progress.processed_videos = job.results.len();
                job.progress.percentage = (job.progress.processed_videos as f64 / job.progress.total_videos as f64) * 100.0;
                
                if result.status == ProcessingStatus::Failed {
                    job.progress.failed_videos += 1;
                }

                // Calculate ETA
                if let Some(start_time) = job.progress.start_time {
                    let elapsed_minutes = (chrono::Utc::now().timestamp() - start_time) as f64 / 60.0;
                    if job.progress.processed_videos > 0 {
                        let avg_time_per_video = elapsed_minutes / job.progress.processed_videos as f64;
                        let remaining_videos = job.progress.total_videos - job.progress.processed_videos;
                        job.progress.eta_minutes = Some(avg_time_per_video * remaining_videos as f64);
                    }
                }
            }
        }

        // Mark job as completed
        if let Some(job) = self.jobs.get_mut(job_id) {
            job.status = BatchStatus::Completed;
            job.completed_at = Some(chrono::Utc::now().to_rfc3339());
            job.progress.percentage = 100.0;
            job.progress.eta_minutes = Some(0.0);
        }

        Ok(())
    }

    async fn process_single_video(url: &str, config: &BatchConfig) -> BatchResult {
        let start_time = std::time::Instant::now();
        
        let mut result = BatchResult {
            url: url.to_string(),
            video_info: None,
            nuggets: Vec::new(),
            analysis: None,
            output_files: Vec::new(),
            status: ProcessingStatus::Success,
            error_message: None,
            processing_time_seconds: 0.0,
        };

        // Process with retries
        let mut retries = 0;
        let max_retries = if config.retry_failed { config.max_retries } else { 0 };

        while retries <= max_retries {
            match Self::attempt_video_processing(url, config).await {
                Ok((video_info, nuggets, analysis, output_files)) => {
                    result.video_info = Some(video_info);
                    result.nuggets = nuggets;
                    result.analysis = analysis;
                    result.output_files = output_files;
                    result.status = ProcessingStatus::Success;
                    break;
                }
                Err(error) => {
                    if retries < max_retries {
                        retries += 1;
                        result.status = ProcessingStatus::Retrying;
                        // Wait before retry (exponential backoff)
                        tokio::time::sleep(tokio::time::Duration::from_secs(2u64.pow(retries))).await;
                    } else {
                        result.status = ProcessingStatus::Failed;
                        result.error_message = Some(error);
                        break;
                    }
                }
            }
        }

        result.processing_time_seconds = start_time.elapsed().as_secs_f64();
        result
    }

    async fn attempt_video_processing(url: &str, config: &BatchConfig) -> Result<(VideoInfo, Vec<VideoNugget>, Option<ContentAnalysis>, Vec<String>), String> {
        let video_processor = VideoProcessor::new();
        let ffmpeg_processor = FFmpegProcessor::new()?;
        
        // Download and get video info
        let video_path = ffmpeg_processor.download_video(url, "best").await?;
        let video_info = ffmpeg_processor.get_video_info(&video_path)?;
        
        // Process video to create nuggets
        let processing_result = video_processor.process_video(url, config.video_config.clone()).await?;
        
        let mut output_files = Vec::new();
        let mut analysis = None;

        // Generate video clips if requested
        if config.enable_social_formats {
            let clips = ffmpeg_processor.create_video_clips(&video_path, &processing_result.nuggets, &config.output_directory)?;
            
            for clip in clips {
                output_files.push(clip.output_path);
                if let Some(thumb) = clip.thumbnail_path {
                    output_files.push(thumb);
                }
                
                // Create social media formats
                if config.enable_social_formats {
                    let social_formats = ffmpeg_processor.create_social_media_formats(&clip.output_path)?;
                    output_files.push(social_formats.tiktok);
                    output_files.push(social_formats.instagram);
                    output_files.push(social_formats.youtube_short);
                }
            }
        }

        // AI Analysis if enabled
        if config.enable_ai_analysis {
            // Extract transcript for analysis
            let audio_path = ffmpeg_processor.extract_audio(&video_path)?;
            let speech_recognizer = SpeechRecognizer::new()?;
            let transcript_analysis = speech_recognizer.transcribe_audio(&audio_path).await?;
            let full_transcript = transcript_analysis.segments
                .iter()
                .map(|s| s.text.as_str())
                .collect::<Vec<_>>()
                .join(" ");

            // Create AI analyzer (would need configuration)
            // analysis = Some(ai_analyzer.analyze_content(&full_transcript, &video_info.title, None).await?);
        }

        // Export in requested formats
        for format in &config.export_formats {
            let export_path = format!("{}/nuggets_{}.{}", config.output_directory, 
                chrono::Utc::now().timestamp(), format);
            
            match format.as_str() {
                "json" => {
                    let file_manager = crate::file_manager::FileManager::new();
                    file_manager.save_nuggets(processing_result.nuggets.clone(), &export_path).await?;
                    output_files.push(export_path);
                }
                "csv" => {
                    let file_manager = crate::file_manager::FileManager::new();
                    file_manager.export_as_csv(processing_result.nuggets.clone(), &export_path).await?;
                    output_files.push(export_path);
                }
                "markdown" => {
                    let file_manager = crate::file_manager::FileManager::new();
                    file_manager.export_as_markdown(processing_result.nuggets.clone(), &export_path).await?;
                    output_files.push(export_path);
                }
                _ => {} // Ignore unknown formats
            }
        }

        Ok((video_info, processing_result.nuggets, analysis, output_files))
    }

    pub fn get_batch_job(&self, job_id: &str) -> Option<&BatchJob> {
        self.jobs.get(job_id)
    }

    pub fn list_batch_jobs(&self) -> Vec<&BatchJob> {
        self.jobs.values().collect()
    }

    pub fn cancel_batch_job(&mut self, job_id: &str) -> Result<(), String> {
        let job = self.jobs.get_mut(job_id)
            .ok_or("Batch job not found")?;

        if job.status == BatchStatus::Running {
            job.status = BatchStatus::Cancelled;
            Ok(())
        } else {
            Err("Can only cancel running jobs".to_string())
        }
    }

    pub fn pause_batch_job(&mut self, job_id: &str) -> Result<(), String> {
        let job = self.jobs.get_mut(job_id)
            .ok_or("Batch job not found")?;

        if job.status == BatchStatus::Running {
            job.status = BatchStatus::Paused;
            Ok(())
        } else {
            Err("Can only pause running jobs".to_string())
        }
    }

    pub fn resume_batch_job(&mut self, job_id: &str) -> Result<(), String> {
        let job = self.jobs.get_mut(job_id)
            .ok_or("Batch job not found")?;

        if job.status == BatchStatus::Paused {
            job.status = BatchStatus::Running;
            Ok(())
        } else {
            Err("Can only resume paused jobs".to_string())
        }
    }

    pub fn delete_batch_job(&mut self, job_id: &str) -> Result<(), String> {
        let job = self.jobs.get(job_id)
            .ok_or("Batch job not found")?;

        if job.status == BatchStatus::Running {
            return Err("Cannot delete running job. Cancel it first.".to_string());
        }

        self.jobs.remove(job_id);
        Ok(())
    }

    pub async fn create_batch_from_playlist(&mut self, playlist_url: &str, name: String, config: BatchConfig) -> Result<String, String> {
        // Extract video URLs from playlist
        let urls = self.extract_playlist_urls(playlist_url).await?;
        Ok(self.create_batch_job(name, urls, config))
    }

    async fn extract_playlist_urls(&self, playlist_url: &str) -> Result<Vec<String>, String> {
        // Use yt-dlp or similar to extract video URLs from playlist
        let output = std::process::Command::new("yt-dlp")
            .args(&[
                "--get-url",
                "--flat-playlist",
                playlist_url,
            ])
            .output()
            .map_err(|e| format!("Failed to extract playlist URLs: {}", e))?;

        if output.status.success() {
            let urls = String::from_utf8_lossy(&output.stdout)
                .lines()
                .map(|line| line.trim().to_string())
                .filter(|line| !line.is_empty())
                .collect();
            Ok(urls)
        } else {
            Err(format!("Failed to extract playlist: {}", 
                String::from_utf8_lossy(&output.stderr)))
        }
    }

    pub async fn generate_batch_report(&self, job_id: &str) -> Result<String, String> {
        let job = self.jobs.get(job_id)
            .ok_or("Batch job not found")?;

        let mut report = String::new();
        report.push_str(&format!("# Batch Processing Report\n\n"));
        report.push_str(&format!("**Job Name:** {}\n", job.name));
        report.push_str(&format!("**Job ID:** {}\n", job.id));
        report.push_str(&format!("**Status:** {:?}\n", job.status));
        report.push_str(&format!("**Created:** {}\n", job.created_at));
        
        if let Some(started) = &job.started_at {
            report.push_str(&format!("**Started:** {}\n", started));
        }
        
        if let Some(completed) = &job.completed_at {
            report.push_str(&format!("**Completed:** {}\n", completed));
        }

        report.push_str(&format!("\n## Statistics\n\n"));
        report.push_str(&format!("- **Total Videos:** {}\n", job.progress.total_videos));
        report.push_str(&format!("- **Processed:** {}\n", job.progress.processed_videos));
        report.push_str(&format!("- **Failed:** {}\n", job.progress.failed_videos));
        report.push_str(&format!("- **Success Rate:** {:.1}%\n", 
            (job.progress.processed_videos - job.progress.failed_videos) as f64 / job.progress.total_videos as f64 * 100.0));

        report.push_str(&format!("\n## Results\n\n"));
        
        for (index, result) in job.results.iter().enumerate() {
            report.push_str(&format!("### Video {} - {:?}\n", index + 1, result.status));
            report.push_str(&format!("**URL:** {}\n", result.url));
            
            if let Some(info) = &result.video_info {
                report.push_str(&format!("**Title:** {}\n", info.title));
                report.push_str(&format!("**Duration:** {:.1}s\n", info.duration));
            }
            
            report.push_str(&format!("**Nuggets Generated:** {}\n", result.nuggets.len()));
            report.push_str(&format!("**Processing Time:** {:.1}s\n", result.processing_time_seconds));
            report.push_str(&format!("**Output Files:** {}\n", result.output_files.len()));
            
            if let Some(error) = &result.error_message {
                report.push_str(&format!("**Error:** {}\n", error));
            }
            
            report.push_str("\n");
        }

        Ok(report)
    }
}