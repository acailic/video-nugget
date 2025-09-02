use crate::{VideoNugget, ProcessingResult};
use serde_json;
use std::collections::HashMap;
use uuid::Uuid;

pub struct VideoProcessor {
    // Add any state needed for video processing
}

impl VideoProcessor {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn process_video(
        &self,
        url: &str,
        config: HashMap<String, serde_json::Value>
    ) -> Result<ProcessingResult, String> {
        // Extract configuration parameters
        let nugget_duration = config.get("nugget_duration")
            .and_then(|v| v.as_f64())
            .unwrap_or(30.0); // Default 30 seconds

        let overlap_duration = config.get("overlap_duration")
            .and_then(|v| v.as_f64())
            .unwrap_or(5.0); // Default 5 seconds overlap

        let extract_transcript = config.get("extract_transcript")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);

        // Get video duration first
        let youtube_extractor = crate::youtube_extractor::YouTubeExtractor::new();
        let video_info = youtube_extractor.get_video_info(url).await?;

        // Generate nuggets based on duration and configuration
        let mut nuggets = Vec::new();
        let mut current_time = 0.0;
        let mut nugget_index = 1;

        while current_time < video_info.duration {
            let end_time = (current_time + nugget_duration).min(video_info.duration);
            
            // Create nugget
            let nugget = VideoNugget {
                id: Uuid::new_v4().to_string(),
                title: format!("{} - Part {}", video_info.title, nugget_index),
                start_time: current_time,
                end_time,
                transcript: if extract_transcript {
                    Some(self.extract_transcript_segment(url, current_time, end_time).await?)
                } else {
                    None
                },
                tags: self.generate_tags(&video_info.title),
                created_at: chrono::Utc::now().to_rfc3339(),
            };

            nuggets.push(nugget);

            // Move to next segment with overlap
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

    async fn extract_transcript_segment(
        &self,
        _url: &str,
        start_time: f64,
        end_time: f64
    ) -> Result<String, String> {
        // TODO: Implement actual transcript extraction
        // For now, return a placeholder
        Ok(format!("Transcript segment from {:.2}s to {:.2}s", start_time, end_time))
    }

    pub fn generate_tags(&self, title: &str) -> Vec<String> {
        // Simple tag generation based on title
        let mut tags = Vec::new();
        let title_lower = title.to_lowercase();
        
        // Add some basic tags based on common video content
        if title_lower.contains("tutorial") {
            tags.push("tutorial".to_string());
        }
        if title_lower.contains("review") {
            tags.push("review".to_string());
        }
        if title_lower.contains("music") {
            tags.push("music".to_string());
        }
        if title_lower.contains("tech") || title_lower.contains("technology") {
            tags.push("technology".to_string());
        }
        if title_lower.contains("gaming") || title_lower.contains("game") {
            tags.push("gaming".to_string());
        }
        if title_lower.contains("cooking") || title_lower.contains("recipe") {
            tags.push("cooking".to_string());
        }

        // Add general tag
        tags.push("video-nugget".to_string());
        
        tags
    }

    pub async fn extract_audio(&self, url: &str, output_path: &str) -> Result<String, String> {
        if url.is_empty() {
            return Err("URL cannot be empty".to_string());
        }
        if output_path.is_empty() {
            return Err("Output path cannot be empty".to_string());
        }
        
        // TODO: Implement audio extraction using ffmpeg or similar
        Ok(format!("Audio extracted to: {}", output_path))
    }

    pub async fn generate_thumbnail(&self, url: &str, timestamp: f64, output_path: &str) -> Result<String, String> {
        if url.is_empty() {
            return Err("URL cannot be empty".to_string());
        }
        if timestamp < 0.0 {
            return Err("Timestamp cannot be negative".to_string());
        }
        if output_path.is_empty() {
            return Err("Output path cannot be empty".to_string());
        }
        
        // TODO: Implement thumbnail generation at specific timestamp
        Ok(format!("Thumbnail generated at {}s: {}", timestamp, output_path))
    }

    /// Validate processing configuration
    pub fn validate_config(&self, config: &HashMap<String, serde_json::Value>) -> Result<(), String> {
        if let Some(nugget_duration) = config.get("nugget_duration") {
            if let Some(duration) = nugget_duration.as_f64() {
                if duration <= 0.0 || duration > 600.0 {
                    return Err("Nugget duration must be between 0 and 600 seconds".to_string());
                }
            } else {
                return Err("Nugget duration must be a number".to_string());
            }
        }

        if let Some(overlap_duration) = config.get("overlap_duration") {
            if let Some(overlap) = overlap_duration.as_f64() {
                if overlap < 0.0 {
                    return Err("Overlap duration cannot be negative".to_string());
                }
                
                // Check if overlap is less than nugget duration
                let nugget_duration = config.get("nugget_duration")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(30.0);
                
                if overlap >= nugget_duration {
                    return Err("Overlap duration must be less than nugget duration".to_string());
                }
            } else {
                return Err("Overlap duration must be a number".to_string());
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_new_processor() {
        let _processor = VideoProcessor::new();
        // Just verify it can be created
        assert!(true);
    }

    #[test]
    fn test_generate_tags_tutorial() {
        let processor = VideoProcessor::new();
        let tags = processor.generate_tags("How to Code - Tutorial");
        
        assert!(tags.contains(&"tutorial".to_string()));
        assert!(tags.contains(&"video-nugget".to_string()));
        assert_eq!(tags.len(), 2);
    }

    #[test]
    fn test_generate_tags_multiple() {
        let processor = VideoProcessor::new();
        let tags = processor.generate_tags("Tech Review Tutorial - Best Gaming Setup");
        
        assert!(tags.contains(&"tutorial".to_string()));
        assert!(tags.contains(&"review".to_string()));
        assert!(tags.contains(&"technology".to_string()));
        assert!(tags.contains(&"gaming".to_string()));
        assert!(tags.contains(&"video-nugget".to_string()));
        assert_eq!(tags.len(), 5);
    }

    #[test]
    fn test_generate_tags_no_matches() {
        let processor = VideoProcessor::new();
        let tags = processor.generate_tags("Random Video Title");
        
        assert_eq!(tags.len(), 1);
        assert!(tags.contains(&"video-nugget".to_string()));
    }

    #[test]
    fn test_generate_tags_case_insensitive() {
        let processor = VideoProcessor::new();
        let tags = processor.generate_tags("COOKING Recipe TUTORIAL");
        
        assert!(tags.contains(&"tutorial".to_string()));
        assert!(tags.contains(&"cooking".to_string()));
        assert!(tags.contains(&"video-nugget".to_string()));
    }

    #[tokio::test]
    async fn test_extract_audio_valid_inputs() {
        let processor = VideoProcessor::new();
        let result = processor.extract_audio("https://youtube.com/watch?v=test", "/tmp/audio.mp3").await;
        
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Audio extracted to: /tmp/audio.mp3"));
    }

    #[tokio::test]
    async fn test_extract_audio_empty_url() {
        let processor = VideoProcessor::new();
        let result = processor.extract_audio("", "/tmp/audio.mp3").await;
        
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "URL cannot be empty");
    }

    #[tokio::test]
    async fn test_extract_audio_empty_output_path() {
        let processor = VideoProcessor::new();
        let result = processor.extract_audio("https://youtube.com/watch?v=test", "").await;
        
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Output path cannot be empty");
    }

    #[tokio::test]
    async fn test_generate_thumbnail_valid_inputs() {
        let processor = VideoProcessor::new();
        let result = processor.generate_thumbnail("https://youtube.com/watch?v=test", 30.0, "/tmp/thumb.jpg").await;
        
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Thumbnail generated at 30s: /tmp/thumb.jpg"));
    }

    #[tokio::test]
    async fn test_generate_thumbnail_negative_timestamp() {
        let processor = VideoProcessor::new();
        let result = processor.generate_thumbnail("https://youtube.com/watch?v=test", -5.0, "/tmp/thumb.jpg").await;
        
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Timestamp cannot be negative");
    }

    #[test]
    fn test_validate_config_valid() {
        let processor = VideoProcessor::new();
        let config = HashMap::from([
            ("nugget_duration".to_string(), json!(30.0)),
            ("overlap_duration".to_string(), json!(5.0)),
            ("extract_transcript".to_string(), json!(true)),
        ]);
        
        let result = processor.validate_config(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_config_invalid_nugget_duration() {
        let processor = VideoProcessor::new();
        let config = HashMap::from([
            ("nugget_duration".to_string(), json!(-5.0)),
        ]);
        
        let result = processor.validate_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Nugget duration must be between 0 and 600 seconds"));
    }

    #[test]
    fn test_validate_config_invalid_overlap_duration() {
        let processor = VideoProcessor::new();
        let config = HashMap::from([
            ("nugget_duration".to_string(), json!(30.0)),
            ("overlap_duration".to_string(), json!(35.0)), // Greater than nugget duration
        ]);
        
        let result = processor.validate_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Overlap duration must be less than nugget duration"));
    }

    #[test]
    fn test_validate_config_non_numeric_values() {
        let processor = VideoProcessor::new();
        let config = HashMap::from([
            ("nugget_duration".to_string(), json!("not a number")),
        ]);
        
        let result = processor.validate_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Nugget duration must be a number"));
    }

    #[test]
    fn test_validate_config_empty() {
        let processor = VideoProcessor::new();
        let config = HashMap::new();
        
        let result = processor.validate_config(&config);
        assert!(result.is_ok()); // Empty config should use defaults
    }
}