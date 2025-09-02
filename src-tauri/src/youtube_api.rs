use crate::{VideoInfo, youtube_extractor::{VideoChapter, VideoSearchResult}};
use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
struct YouTubeApiResponse<T> {
    kind: String,
    etag: String,
    items: Vec<T>,
    #[serde(rename = "pageInfo")]
    page_info: PageInfo,
}

#[derive(Debug, Serialize, Deserialize)]
struct PageInfo {
    #[serde(rename = "totalResults")]
    total_results: i32,
    #[serde(rename = "resultsPerPage")]
    results_per_page: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct YouTubeVideo {
    kind: String,
    etag: String,
    id: String,
    snippet: VideoSnippet,
    #[serde(rename = "contentDetails")]
    content_details: Option<ContentDetails>,
    statistics: Option<VideoStatistics>,
}

#[derive(Debug, Serialize, Deserialize)]
struct VideoSnippet {
    #[serde(rename = "publishedAt")]
    published_at: String,
    #[serde(rename = "channelId")]
    channel_id: String,
    title: String,
    description: String,
    thumbnails: Thumbnails,
    #[serde(rename = "channelTitle")]
    channel_title: String,
    tags: Option<Vec<String>>,
    #[serde(rename = "categoryId")]
    category_id: String,
    #[serde(rename = "liveBroadcastContent")]
    live_broadcast_content: String,
    #[serde(rename = "defaultLanguage")]
    default_language: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ContentDetails {
    duration: String,
    dimension: String,
    definition: String,
    caption: String,
    #[serde(rename = "licensedContent")]
    licensed_content: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct VideoStatistics {
    #[serde(rename = "viewCount")]
    view_count: Option<String>,
    #[serde(rename = "likeCount")]
    like_count: Option<String>,
    #[serde(rename = "favoriteCount")]
    favorite_count: Option<String>,
    #[serde(rename = "commentCount")]
    comment_count: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Thumbnails {
    default: Option<Thumbnail>,
    medium: Option<Thumbnail>,
    high: Option<Thumbnail>,
    standard: Option<Thumbnail>,
    maxres: Option<Thumbnail>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Thumbnail {
    url: String,
    width: i32,
    height: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct CaptionTrack {
    kind: String,
    etag: String,
    id: String,
    snippet: CaptionSnippet,
}

#[derive(Debug, Serialize, Deserialize)]
struct CaptionSnippet {
    #[serde(rename = "videoId")]
    video_id: String,
    #[serde(rename = "lastUpdated")]
    last_updated: String,
    #[serde(rename = "trackKind")]
    track_kind: String,
    language: String,
    name: String,
    #[serde(rename = "audioTrackType")]
    audio_track_type: Option<String>,
    #[serde(rename = "isCC")]
    is_cc: Option<bool>,
    #[serde(rename = "isLarge")]
    is_large: Option<bool>,
    #[serde(rename = "isEasyReader")]
    is_easy_reader: Option<bool>,
    #[serde(rename = "isDraft")]
    is_draft: Option<bool>,
    #[serde(rename = "isAutoSynced")]
    is_auto_synced: Option<bool>,
    status: String,
}

pub struct YouTubeAPI {
    client: reqwest::Client,
    api_key: Option<String>,
    base_url: String,
}

impl YouTubeAPI {
    pub fn new(api_key: Option<String>) -> Self {
        Self {
            client: reqwest::Client::new(),
            api_key,
            base_url: "https://www.googleapis.com/youtube/v3".to_string(),
        }
    }

    pub async fn get_video_info(&self, video_id: &str) -> Result<VideoInfo, String> {
        if let Some(ref api_key) = self.api_key {
            self.get_video_info_with_api(video_id, api_key).await
        } else {
            self.get_video_info_fallback(video_id).await
        }
    }

    async fn get_video_info_with_api(&self, video_id: &str, api_key: &str) -> Result<VideoInfo, String> {
        let url = format!(
            "{}/videos?part=snippet,contentDetails,statistics&id={}&key={}",
            self.base_url, video_id, api_key
        );

        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch video info: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("API request failed with status: {}", response.status()));
        }

        let api_response: YouTubeApiResponse<YouTubeVideo> = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse API response: {}", e))?;

        if let Some(video) = api_response.items.first() {
            let duration = video.content_details
                .as_ref()
                .map(|cd| Self::parse_youtube_duration(&cd.duration))
                .unwrap_or(Ok(0.0))?;

            let thumbnail = video.snippet.thumbnails.maxres
                .as_ref()
                .or(video.snippet.thumbnails.high.as_ref())
                .or(video.snippet.thumbnails.medium.as_ref())
                .map(|t| t.url.clone());

            Ok(VideoInfo {
                title: video.snippet.title.clone(),
                duration,
                url: format!("https://www.youtube.com/watch?v={}", video_id),
                thumbnail,
            })
        } else {
            Err("Video not found".to_string())
        }
    }

    async fn get_video_info_fallback(&self, video_id: &str) -> Result<VideoInfo, String> {
        // Fallback method without API - scrape from YouTube page
        let url = format!("https://www.youtube.com/watch?v={}", video_id);
        
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch video page: {}", e))?;

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to get page content: {}", e))?;

        // Extract title from HTML
        let title = self.extract_title_from_html(&html)?;
        
        // Extract duration from HTML (more complex parsing would be needed)
        let duration = self.extract_duration_from_html(&html).unwrap_or(300.0);

        Ok(VideoInfo {
            title,
            duration,
            url,
            thumbnail: Some(format!("https://img.youtube.com/vi/{}/maxresdefault.jpg", video_id)),
        })
    }

    fn extract_title_from_html(&self, html: &str) -> Result<String, String> {
        use regex::Regex;
        
        let title_regex = Regex::new(r#"<title>([^<]+) - YouTube</title>"#)
            .map_err(|e| format!("Failed to create regex: {}", e))?;

        if let Some(captures) = title_regex.captures(html) {
            Ok(captures[1].to_string())
        } else {
            Ok("Unknown Video".to_string())
        }
    }

    fn extract_duration_from_html(&self, html: &str) -> Option<f64> {
        use regex::Regex;
        
        let duration_regex = Regex::new(r#""lengthSeconds":"(\d+)""#).ok()?;
        
        if let Some(captures) = duration_regex.captures(html) {
            captures[1].parse::<f64>().ok()
        } else {
            None
        }
    }

    fn parse_youtube_duration(duration: &str) -> Result<f64, String> {
        use regex::Regex;
        
        // YouTube duration format: PT#H#M#S or PT#M#S or PT#S
        let duration_regex = Regex::new(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?")
            .map_err(|e| format!("Failed to create regex: {}", e))?;

        if let Some(captures) = duration_regex.captures(duration) {
            let hours = captures.get(1).and_then(|m| m.as_str().parse::<f64>().ok()).unwrap_or(0.0);
            let minutes = captures.get(2).and_then(|m| m.as_str().parse::<f64>().ok()).unwrap_or(0.0);
            let seconds = captures.get(3).and_then(|m| m.as_str().parse::<f64>().ok()).unwrap_or(0.0);

            Ok(hours * 3600.0 + minutes * 60.0 + seconds)
        } else {
            Err("Invalid duration format".to_string())
        }
    }

    pub async fn get_video_transcript(&self, video_id: &str) -> Result<String, String> {
        if let Some(ref api_key) = self.api_key {
            self.get_transcript_with_api(video_id, api_key).await
        } else {
            self.get_transcript_fallback(video_id).await
        }
    }

    async fn get_transcript_with_api(&self, video_id: &str, api_key: &str) -> Result<String, String> {
        // First, get list of caption tracks
        let captions_url = format!(
            "{}/captions?part=snippet&videoId={}&key={}",
            self.base_url, video_id, api_key
        );

        let response = self.client
            .get(&captions_url)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch captions list: {}", e))?;

        let captions_response: YouTubeApiResponse<CaptionTrack> = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse captions response: {}", e))?;

        // Find English captions
        let caption_track = captions_response.items
            .iter()
            .find(|track| track.snippet.language == "en")
            .or_else(|| captions_response.items.first())
            .ok_or("No captions available")?;

        // Download caption content
        let caption_url = format!(
            "{}/captions/{}?key={}",
            self.base_url, caption_track.id, api_key
        );

        let caption_response = self.client
            .get(&caption_url)
            .send()
            .await
            .map_err(|e| format!("Failed to download captions: {}", e))?;

        let transcript = caption_response
            .text()
            .await
            .map_err(|e| format!("Failed to get caption text: {}", e))?;

        Ok(self.clean_transcript(&transcript))
    }

    async fn get_transcript_fallback(&self, video_id: &str) -> Result<String, String> {
        // Fallback: try to get auto-generated captions or use external service
        // This is a placeholder - you would need to implement actual transcript extraction
        Ok(format!("Transcript for video {} (fallback method)", video_id))
    }

    fn clean_transcript(&self, raw_transcript: &str) -> String {
        use regex::Regex;
        
        // Remove XML tags and timing information
        let tag_regex = Regex::new(r"<[^>]*>").unwrap();
        let cleaned = tag_regex.replace_all(raw_transcript, "");
        
        // Remove extra whitespace
        let whitespace_regex = Regex::new(r"\s+").unwrap();
        whitespace_regex.replace_all(&cleaned, " ").trim().to_string()
    }

    pub async fn search_videos(&self, query: &str, max_results: u32) -> Result<Vec<VideoSearchResult>, String> {
        let api_key = self.api_key
            .as_ref()
            .ok_or("API key required for search functionality")?;

        let url = format!(
            "{}/search?part=snippet&type=video&q={}&maxResults={}&key={}",
            self.base_url,
            urlencoding::encode(query),
            max_results,
            api_key
        );

        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to search videos: {}", e))?;

        let search_response: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse search response: {}", e))?;

        let mut results = Vec::new();

        if let Some(items) = search_response.get("items").and_then(|i| i.as_array()) {
            for item in items {
                if let Some(snippet) = item.get("snippet") {
                    let video_id = item.get("id")
                        .and_then(|id| id.get("videoId"))
                        .and_then(|vid| vid.as_str())
                        .unwrap_or("")
                        .to_string();

                    let title = snippet.get("title")
                        .and_then(|t| t.as_str())
                        .unwrap_or("")
                        .to_string();

                    let channel = snippet.get("channelTitle")
                        .and_then(|c| c.as_str())
                        .unwrap_or("")
                        .to_string();

                    let thumbnail = snippet.get("thumbnails")
                        .and_then(|t| t.get("high"))
                        .and_then(|h| h.get("url"))
                        .and_then(|u| u.as_str())
                        .unwrap_or("")
                        .to_string();

                    results.push(VideoSearchResult {
                        video_id,
                        title,
                        channel,
                        duration: 0.0, // Would need separate API call to get duration
                        thumbnail,
                    });
                }
            }
        }

        Ok(results)
    }

    pub async fn get_channel_videos(&self, channel_id: &str, max_results: u32) -> Result<Vec<VideoSearchResult>, String> {
        let api_key = self.api_key
            .as_ref()
            .ok_or("API key required for channel video listing")?;

        let url = format!(
            "{}/search?part=snippet&type=video&channelId={}&maxResults={}&order=date&key={}",
            self.base_url,
            channel_id,
            max_results,
            api_key
        );

        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to get channel videos: {}", e))?;

        // Similar processing to search_videos
        self.parse_search_results(response).await
    }

    async fn parse_search_results(&self, response: reqwest::Response) -> Result<Vec<VideoSearchResult>, String> {
        // Implementation similar to search_videos
        // This is a helper method to avoid code duplication
        Ok(vec![]) // Placeholder
    }

    pub async fn get_trending_videos(&self, region_code: &str, max_results: u32) -> Result<Vec<VideoSearchResult>, String> {
        let api_key = self.api_key
            .as_ref()
            .ok_or("API key required for trending videos")?;

        let url = format!(
            "{}/videos?part=snippet,contentDetails&chart=mostPopular&regionCode={}&maxResults={}&key={}",
            self.base_url,
            region_code,
            max_results,
            api_key
        );

        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to get trending videos: {}", e))?;

        // Parse trending videos response
        Ok(vec![]) // Placeholder
    }
}

// Add URL encoding dependency
mod urlencoding {
    pub fn encode(input: &str) -> String {
        input.chars()
            .map(|c| match c {
                'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
                _ => format!("%{:02X}", c as u8),
            })
            .collect()
    }
}