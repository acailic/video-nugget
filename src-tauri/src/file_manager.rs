use crate::VideoNugget;
use std::path::Path;
use tokio::fs;
use serde_json;

pub struct FileManager {
    // Add any state needed for file management
}

impl FileManager {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn save_nuggets(&self, nuggets: Vec<VideoNugget>, filepath: &str) -> Result<String, String> {
        let json_data = serde_json::to_string_pretty(&nuggets)
            .map_err(|e| format!("Failed to serialize nuggets: {}", e))?;

        fs::write(filepath, json_data)
            .await
            .map_err(|e| format!("Failed to write file: {}", e))?;

        Ok(format!("Successfully saved {} nuggets to {}", nuggets.len(), filepath))
    }

    pub async fn load_nuggets(&self, filepath: &str) -> Result<Vec<VideoNugget>, String> {
        if !Path::new(filepath).exists() {
            return Err("File does not exist".to_string());
        }

        let content = fs::read_to_string(filepath)
            .await
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let nuggets: Vec<VideoNugget> = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        Ok(nuggets)
    }

    pub async fn export_as_json(&self, nuggets: Vec<VideoNugget>, filepath: &str) -> Result<String, String> {
        self.save_nuggets(nuggets, filepath).await
    }

    pub async fn export_as_csv(&self, nuggets: Vec<VideoNugget>, filepath: &str) -> Result<String, String> {
        let mut csv_content = String::from("ID,Title,Start Time,End Time,Tags,Created At,Transcript\n");
        
        for nugget in nuggets {
            let tags = nugget.tags.join(";");
            let transcript = nugget.transcript.unwrap_or_else(|| "".to_string());
            let line = format!(
                "{},{},{},{},{},{},\"{}\"\n",
                nugget.id,
                nugget.title.replace(",", ";"),
                nugget.start_time,
                nugget.end_time,
                tags,
                nugget.created_at,
                transcript.replace("\"", "\"\"")
            );
            csv_content.push_str(&line);
        }

        fs::write(filepath, csv_content)
            .await
            .map_err(|e| format!("Failed to write CSV file: {}", e))?;

        Ok(format!("Successfully exported to CSV: {}", filepath))
    }

    pub async fn export_as_markdown(&self, nuggets: Vec<VideoNugget>, filepath: &str) -> Result<String, String> {
        let mut md_content = String::from("# Video Nuggets\n\n");
        
        for (index, nugget) in nuggets.iter().enumerate() {
            md_content.push_str(&format!("## {} - {}\n\n", index + 1, nugget.title));
            md_content.push_str(&format!("**Time:** {:.2}s - {:.2}s\n\n", nugget.start_time, nugget.end_time));
            
            if !nugget.tags.is_empty() {
                md_content.push_str(&format!("**Tags:** {}\n\n", nugget.tags.join(", ")));
            }
            
            if let Some(transcript) = &nugget.transcript {
                md_content.push_str(&format!("**Transcript:**\n{}\n\n", transcript));
            }
            
            md_content.push_str("---\n\n");
        }

        fs::write(filepath, md_content)
            .await
            .map_err(|e| format!("Failed to write Markdown file: {}", e))?;

        Ok(format!("Successfully exported to Markdown: {}", filepath))
    }

    pub async fn create_backup(&self, filepath: &str) -> Result<String, String> {
        if !Path::new(filepath).exists() {
            return Err("Original file does not exist".to_string());
        }

        let backup_filepath = format!("{}.backup.{}", filepath, chrono::Utc::now().timestamp());
        
        fs::copy(filepath, &backup_filepath)
            .await
            .map_err(|e| format!("Failed to create backup: {}", e))?;

        Ok(format!("Backup created: {}", backup_filepath))
    }

    pub async fn list_saved_projects(&self, directory: &str) -> Result<Vec<String>, String> {
        let mut projects = Vec::new();
        
        let mut entries = fs::read_dir(directory)
            .await
            .map_err(|e| format!("Failed to read directory: {}", e))?;

        while let Ok(Some(entry)) = entries.next_entry().await {
            if let Some(extension) = entry.path().extension() {
                if extension == "json" {
                    if let Some(filename) = entry.path().file_name() {
                        projects.push(filename.to_string_lossy().to_string());
                    }
                }
            }
        }

        Ok(projects)
    }

    pub async fn get_project_info(&self, filepath: &str) -> Result<ProjectInfo, String> {
        let nuggets = self.load_nuggets(filepath).await?;
        
        let metadata = fs::metadata(filepath)
            .await
            .map_err(|e| format!("Failed to get file metadata: {}", e))?;

        Ok(ProjectInfo {
            filepath: filepath.to_string(),
            nugget_count: nuggets.len(),
            file_size: metadata.len(),
            created_at: metadata.created()
                .map_err(|e| format!("Failed to get creation time: {}", e))?
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| format!("Failed to convert time: {}", e))?
                .as_secs(),
            modified_at: metadata.modified()
                .map_err(|e| format!("Failed to get modification time: {}", e))?
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| format!("Failed to convert time: {}", e))?
                .as_secs(),
        })
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ProjectInfo {
    pub filepath: String,
    pub nugget_count: usize,
    pub file_size: u64,
    pub created_at: u64,
    pub modified_at: u64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use uuid::Uuid;

    fn create_test_nugget(title: &str) -> VideoNugget {
        VideoNugget {
            id: Uuid::new_v4().to_string(),
            title: title.to_string(),
            start_time: 0.0,
            end_time: 30.0,
            transcript: Some("Test transcript".to_string()),
            tags: vec!["test".to_string(), "video-nugget".to_string()],
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    #[test]
    fn test_new_file_manager() {
        let _manager = FileManager::new();
        // Just verify it can be created
        assert!(true);
    }

    #[tokio::test]
    async fn test_save_and_load_nuggets() {
        let manager = FileManager::new();
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let file_path = temp_dir.path().join("test_nuggets.json");
        let file_path_str = file_path.to_str().unwrap();

        let nuggets = vec![
            create_test_nugget("Test Nugget 1"),
            create_test_nugget("Test Nugget 2"),
        ];

        // Test save
        let save_result = manager.save_nuggets(nuggets.clone(), file_path_str).await;
        assert!(save_result.is_ok());
        assert!(save_result.unwrap().contains("Successfully saved 2 nuggets"));

        // Test load
        let load_result = manager.load_nuggets(file_path_str).await;
        assert!(load_result.is_ok());
        let loaded_nuggets = load_result.unwrap();
        assert_eq!(loaded_nuggets.len(), 2);
        assert_eq!(loaded_nuggets[0].title, "Test Nugget 1");
        assert_eq!(loaded_nuggets[1].title, "Test Nugget 2");
    }

    #[tokio::test]
    async fn test_load_nonexistent_file() {
        let manager = FileManager::new();
        let result = manager.load_nuggets("/nonexistent/file.json").await;
        
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "File does not exist");
    }

    #[tokio::test]
    async fn test_export_as_csv() {
        let manager = FileManager::new();
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let file_path = temp_dir.path().join("test_export.csv");
        let file_path_str = file_path.to_str().unwrap();

        let nuggets = vec![create_test_nugget("CSV Test Nugget")];
        
        let result = manager.export_as_csv(nuggets, file_path_str).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Successfully exported to CSV"));

        // Verify file contents
        let content = fs::read_to_string(file_path_str).await.unwrap();
        assert!(content.contains("ID,Title,Start Time,End Time,Tags,Created At,Transcript"));
        assert!(content.contains("CSV Test Nugget"));
        assert!(content.contains("test;video-nugget"));
    }

    #[tokio::test]
    async fn test_export_as_markdown() {
        let manager = FileManager::new();
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let file_path = temp_dir.path().join("test_export.md");
        let file_path_str = file_path.to_str().unwrap();

        let nuggets = vec![create_test_nugget("Markdown Test Nugget")];
        
        let result = manager.export_as_markdown(nuggets, file_path_str).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Successfully exported to Markdown"));

        // Verify file contents
        let content = fs::read_to_string(file_path_str).await.unwrap();
        assert!(content.contains("# Video Nuggets"));
        assert!(content.contains("## 1 - Markdown Test Nugget"));
        assert!(content.contains("**Time:** 0.00s - 30.00s"));
        assert!(content.contains("**Tags:** test, video-nugget"));
        assert!(content.contains("**Transcript:**\nTest transcript"));
    }

    #[tokio::test]
    async fn test_export_as_json() {
        let manager = FileManager::new();
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let file_path = temp_dir.path().join("test_export.json");
        let file_path_str = file_path.to_str().unwrap();

        let nuggets = vec![create_test_nugget("JSON Test Nugget")];
        
        let result = manager.export_as_json(nuggets, file_path_str).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Successfully saved 1 nuggets"));

        // Verify file can be loaded back
        let loaded_result = manager.load_nuggets(file_path_str).await;
        assert!(loaded_result.is_ok());
        assert_eq!(loaded_result.unwrap().len(), 1);
    }

    #[tokio::test]
    async fn test_create_backup() {
        let manager = FileManager::new();
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let original_file = temp_dir.path().join("original.json");
        let original_file_str = original_file.to_str().unwrap();

        // Create original file
        let nuggets = vec![create_test_nugget("Backup Test")];
        manager.save_nuggets(nuggets, original_file_str).await.unwrap();

        // Create backup
        let backup_result = manager.create_backup(original_file_str).await;
        assert!(backup_result.is_ok());
        assert!(backup_result.unwrap().contains("Backup created:"));
    }

    #[tokio::test]
    async fn test_create_backup_nonexistent_file() {
        let manager = FileManager::new();
        let result = manager.create_backup("/nonexistent/file.json").await;
        
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Original file does not exist");
    }

    #[tokio::test]
    async fn test_list_saved_projects() {
        let manager = FileManager::new();
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let temp_dir_str = temp_dir.path().to_str().unwrap();

        // Create test files
        let nuggets = vec![create_test_nugget("Project Test")];
        let file1 = temp_dir.path().join("project1.json");
        let file2 = temp_dir.path().join("project2.json");
        let file3 = temp_dir.path().join("not_json.txt");

        manager.save_nuggets(nuggets.clone(), file1.to_str().unwrap()).await.unwrap();
        manager.save_nuggets(nuggets.clone(), file2.to_str().unwrap()).await.unwrap();
        fs::write(file3, "not json content").await.unwrap();

        let result = manager.list_saved_projects(temp_dir_str).await;
        assert!(result.is_ok());
        let projects = result.unwrap();
        assert_eq!(projects.len(), 2);
        assert!(projects.contains(&"project1.json".to_string()));
        assert!(projects.contains(&"project2.json".to_string()));
        assert!(!projects.contains(&"not_json.txt".to_string()));
    }

    #[tokio::test]
    async fn test_get_project_info() {
        let manager = FileManager::new();
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let file_path = temp_dir.path().join("info_test.json");
        let file_path_str = file_path.to_str().unwrap();

        let nuggets = vec![
            create_test_nugget("Info Test 1"),
            create_test_nugget("Info Test 2"),
            create_test_nugget("Info Test 3"),
        ];
        manager.save_nuggets(nuggets, file_path_str).await.unwrap();

        let result = manager.get_project_info(file_path_str).await;
        assert!(result.is_ok());
        let info = result.unwrap();
        assert_eq!(info.filepath, file_path_str);
        assert_eq!(info.nugget_count, 3);
        assert!(info.file_size > 0);
        assert!(info.created_at > 0);
        assert!(info.modified_at > 0);
    }

    #[tokio::test]
    async fn test_csv_export_with_commas_and_quotes() {
        let manager = FileManager::new();
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let file_path = temp_dir.path().join("csv_special_chars.csv");
        let file_path_str = file_path.to_str().unwrap();

        let mut nugget = create_test_nugget("Title, with, commas");
        nugget.transcript = Some("Transcript with \"quotes\" and, commas".to_string());
        let nuggets = vec![nugget];
        
        let result = manager.export_as_csv(nuggets, file_path_str).await;
        assert!(result.is_ok());

        let content = fs::read_to_string(file_path_str).await.unwrap();
        assert!(content.contains("Title; with; commas")); // Commas replaced with semicolons
        assert!(content.contains("\"Transcript with \"\"quotes\"\" and, commas\"")); // Quotes escaped
    }
}