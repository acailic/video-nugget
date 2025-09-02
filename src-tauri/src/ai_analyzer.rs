use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use reqwest;
use crate::speech_recognition::TranscriptSegment;

#[derive(Debug, Serialize, Deserialize)]
pub struct ContentAnalysis {
    pub summary: String,
    pub key_topics: Vec<String>,
    pub sentiment_score: f64,
    pub engagement_score: f64,
    pub suggested_tags: Vec<String>,
    pub highlight_moments: Vec<HighlightMoment>,
    pub content_categories: Vec<String>,
    pub difficulty_level: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HighlightMoment {
    pub start_time: f64,
    pub end_time: f64,
    pub reason: String,
    pub confidence: f64,
    pub moment_type: MomentType,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum MomentType {
    KeyPoint,
    Question,
    Demonstration,
    Conclusion,
    CallToAction,
    Humor,
    Insight,
    Controversy,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIConfig {
    pub openai_api_key: Option<String>,
    pub claude_api_key: Option<String>,
    pub gemini_api_key: Option<String>,
    pub model_preference: AIModel,
    pub enable_sentiment_analysis: bool,
    pub enable_topic_extraction: bool,
    pub enable_highlight_detection: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum AIModel {
    OpenAIGPT4,
    OpenAIGPT35,
    Claude3,
    Gemini,
    Local,
}

pub struct AIAnalyzer {
    config: AIConfig,
    client: reqwest::Client,
}

impl AIAnalyzer {
    pub fn new(config: AIConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }

    pub async fn analyze_content(&self, transcript: &str, title: &str, description: Option<&str>) -> Result<ContentAnalysis, String> {
        match self.config.model_preference {
            AIModel::OpenAIGPT4 | AIModel::OpenAIGPT35 => {
                self.analyze_with_openai(transcript, title, description).await
            }
            AIModel::Claude3 => {
                self.analyze_with_claude(transcript, title, description).await
            }
            AIModel::Gemini => {
                self.analyze_with_gemini(transcript, title, description).await
            }
            AIModel::Local => {
                self.analyze_with_local_model(transcript, title, description).await
            }
        }
    }

    async fn analyze_with_openai(&self, transcript: &str, title: &str, description: Option<&str>) -> Result<ContentAnalysis, String> {
        let api_key = self.config.openai_api_key
            .as_ref()
            .ok_or("OpenAI API key not provided")?;

        let model = match self.config.model_preference {
            AIModel::OpenAIGPT4 => "gpt-4-turbo-preview",
            AIModel::OpenAIGPT35 => "gpt-3.5-turbo",
            _ => "gpt-3.5-turbo",
        };

        let prompt = self.create_analysis_prompt(transcript, title, description);

        let request_body = serde_json::json!({
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert video content analyzer. Analyze the provided video transcript and return structured insights in JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 2000,
            "response_format": { "type": "json_object" }
        });

        let response = self.client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("Failed to call OpenAI API: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("OpenAI API request failed: {}", response.status()));
        }

        let response_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

        let content = response_data["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("Invalid response format from OpenAI")?;

        self.parse_analysis_response(content)
    }

    async fn analyze_with_claude(&self, transcript: &str, title: &str, description: Option<&str>) -> Result<ContentAnalysis, String> {
        let api_key = self.config.claude_api_key
            .as_ref()
            .ok_or("Claude API key not provided")?;

        let prompt = self.create_analysis_prompt(transcript, title, description);

        let request_body = serde_json::json!({
            "model": "claude-3-sonnet-20240229",
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        });

        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("Failed to call Claude API: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Claude API request failed: {}", response.status()));
        }

        let response_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Claude response: {}", e))?;

        let content = response_data["content"][0]["text"]
            .as_str()
            .ok_or("Invalid response format from Claude")?;

        self.parse_analysis_response(content)
    }

    async fn analyze_with_gemini(&self, transcript: &str, title: &str, description: Option<&str>) -> Result<ContentAnalysis, String> {
        let api_key = self.config.gemini_api_key
            .as_ref()
            .ok_or("Gemini API key not provided")?;

        let prompt = self.create_analysis_prompt(transcript, title, description);

        let request_body = serde_json::json!({
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2000
            }
        });

        let url = format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={}", api_key);

        let response = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("Failed to call Gemini API: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Gemini API request failed: {}", response.status()));
        }

        let response_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

        let content = response_data["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or("Invalid response format from Gemini")?;

        self.parse_analysis_response(content)
    }

    async fn analyze_with_local_model(&self, transcript: &str, title: &str, _description: Option<&str>) -> Result<ContentAnalysis, String> {
        // Fallback analysis using rule-based methods
        let word_count = transcript.split_whitespace().count();
        let sentences: Vec<&str> = transcript.split('.').collect();
        
        // Simple keyword extraction
        let common_words = vec!["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
        let words: Vec<&str> = transcript.to_lowercase()
            .split_whitespace()
            .filter(|word| !common_words.contains(word) && word.len() > 3)
            .collect();
        
        let mut word_freq: HashMap<String, usize> = HashMap::new();
        for word in words {
            *word_freq.entry(word.to_string()).or_insert(0) += 1;
        }
        
        let mut key_topics: Vec<String> = word_freq.iter()
            .filter(|(_, &count)| count > 2)
            .map(|(word, _)| word.clone())
            .collect();
        key_topics.sort_by(|a, b| word_freq.get(b).unwrap().cmp(word_freq.get(a).unwrap()));
        key_topics.truncate(10);

        // Simple sentiment analysis
        let positive_words = vec!["good", "great", "excellent", "amazing", "wonderful", "best", "love", "like"];
        let negative_words = vec!["bad", "terrible", "awful", "hate", "worst", "dislike", "problem", "issue"];
        
        let positive_count = transcript.to_lowercase()
            .split_whitespace()
            .filter(|word| positive_words.contains(word))
            .count();
            
        let negative_count = transcript.to_lowercase()
            .split_whitespace()
            .filter(|word| negative_words.contains(word))
            .count();
        
        let sentiment_score = if positive_count + negative_count > 0 {
            (positive_count as f64 - negative_count as f64) / (positive_count + negative_count) as f64
        } else {
            0.0
        };

        // Generate summary (first few sentences)
        let summary = sentences.iter()
            .take(3)
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .collect::<Vec<&str>>()
            .join(". ");

        Ok(ContentAnalysis {
            summary,
            key_topics,
            sentiment_score,
            engagement_score: 0.7, // Default score
            suggested_tags: vec!["video".to_string(), "content".to_string()],
            highlight_moments: vec![],
            content_categories: self.categorize_content(title, transcript),
            difficulty_level: self.assess_difficulty(transcript, word_count),
        })
    }

    fn create_analysis_prompt(&self, transcript: &str, title: &str, description: Option<&str>) -> String {
        let desc_part = description.map(|d| format!("\nDescription: {}", d)).unwrap_or_default();
        
        format!(
            r#"Analyze this video content and provide insights in JSON format with the following structure:
{{
  "summary": "Brief 2-3 sentence summary of the main content",
  "key_topics": ["topic1", "topic2", "topic3"],
  "sentiment_score": 0.5,
  "engagement_score": 0.8,
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "highlight_moments": [
    {{
      "start_time": 30.0,
      "end_time": 45.0,
      "reason": "Key insight or important moment",
      "confidence": 0.9,
      "moment_type": "KeyPoint"
    }}
  ],
  "content_categories": ["Education", "Technology"],
  "difficulty_level": "Intermediate"
}}

Video Title: {}{}
Transcript: {}

Provide detailed analysis focusing on:
1. Main themes and topics discussed
2. Emotional tone and sentiment
3. Educational value and difficulty level
4. Potential highlight moments for social media
5. Relevant tags for discoverability
"#, title, desc_part, transcript)
    }

    fn parse_analysis_response(&self, content: &str) -> Result<ContentAnalysis, String> {
        // Try to parse as JSON first
        if let Ok(analysis) = serde_json::from_str::<ContentAnalysis>(content) {
            return Ok(analysis);
        }

        // If JSON parsing fails, try to extract JSON from the response
        if let Some(json_start) = content.find('{') {
            if let Some(json_end) = content.rfind('}') {
                let json_content = &content[json_start..=json_end];
                if let Ok(analysis) = serde_json::from_str::<ContentAnalysis>(json_content) {
                    return Ok(analysis);
                }
            }
        }

        Err("Failed to parse AI analysis response".to_string())
    }

    fn categorize_content(&self, title: &str, transcript: &str) -> Vec<String> {
        let content = format!("{} {}", title, transcript).to_lowercase();
        let mut categories = Vec::new();

        let category_keywords = vec![
            ("Education", vec!["tutorial", "learn", "how to", "guide", "explain", "lesson"]),
            ("Technology", vec!["tech", "software", "coding", "programming", "computer", "app"]),
            ("Entertainment", vec!["funny", "comedy", "entertainment", "fun", "joke", "laugh"]),
            ("Music", vec!["music", "song", "guitar", "piano", "singing", "band"]),
            ("Gaming", vec!["game", "gaming", "play", "player", "level", "score"]),
            ("Business", vec!["business", "marketing", "startup", "entrepreneur", "money", "profit"]),
            ("Health", vec!["health", "fitness", "workout", "exercise", "diet", "nutrition"]),
            ("Travel", vec!["travel", "trip", "vacation", "destination", "country", "city"]),
            ("Food", vec!["food", "recipe", "cooking", "kitchen", "ingredient", "meal"]),
            ("Sports", vec!["sport", "football", "basketball", "soccer", "tennis", "athletic"]),
        ];

        for (category, keywords) in category_keywords {
            if keywords.iter().any(|keyword| content.contains(keyword)) {
                categories.push(category.to_string());
            }
        }

        if categories.is_empty() {
            categories.push("General".to_string());
        }

        categories
    }

    fn assess_difficulty(&self, transcript: &str, word_count: usize) -> String {
        // Simple heuristic based on vocabulary complexity and sentence structure
        let complex_words = transcript.split_whitespace()
            .filter(|word| word.len() > 8)
            .count();
        
        let complexity_ratio = complex_words as f64 / word_count as f64;
        
        if complexity_ratio > 0.3 {
            "Advanced".to_string()
        } else if complexity_ratio > 0.15 {
            "Intermediate".to_string()
        } else {
            "Beginner".to_string()
        }
    }

    pub async fn detect_highlights_from_segments(&self, segments: &[TranscriptSegment]) -> Result<Vec<HighlightMoment>, String> {
        let mut highlights = Vec::new();
        
        for segment in segments {
            let text = segment.text.to_lowercase();
            
            // Detect question moments
            if text.contains("?") || text.contains("what") || text.contains("how") || text.contains("why") {
                highlights.push(HighlightMoment {
                    start_time: segment.start_time,
                    end_time: segment.end_time,
                    reason: "Question or inquiry detected".to_string(),
                    confidence: 0.7,
                    moment_type: MomentType::Question,
                });
            }
            
            // Detect key insights
            let insight_keywords = vec!["important", "key", "crucial", "essential", "remember", "note"];
            if insight_keywords.iter().any(|keyword| text.contains(keyword)) {
                highlights.push(HighlightMoment {
                    start_time: segment.start_time,
                    end_time: segment.end_time,
                    reason: "Key insight or important point".to_string(),
                    confidence: 0.8,
                    moment_type: MomentType::KeyPoint,
                });
            }
            
            // Detect conclusions
            let conclusion_keywords = vec!["conclusion", "summary", "in conclusion", "to summarize", "finally"];
            if conclusion_keywords.iter().any(|keyword| text.contains(keyword)) {
                highlights.push(HighlightMoment {
                    start_time: segment.start_time,
                    end_time: segment.end_time,
                    reason: "Conclusion or summary".to_string(),
                    confidence: 0.9,
                    moment_type: MomentType::Conclusion,
                });
            }
        }
        
        Ok(highlights)
    }

    pub async fn generate_social_media_captions(&self, analysis: &ContentAnalysis) -> Result<HashMap<String, String>, String> {
        let mut captions = HashMap::new();
        
        // TikTok caption (hashtag heavy, engaging)
        let tiktok_caption = format!(
            "{}✨ {} #viral #fyp #{}",
            analysis.summary,
            if analysis.engagement_score > 0.7 { "🔥" } else { "💡" },
            analysis.suggested_tags.join(" #")
        );
        captions.insert("tiktok".to_string(), tiktok_caption);
        
        // Instagram caption (descriptive, story-driven)
        let instagram_caption = format!(
            "{}\n\n{}\n\n#{}",
            analysis.summary,
            "What do you think about this? Let me know in the comments! 👇",
            analysis.suggested_tags.join(" #")
        );
        captions.insert("instagram".to_string(), instagram_caption);
        
        // YouTube Short caption (informative, searchable)
        let youtube_caption = format!(
            "{}\n\nTopics covered: {}\n\n{}",
            analysis.summary,
            analysis.key_topics.join(", "),
            analysis.suggested_tags.iter().map(|t| format!("#{}", t)).collect::<Vec<_>>().join(" ")
        );
        captions.insert("youtube".to_string(), youtube_caption);
        
        Ok(captions)
    }
}