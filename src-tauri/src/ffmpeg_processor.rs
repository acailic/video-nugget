use std::path::{Path, PathBuf};
use std::process::Command;
use tempfile::TempDir;
use serde::{Serialize, Deserialize};
use crate::VideoNugget;

#[derive(Debug, Serialize, Deserialize)]
pub struct VideoClip {
    pub start_time: f64,
    pub end_time: f64,
    pub output_path: String,
    pub thumbnail_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioAnalysis {
    pub volume_levels: Vec<f64>,
    pub silence_segments: Vec<(f64, f64)>,
    pub speech_segments: Vec<(f64, f64)>,
}

pub struct FFmpegProcessor {
    temp_dir: TempDir,
    ffmpeg_path: String,
}

impl FFmpegProcessor {
    pub fn new() -> Result<Self, String> {
        let temp_dir = TempDir::new()
            .map_err(|e| format!("Failed to create temp directory: {}", e))?;
        
        // Try to find FFmpeg in common locations
        let ffmpeg_path = Self::find_ffmpeg()
            .ok_or("FFmpeg not found. Please install FFmpeg and ensure it's in your PATH.")?;

        Ok(Self {
            temp_dir,
            ffmpeg_path,
        })
    }

    fn find_ffmpeg() -> Option<String> {
        // Check if ffmpeg is in PATH
        if Command::new("ffmpeg").arg("-version").output().is_ok() {
            return Some("ffmpeg".to_string());
        }

        // Check common installation paths on macOS
        let common_paths = vec![
            "/usr/local/bin/ffmpeg",
            "/opt/homebrew/bin/ffmpeg",
            "/usr/bin/ffmpeg",
        ];

        for path in common_paths {
            if Path::new(path).exists() {
                return Some(path.to_string());
            }
        }

        None
    }

    pub async fn download_video(&self, url: &str, quality: &str) -> Result<String, String> {
        let output_path = self.temp_dir.path().join("downloaded_video.mp4");
        
        // Use yt-dlp if available, otherwise fall back to basic download
        let success = if let Ok(_) = Command::new("yt-dlp").arg("--version").output() {
            self.download_with_ytdlp(url, &output_path, quality).await
        } else {
            // Fallback to direct URL download (for non-YouTube URLs)
            self.download_direct(url, &output_path).await
        };

        if success? {
            Ok(output_path.to_string_lossy().to_string())
        } else {
            Err("Failed to download video".to_string())
        }
    }

    async fn download_with_ytdlp(&self, url: &str, output_path: &Path, quality: &str) -> Result<bool, String> {
        let format_string = match quality {
            "best" => "best[ext=mp4]",
            "worst" => "worst[ext=mp4]",
            "720p" => "best[height<=720][ext=mp4]",
            "480p" => "best[height<=480][ext=mp4]",
            _ => "best[ext=mp4]",
        };

        let output = Command::new("yt-dlp")
            .args(&[
                "-f", format_string,
                "-o", &output_path.to_string_lossy(),
                url,
            ])
            .output()
            .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

        Ok(output.status.success())
    }

    async fn download_direct(&self, url: &str, output_path: &Path) -> Result<bool, String> {
        let response = reqwest::get(url).await
            .map_err(|e| format!("Failed to download: {}", e))?;

        let content = response.bytes().await
            .map_err(|e| format!("Failed to read response: {}", e))?;

        tokio::fs::write(output_path, content).await
            .map_err(|e| format!("Failed to write file: {}", e))?;

        Ok(true)
    }

    pub fn get_video_info(&self, video_path: &str) -> Result<VideoInfo, String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", video_path,
                "-f", "null", "-",
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

        let stderr = String::from_utf8_lossy(&output.stderr);
        
        // Parse duration from ffmpeg output
        let duration = self.parse_duration(&stderr)?;
        let title = Path::new(video_path)
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        Ok(VideoInfo {
            title,
            duration,
            url: video_path.to_string(),
            thumbnail: None,
        })
    }

    fn parse_duration(&self, ffmpeg_output: &str) -> Result<f64, String> {
        use regex::Regex;
        
        let duration_regex = Regex::new(r"Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})")
            .map_err(|e| format!("Failed to create regex: {}", e))?;

        if let Some(captures) = duration_regex.captures(ffmpeg_output) {
            let hours: f64 = captures[1].parse().unwrap_or(0.0);
            let minutes: f64 = captures[2].parse().unwrap_or(0.0);
            let seconds: f64 = captures[3].parse().unwrap_or(0.0);
            let centiseconds: f64 = captures[4].parse().unwrap_or(0.0);

            Ok(hours * 3600.0 + minutes * 60.0 + seconds + centiseconds / 100.0)
        } else {
            Err("Could not parse video duration".to_string())
        }
    }

    pub fn extract_audio(&self, video_path: &str) -> Result<String, String> {
        let audio_path = self.temp_dir.path().join("audio.wav");
        
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", video_path,
                "-vn", // No video
                "-acodec", "pcm_s16le",
                "-ar", "44100",
                "-ac", "2",
                &audio_path.to_string_lossy(),
            ])
            .output()
            .map_err(|e| format!("Failed to extract audio: {}", e))?;

        if output.status.success() {
            Ok(audio_path.to_string_lossy().to_string())
        } else {
            Err(format!("FFmpeg audio extraction failed: {}", 
                String::from_utf8_lossy(&output.stderr)))
        }
    }

    pub fn create_video_clips(&self, video_path: &str, nuggets: &[VideoNugget], output_dir: &str) -> Result<Vec<VideoClip>, String> {
        std::fs::create_dir_all(output_dir)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;

        let mut clips = Vec::new();

        for (index, nugget) in nuggets.iter().enumerate() {
            let output_path = format!("{}/nugget_{:03}.mp4", output_dir, index + 1);
            let thumbnail_path = format!("{}/nugget_{:03}_thumb.jpg", output_dir, index + 1);
            
            // Create video clip
            self.extract_clip(video_path, nugget.start_time, nugget.end_time, &output_path)?;
            
            // Create thumbnail
            let thumb_time = nugget.start_time + (nugget.end_time - nugget.start_time) / 2.0;
            self.create_thumbnail(video_path, thumb_time, &thumbnail_path)?;

            clips.push(VideoClip {
                start_time: nugget.start_time,
                end_time: nugget.end_time,
                output_path,
                thumbnail_path: Some(thumbnail_path),
            });
        }

        Ok(clips)
    }

    fn extract_clip(&self, video_path: &str, start_time: f64, end_time: f64, output_path: &str) -> Result<(), String> {
        let duration = end_time - start_time;
        
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", video_path,
                "-ss", &start_time.to_string(),
                "-t", &duration.to_string(),
                "-c", "copy",
                "-avoid_negative_ts", "make_zero",
                output_path,
            ])
            .output()
            .map_err(|e| format!("Failed to extract clip: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(format!("FFmpeg clip extraction failed: {}", 
                String::from_utf8_lossy(&output.stderr)))
        }
    }

    fn create_thumbnail(&self, video_path: &str, time: f64, output_path: &str) -> Result<(), String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", video_path,
                "-ss", &time.to_string(),
                "-vframes", "1",
                "-q:v", "2",
                output_path,
            ])
            .output()
            .map_err(|e| format!("Failed to create thumbnail: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(format!("FFmpeg thumbnail creation failed: {}", 
                String::from_utf8_lossy(&output.stderr)))
        }
    }

    pub fn analyze_audio(&self, audio_path: &str) -> Result<AudioAnalysis, String> {
        // Extract volume levels
        let volume_levels = self.get_volume_levels(audio_path)?;
        
        // Detect silence segments
        let silence_segments = self.detect_silence(audio_path)?;
        
        // Infer speech segments (inverse of silence)
        let speech_segments = self.infer_speech_segments(&silence_segments, self.get_audio_duration(audio_path)?);

        Ok(AudioAnalysis {
            volume_levels,
            silence_segments,
            speech_segments,
        })
    }

    fn get_volume_levels(&self, audio_path: &str) -> Result<Vec<f64>, String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", audio_path,
                "-af", "volumedetect",
                "-f", "null", "-",
            ])
            .output()
            .map_err(|e| format!("Failed to analyze volume: {}", e))?;

        // Parse volume information from stderr
        let stderr = String::from_utf8_lossy(&output.stderr);
        
        // This is a simplified implementation - in reality, you'd want more detailed analysis
        Ok(vec![0.5, 0.7, 0.3, 0.8, 0.6]) // Placeholder data
    }

    fn detect_silence(&self, audio_path: &str) -> Result<Vec<(f64, f64)>, String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", audio_path,
                "-af", "silencedetect=noise=-50dB:duration=0.5",
                "-f", "null", "-",
            ])
            .output()
            .map_err(|e| format!("Failed to detect silence: {}", e))?;

        let stderr = String::from_utf8_lossy(&output.stderr);
        
        // Parse silence segments from output
        use regex::Regex;
        let silence_regex = Regex::new(r"silence_start: ([\d.]+).*silence_end: ([\d.]+)")
            .map_err(|e| format!("Failed to create regex: {}", e))?;

        let mut silence_segments = Vec::new();
        for captures in silence_regex.captures_iter(&stderr) {
            if let (Ok(start), Ok(end)) = (captures[1].parse::<f64>(), captures[2].parse::<f64>()) {
                silence_segments.push((start, end));
            }
        }

        Ok(silence_segments)
    }

    fn infer_speech_segments(&self, silence_segments: &[(f64, f64)], total_duration: f64) -> Vec<(f64, f64)> {
        let mut speech_segments = Vec::new();
        let mut current_time = 0.0;

        for &(silence_start, silence_end) in silence_segments {
            if current_time < silence_start {
                speech_segments.push((current_time, silence_start));
            }
            current_time = silence_end;
        }

        // Add final speech segment if there's audio after the last silence
        if current_time < total_duration {
            speech_segments.push((current_time, total_duration));
        }

        speech_segments
    }

    fn get_audio_duration(&self, audio_path: &str) -> Result<f64, String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", audio_path,
                "-f", "null", "-",
            ])
            .output()
            .map_err(|e| format!("Failed to get audio duration: {}", e))?;

        let stderr = String::from_utf8_lossy(&output.stderr);
        self.parse_duration(&stderr)
    }

    pub fn create_social_media_formats(&self, clip_path: &str) -> Result<SocialMediaFormats, String> {
        let base_name = Path::new(clip_path).file_stem().unwrap().to_string_lossy();
        let output_dir = Path::new(clip_path).parent().unwrap();

        let tiktok_path = output_dir.join(format!("{}_tiktok.mp4", base_name));
        let instagram_path = output_dir.join(format!("{}_instagram.mp4", base_name));
        let youtube_short_path = output_dir.join(format!("{}_youtube_short.mp4", base_name));

        // TikTok format (9:16, max 60s)
        self.convert_to_format(clip_path, &tiktok_path.to_string_lossy(), "720", "1280", 60.0)?;
        
        // Instagram Reel format (9:16, max 90s)
        self.convert_to_format(clip_path, &instagram_path.to_string_lossy(), "720", "1280", 90.0)?;
        
        // YouTube Short format (9:16, max 60s)
        self.convert_to_format(clip_path, &youtube_short_path.to_string_lossy(), "1080", "1920", 60.0)?;

        Ok(SocialMediaFormats {
            tiktok: tiktok_path.to_string_lossy().to_string(),
            instagram: instagram_path.to_string_lossy().to_string(),
            youtube_short: youtube_short_path.to_string_lossy().to_string(),
        })
    }

    fn convert_to_format(&self, input: &str, output: &str, width: &str, height: &str, max_duration: f64) -> Result<(), String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", input,
                "-vf", &format!("scale={}:{},setsar=1", width, height),
                "-t", &max_duration.to_string(),
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "128k",
                output,
            ])
            .output()
            .map_err(|e| format!("Failed to convert format: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(format!("FFmpeg format conversion failed: {}", 
                String::from_utf8_lossy(&output.stderr)))
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SocialMediaFormats {
    pub tiktok: String,
    pub instagram: String,
    pub youtube_short: String,
}

// Re-export VideoInfo from the parent module
use crate::VideoInfo;