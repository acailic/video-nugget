use serde::{Serialize, Deserialize};
use std::process::Command;
use tempfile::TempDir;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct TranscriptSegment {
    pub start_time: f64,
    pub end_time: f64,
    pub text: String,
    pub confidence: f64,
    pub speaker_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeechAnalysis {
    pub segments: Vec<TranscriptSegment>,
    pub language: String,
    pub total_speech_time: f64,
    pub word_count: usize,
    pub average_confidence: f64,
}

pub struct SpeechRecognizer {
    temp_dir: TempDir,
    whisper_path: Option<String>,
}

impl SpeechRecognizer {
    pub fn new() -> Result<Self, String> {
        let temp_dir = TempDir::new()
            .map_err(|e| format!("Failed to create temp directory: {}", e))?;
        
        let whisper_path = Self::find_whisper();
        
        Ok(Self {
            temp_dir,
            whisper_path,
        })
    }

    fn find_whisper() -> Option<String> {
        // Check if Whisper is installed
        let whisper_commands = vec!["whisper", "openai-whisper", "whisper-cpp"];
        
        for cmd in whisper_commands {
            if Command::new(cmd).arg("--version").output().is_ok() {
                return Some(cmd.to_string());
            }
        }

        // Check common installation paths
        let common_paths = vec![
            "/usr/local/bin/whisper",
            "/opt/homebrew/bin/whisper",
            "/usr/bin/whisper",
            "~/.local/bin/whisper",
        ];

        for path in common_paths {
            if Path::new(path).exists() {
                return Some(path.to_string());
            }
        }

        None
    }

    pub async fn transcribe_audio(&self, audio_path: &str) -> Result<SpeechAnalysis, String> {
        if let Some(ref whisper_path) = self.whisper_path {
            self.transcribe_with_whisper(audio_path, whisper_path).await
        } else {
            // Fallback to cloud-based speech recognition
            self.transcribe_with_cloud_api(audio_path).await
        }
    }

    async fn transcribe_with_whisper(&self, audio_path: &str, whisper_path: &str) -> Result<SpeechAnalysis, String> {
        let output_dir = self.temp_dir.path();
        let output_format = "json";
        
        let output = Command::new(whisper_path)
            .args(&[
                audio_path,
                "--output_dir", &output_dir.to_string_lossy(),
                "--output_format", output_format,
                "--verbose", "False",
                "--language", "auto", // Auto-detect language
                "--task", "transcribe",
                "--word_timestamps", "True", // Get word-level timestamps
            ])
            .output()
            .map_err(|e| format!("Failed to execute whisper: {}", e))?;

        if !output.status.success() {
            return Err(format!("Whisper transcription failed: {}", 
                String::from_utf8_lossy(&output.stderr)));
        }

        // Parse Whisper JSON output
        let json_path = output_dir.join(
            Path::new(audio_path).file_stem().unwrap().to_string_lossy() + ".json"
        );

        let json_content = tokio::fs::read_to_string(&json_path).await
            .map_err(|e| format!("Failed to read whisper output: {}", e))?;

        let whisper_result: WhisperResult = serde_json::from_str(&json_content)
            .map_err(|e| format!("Failed to parse whisper JSON: {}", e))?;

        Ok(self.convert_whisper_result(whisper_result))
    }

    async fn transcribe_with_cloud_api(&self, audio_path: &str) -> Result<SpeechAnalysis, String> {
        // Placeholder for cloud API integration (Google Speech-to-Text, Azure, etc.)
        // For now, return a mock result
        Ok(SpeechAnalysis {
            segments: vec![
                TranscriptSegment {
                    start_time: 0.0,
                    end_time: 30.0,
                    text: "This is a placeholder transcript from cloud API.".to_string(),
                    confidence: 0.95,
                    speaker_id: Some("speaker_1".to_string()),
                }
            ],
            language: "en".to_string(),
            total_speech_time: 30.0,
            word_count: 9,
            average_confidence: 0.95,
        })
    }

    fn convert_whisper_result(&self, whisper_result: WhisperResult) -> SpeechAnalysis {
        let mut segments = Vec::new();
        let mut total_confidence = 0.0;
        let mut word_count = 0;

        for segment in whisper_result.segments {
            let words: Vec<&str> = segment.text.split_whitespace().collect();
            word_count += words.len();
            total_confidence += segment.avg_logprob.abs(); // Convert log prob to confidence

            segments.push(TranscriptSegment {
                start_time: segment.start,
                end_time: segment.end,
                text: segment.text.trim().to_string(),
                confidence: segment.avg_logprob.abs().min(1.0),
                speaker_id: None, // Whisper doesn't do speaker diarization by default
            });
        }

        let average_confidence = if segments.len() > 0 {
            total_confidence / segments.len() as f64
        } else {
            0.0
        };

        SpeechAnalysis {
            segments,
            language: whisper_result.language,
            total_speech_time: segments.last().map(|s| s.end_time).unwrap_or(0.0),
            word_count,
            average_confidence,
        }
    }

    pub async fn transcribe_segment(&self, audio_path: &str, start_time: f64, end_time: f64) -> Result<String, String> {
        // Extract specific audio segment first
        let segment_path = self.extract_audio_segment(audio_path, start_time, end_time).await?;
        
        // Transcribe the segment
        let analysis = self.transcribe_audio(&segment_path).await?;
        
        // Combine all text from segments
        let transcript = analysis.segments
            .iter()
            .map(|s| s.text.as_str())
            .collect::<Vec<_>>()
            .join(" ");

        Ok(transcript)
    }

    async fn extract_audio_segment(&self, audio_path: &str, start_time: f64, end_time: f64) -> Result<String, String> {
        let output_path = self.temp_dir.path().join("segment.wav");
        let duration = end_time - start_time;

        // Use FFmpeg to extract segment
        let output = Command::new("ffmpeg")
            .args(&[
                "-i", audio_path,
                "-ss", &start_time.to_string(),
                "-t", &duration.to_string(),
                "-acodec", "pcm_s16le",
                "-ar", "16000", // 16kHz for better speech recognition
                "-ac", "1", // Mono
                &output_path.to_string_lossy(),
            ])
            .output()
            .map_err(|e| format!("Failed to extract audio segment: {}", e))?;

        if output.status.success() {
            Ok(output_path.to_string_lossy().to_string())
        } else {
            Err(format!("FFmpeg segment extraction failed: {}", 
                String::from_utf8_lossy(&output.stderr)))
        }
    }

    pub async fn detect_language(&self, audio_path: &str) -> Result<String, String> {
        if let Some(ref whisper_path) = self.whisper_path {
            let output = Command::new(whisper_path)
                .args(&[
                    audio_path,
                    "--task", "detect_language",
                    "--output_format", "txt",
                ])
                .output()
                .map_err(|e| format!("Failed to detect language: {}", e))?;

            if output.status.success() {
                let result = String::from_utf8_lossy(&output.stdout);
                Ok(result.trim().to_string())
            } else {
                Ok("en".to_string()) // Default to English
            }
        } else {
            Ok("en".to_string())
        }
    }

    pub async fn generate_subtitles(&self, analysis: &SpeechAnalysis, format: SubtitleFormat) -> Result<String, String> {
        match format {
            SubtitleFormat::SRT => self.generate_srt(analysis),
            SubtitleFormat::VTT => self.generate_vtt(analysis),
            SubtitleFormat::ASS => self.generate_ass(analysis),
        }
    }

    fn generate_srt(&self, analysis: &SpeechAnalysis) -> Result<String, String> {
        let mut srt_content = String::new();
        
        for (index, segment) in analysis.segments.iter().enumerate() {
            let start_time = Self::format_timestamp(segment.start_time, true);
            let end_time = Self::format_timestamp(segment.end_time, true);
            
            srt_content.push_str(&format!(
                "{}\n{} --> {}\n{}\n\n",
                index + 1,
                start_time,
                end_time,
                segment.text
            ));
        }

        Ok(srt_content)
    }

    fn generate_vtt(&self, analysis: &SpeechAnalysis) -> Result<String, String> {
        let mut vtt_content = String::from("WEBVTT\n\n");
        
        for segment in &analysis.segments {
            let start_time = Self::format_timestamp(segment.start_time, false);
            let end_time = Self::format_timestamp(segment.end_time, false);
            
            vtt_content.push_str(&format!(
                "{} --> {}\n{}\n\n",
                start_time,
                end_time,
                segment.text
            ));
        }

        Ok(vtt_content)
    }

    fn generate_ass(&self, analysis: &SpeechAnalysis) -> Result<String, String> {
        let mut ass_content = String::from(
            "[Script Info]\nTitle: Generated Subtitles\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        );
        
        for segment in &analysis.segments {
            let start_time = Self::format_ass_timestamp(segment.start_time);
            let end_time = Self::format_ass_timestamp(segment.end_time);
            
            ass_content.push_str(&format!(
                "Dialogue: 0,{},{},Default,,0,0,0,,{}\n",
                start_time,
                end_time,
                segment.text
            ));
        }

        Ok(ass_content)
    }

    fn format_timestamp(seconds: f64, with_comma: bool) -> String {
        let hours = (seconds / 3600.0) as u32;
        let minutes = ((seconds % 3600.0) / 60.0) as u32;
        let secs = (seconds % 60.0) as u32;
        let millis = ((seconds % 1.0) * 1000.0) as u32;
        
        if with_comma {
            format!("{:02}:{:02}:{:02},{:03}", hours, minutes, secs, millis)
        } else {
            format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, secs, millis)
        }
    }

    fn format_ass_timestamp(seconds: f64) -> String {
        let hours = (seconds / 3600.0) as u32;
        let minutes = ((seconds % 3600.0) / 60.0) as u32;
        let secs = (seconds % 60.0) as u32;
        let centiseconds = ((seconds % 1.0) * 100.0) as u32;
        
        format!("{:01}:{:02}:{:02}.{:02}", hours, minutes, secs, centiseconds)
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct WhisperResult {
    text: String,
    segments: Vec<WhisperSegment>,
    language: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct WhisperSegment {
    id: usize,
    seek: f64,
    start: f64,
    end: f64,
    text: String,
    tokens: Vec<i32>,
    temperature: f64,
    avg_logprob: f64,
    compression_ratio: f64,
    no_speech_prob: f64,
}

#[derive(Debug)]
pub enum SubtitleFormat {
    SRT,
    VTT,
    ASS,
}