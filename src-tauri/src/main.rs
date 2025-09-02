// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

mod video_processor;
mod youtube_extractor;
mod youtube_api;
mod file_manager;
mod ffmpeg_processor;
mod speech_recognition;
mod ai_analyzer;
mod batch_processor;
mod project_manager;

use video_processor::VideoProcessor;
use youtube_extractor::YouTubeExtractor;
use youtube_api::YouTubeAPI;
use file_manager::FileManager;
use ffmpeg_processor::FFmpegProcessor;
use speech_recognition::{SpeechRecognizer, SpeechAnalysis, SubtitleFormat};
use ai_analyzer::{AIAnalyzer, AIConfig, ContentAnalysis};
use batch_processor::{BatchProcessor, BatchJob, BatchConfig};
use project_manager::{ProjectManager, Project, VideoProject};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct VideoNugget {
    pub id: String,
    pub title: String,
    pub start_time: f64,
    pub end_time: f64,
    pub transcript: Option<String>,
    pub tags: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessingResult {
    pub success: bool,
    pub message: String,
    pub nuggets: Vec<VideoNugget>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VideoInfo {
    pub title: String,
    pub duration: f64,
    pub url: String,
    pub thumbnail: Option<String>,
}

// Command to extract video information
#[tauri::command]
async fn get_video_info(url: String) -> Result<VideoInfo, String> {
    let extractor = YouTubeExtractor::new();
    extractor.get_video_info(&url).await
}

// Command to process video and extract nuggets
#[tauri::command]
async fn process_video(url: String, config: HashMap<String, serde_json::Value>) -> Result<ProcessingResult, String> {
    let processor = VideoProcessor::new();
    processor.process_video(&url, config).await
}

// Command to save nuggets to file
#[tauri::command]
async fn save_nuggets(nuggets: Vec<VideoNugget>, filepath: String) -> Result<String, String> {
    let file_manager = FileManager::new();
    file_manager.save_nuggets(nuggets, &filepath).await
}

// Command to load nuggets from file
#[tauri::command]
async fn load_nuggets(filepath: String) -> Result<Vec<VideoNugget>, String> {
    let file_manager = FileManager::new();
    file_manager.load_nuggets(&filepath).await
}

// Command to export nuggets in different formats
#[tauri::command]
async fn export_nuggets(nuggets: Vec<VideoNugget>, format: String, filepath: String) -> Result<String, String> {
    let file_manager = FileManager::new();
    match format.as_str() {
        "json" => file_manager.export_as_json(nuggets, &filepath).await,
        "csv" => file_manager.export_as_csv(nuggets, &filepath).await,
        "markdown" => file_manager.export_as_markdown(nuggets, &filepath).await,
        _ => Err("Unsupported export format".to_string()),
    }
}

// Command to get application version
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// Command to open file in default application
#[tauri::command]
async fn open_file(filepath: String) -> Result<(), String> {
    tauri_plugin_shell::ShellExt::open(&tauri_plugin_shell::Shell::default(), &filepath, None)
        .map_err(|e| format!("Failed to open file: {}", e))
}

// Advanced processing commands
#[tauri::command]
async fn process_video_advanced(url: String, config: HashMap<String, serde_json::Value>) -> Result<ProcessingResult, String> {
    let ffmpeg_processor = FFmpegProcessor::new()?;
    let speech_recognizer = SpeechRecognizer::new()?;
    
    // Download video
    let video_path = ffmpeg_processor.download_video(&url, "best").await?;
    let video_info = ffmpeg_processor.get_video_info(&video_path)?;
    
    // Extract audio for transcription
    let audio_path = ffmpeg_processor.extract_audio(&video_path)?;
    
    // Get configuration
    let nugget_duration = config.get("nugget_duration")
        .and_then(|v| v.as_f64())
        .unwrap_or(30.0);
    
    let overlap_duration = config.get("overlap_duration")
        .and_then(|v| v.as_f64())
        .unwrap_or(5.0);
    
    let enable_transcript = config.get("enable_transcript")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    
    // Generate nuggets with transcription
    let mut nuggets = Vec::new();
    let mut current_time = 0.0;
    let mut nugget_index = 1;

    while current_time < video_info.duration {
        let end_time = (current_time + nugget_duration).min(video_info.duration);
        
        let transcript = if enable_transcript {
            speech_recognizer.transcribe_segment(&audio_path, current_time, end_time).await.ok()
        } else {
            None
        };

        let nugget = VideoNugget {
            id: uuid::Uuid::new_v4().to_string(),
            title: format!("{} - Part {}", video_info.title, nugget_index),
            start_time: current_time,
            end_time,
            transcript,
            tags: vec!["video-nugget".to_string()],
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        nuggets.push(nugget);
        current_time = end_time - overlap_duration;
        
        if current_time >= video_info.duration - 1.0 {
            break;
        }
        
        nugget_index += 1;
    }

    Ok(ProcessingResult {
        success: true,
        message: format!("Successfully processed video into {} nuggets", nuggets.len()),
        nuggets,
    })
}

#[tauri::command]
async fn extract_transcript(url: String) -> Result<SpeechAnalysis, String> {
    let ffmpeg_processor = FFmpegProcessor::new()?;
    let speech_recognizer = SpeechRecognizer::new()?;
    
    let video_path = ffmpeg_processor.download_video(&url, "best").await?;
    let audio_path = ffmpeg_processor.extract_audio(&video_path)?;
    
    speech_recognizer.transcribe_audio(&audio_path).await
}

#[tauri::command]
async fn analyze_content(transcript: String, title: String, description: Option<String>) -> Result<ContentAnalysis, String> {
    let ai_config = AIConfig {
        openai_api_key: None, // Would be configured by user
        claude_api_key: None,
        gemini_api_key: None,
        model_preference: ai_analyzer::AIModel::Local,
        enable_sentiment_analysis: true,
        enable_topic_extraction: true,
        enable_highlight_detection: true,
    };
    
    let analyzer = AIAnalyzer::new(ai_config);
    analyzer.analyze_content(&transcript, &title, description.as_deref()).await
}

#[tauri::command]
async fn generate_subtitles(transcript_segments: Vec<serde_json::Value>, format: String) -> Result<String, String> {
    // Convert JSON to TranscriptSegment objects
    let segments: Result<Vec<_>, _> = transcript_segments.iter()
        .map(|v| serde_json::from_value(v.clone()))
        .collect();
    
    let segments = segments.map_err(|e| format!("Failed to parse transcript segments: {}", e))?;
    
    let speech_analysis = SpeechAnalysis {
        segments,
        language: "en".to_string(),
        total_speech_time: 0.0,
        word_count: 0,
        average_confidence: 0.0,
    };
    
    let subtitle_format = match format.as_str() {
        "srt" => SubtitleFormat::SRT,
        "vtt" => SubtitleFormat::VTT,
        "ass" => SubtitleFormat::ASS,
        _ => return Err("Unsupported subtitle format".to_string()),
    };
    
    let speech_recognizer = SpeechRecognizer::new()?;
    speech_recognizer.generate_subtitles(&speech_analysis, subtitle_format).await
}

#[tauri::command]
async fn create_social_formats(video_path: String) -> Result<serde_json::Value, String> {
    let ffmpeg_processor = FFmpegProcessor::new()?;
    let formats = ffmpeg_processor.create_social_media_formats(&video_path)?;
    
    Ok(serde_json::to_value(formats)
        .map_err(|e| format!("Failed to serialize formats: {}", e))?)
}

// Batch processing commands
#[tauri::command]
async fn create_batch_job(
    name: String,
    urls: Vec<String>,
    config: serde_json::Value,
    state: tauri::State<'_, Arc<Mutex<BatchProcessor>>>
) -> Result<String, String> {
    let batch_config: BatchConfig = serde_json::from_value(config)
        .map_err(|e| format!("Invalid batch config: {}", e))?;
    
    let mut processor = state.lock().await;
    Ok(processor.create_batch_job(name, urls, batch_config))
}

#[tauri::command]
async fn start_batch_job(
    job_id: String,
    state: tauri::State<'_, Arc<Mutex<BatchProcessor>>>
) -> Result<(), String> {
    let mut processor = state.lock().await;
    processor.start_batch_job(&job_id).await
}

#[tauri::command]
async fn get_batch_job_status(
    job_id: String,
    state: tauri::State<'_, Arc<Mutex<BatchProcessor>>>
) -> Result<Option<BatchJob>, String> {
    let processor = state.lock().await;
    Ok(processor.get_batch_job(&job_id).cloned())
}

#[tauri::command]
async fn cancel_batch_job(
    job_id: String,
    state: tauri::State<'_, Arc<Mutex<BatchProcessor>>>
) -> Result<(), String> {
    let mut processor = state.lock().await;
    processor.cancel_batch_job(&job_id)
}

#[tauri::command]
async fn list_batch_jobs(
    state: tauri::State<'_, Arc<Mutex<BatchProcessor>>>
) -> Result<Vec<BatchJob>, String> {
    let processor = state.lock().await;
    Ok(processor.list_batch_jobs().into_iter().cloned().collect())
}

// Project management commands
#[tauri::command]
async fn create_project(
    name: String,
    description: Option<String>,
    template_id: Option<String>,
    state: tauri::State<'_, Arc<Mutex<ProjectManager>>>
) -> Result<String, String> {
    let mut manager = state.lock().await;
    manager.create_project(name, description, template_id)
}

#[tauri::command]
async fn add_video_to_project(
    project_id: String,
    video_info: VideoInfo,
    nuggets: Vec<VideoNugget>,
    analysis: Option<ContentAnalysis>,
    state: tauri::State<'_, Arc<Mutex<ProjectManager>>>
) -> Result<String, String> {
    let mut manager = state.lock().await;
    manager.add_video_to_project(&project_id, video_info, nuggets, analysis)
}

#[tauri::command]
async fn get_project(
    project_id: String,
    state: tauri::State<'_, Arc<Mutex<ProjectManager>>>
) -> Result<Option<Project>, String> {
    let manager = state.lock().await;
    Ok(manager.get_project(&project_id).cloned())
}

#[tauri::command]
async fn list_projects(
    state: tauri::State<'_, Arc<Mutex<ProjectManager>>>
) -> Result<Vec<Project>, String> {
    let manager = state.lock().await;
    Ok(manager.list_projects().into_iter().cloned().collect())
}

#[tauri::command]
async fn update_project_settings(
    project_id: String,
    settings: serde_json::Value,
    state: tauri::State<'_, Arc<Mutex<ProjectManager>>>
) -> Result<(), String> {
    let settings = serde_json::from_value(settings)
        .map_err(|e| format!("Invalid project settings: {}", e))?;
    
    let mut manager = state.lock().await;
    manager.update_project_settings(&project_id, settings)
}

#[tauri::command]
async fn delete_project(
    project_id: String,
    state: tauri::State<'_, Arc<Mutex<ProjectManager>>>
) -> Result<(), String> {
    let mut manager = state.lock().await;
    manager.delete_project(&project_id)
}

#[tauri::command]
async fn export_project(
    project_id: String,
    export_path: String,
    include_files: bool,
    state: tauri::State<'_, Arc<Mutex<ProjectManager>>>
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.export_project(&project_id, &export_path, include_files)
}

#[tauri::command]
async fn import_project(
    import_path: String,
    state: tauri::State<'_, Arc<Mutex<ProjectManager>>>
) -> Result<String, String> {
    let mut manager = state.lock().await;
    manager.import_project(&import_path)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_video_info,
            process_video,
            save_nuggets,
            load_nuggets,
            export_nuggets,
            get_app_version,
            open_file,
            // Advanced processing commands
            process_video_advanced,
            extract_transcript,
            analyze_content,
            generate_subtitles,
            create_social_formats,
            // Batch processing commands
            create_batch_job,
            start_batch_job,
            get_batch_job_status,
            cancel_batch_job,
            list_batch_jobs,
            // Project management commands
            create_project,
            add_video_to_project,
            get_project,
            list_projects,
            update_project_settings,
            delete_project,
            export_project,
            import_project
        ])
        .setup(|app| {
            // Initialize application state
            let workspace_path = std::env::current_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."))
                .join("workspace");
            
            let project_manager = ProjectManager::new(workspace_path)
                .expect("Failed to initialize project manager");
            
            let batch_processor = BatchProcessor::new(None)
                .expect("Failed to initialize batch processor");
            
            app.manage(Arc::new(Mutex::new(project_manager)));
            app.manage(Arc::new(Mutex::new(batch_processor)));
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}