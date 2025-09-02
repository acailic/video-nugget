use crate::{VideoNugget, VideoInfo};
use crate::ai_analyzer::ContentAnalysis;
use crate::batch_processor::BatchJob;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub workspace_path: PathBuf,
    pub videos: Vec<VideoProject>,
    pub tags: Vec<String>,
    pub collaborators: Vec<Collaborator>,
    pub settings: ProjectSettings,
    pub metadata: ProjectMetadata,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VideoProject {
    pub id: String,
    pub video_info: VideoInfo,
    pub nuggets: Vec<VideoNugget>,
    pub analysis: Option<ContentAnalysis>,
    pub processing_history: Vec<ProcessingEvent>,
    pub custom_tags: Vec<String>,
    pub notes: String,
    pub status: VideoStatus,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessingEvent {
    pub id: String,
    pub event_type: EventType,
    pub timestamp: String,
    pub details: String,
    pub user_id: Option<String>,
    pub parameters: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum EventType {
    VideoAdded,
    NuggetsGenerated,
    AnalysisCompleted,
    ExportCreated,
    TagsUpdated,
    NotesUpdated,
    ConfigurationChanged,
    BatchProcessed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum VideoStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Archived,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collaborator {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: CollaboratorRole,
    pub permissions: Vec<Permission>,
    pub joined_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum CollaboratorRole {
    Owner,
    Editor,
    Viewer,
    Guest,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Permission {
    ViewProject,
    EditProject,
    AddVideos,
    DeleteVideos,
    ProcessVideos,
    ExportData,
    ManageCollaborators,
    ChangeSettings,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectSettings {
    pub auto_analyze: bool,
    pub default_nugget_duration: f64,
    pub default_overlap: f64,
    pub auto_transcribe: bool,
    pub ai_analysis_enabled: bool,
    pub export_formats: Vec<String>,
    pub social_media_formats: bool,
    pub backup_enabled: bool,
    pub backup_interval_hours: u32,
    pub quality_presets: HashMap<String, QualityPreset>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QualityPreset {
    pub name: String,
    pub video_quality: String,
    pub audio_quality: String,
    pub format: String,
    pub target_size_mb: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectMetadata {
    pub total_videos: usize,
    pub total_nuggets: usize,
    pub total_duration_seconds: f64,
    pub storage_used_mb: f64,
    pub last_activity: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub settings: ProjectSettings,
    pub suggested_tags: Vec<String>,
    pub workflow: Vec<WorkflowStep>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub name: String,
    pub description: String,
    pub automated: bool,
    pub parameters: HashMap<String, serde_json::Value>,
}

pub struct ProjectManager {
    projects: HashMap<String, Project>,
    workspace_root: PathBuf,
    templates: Vec<ProjectTemplate>,
}

impl ProjectManager {
    pub fn new(workspace_root: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&workspace_root)
            .map_err(|e| format!("Failed to create workspace directory: {}", e))?;

        Ok(Self {
            projects: HashMap::new(),
            workspace_root,
            templates: Self::create_default_templates(),
        })
    }

    pub fn create_project(&mut self, name: String, description: Option<String>, template_id: Option<String>) -> Result<String, String> {
        let project_id = Uuid::new_v4().to_string();
        let project_path = self.workspace_root.join(&project_id);
        
        std::fs::create_dir_all(&project_path)
            .map_err(|e| format!("Failed to create project directory: {}", e))?;

        let settings = if let Some(template_id) = template_id {
            self.templates.iter()
                .find(|t| t.id == template_id)
                .map(|t| t.settings.clone())
                .unwrap_or_else(|| Self::default_settings())
        } else {
            Self::default_settings()
        };

        let project = Project {
            id: project_id.clone(),
            name,
            description,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            workspace_path: project_path,
            videos: Vec::new(),
            tags: Vec::new(),
            collaborators: vec![Collaborator {
                id: Uuid::new_v4().to_string(),
                name: "Owner".to_string(),
                email: "owner@localhost".to_string(),
                role: CollaboratorRole::Owner,
                permissions: vec![
                    Permission::ViewProject,
                    Permission::EditProject,
                    Permission::AddVideos,
                    Permission::DeleteVideos,
                    Permission::ProcessVideos,
                    Permission::ExportData,
                    Permission::ManageCollaborators,
                    Permission::ChangeSettings,
                ],
                joined_at: chrono::Utc::now().to_rfc3339(),
            }],
            settings,
            metadata: ProjectMetadata {
                total_videos: 0,
                total_nuggets: 0,
                total_duration_seconds: 0.0,
                storage_used_mb: 0.0,
                last_activity: chrono::Utc::now().to_rfc3339(),
                version: "1.0.0".to_string(),
            },
        };

        self.save_project(&project)?;
        self.projects.insert(project_id.clone(), project);
        
        Ok(project_id)
    }

    pub fn add_video_to_project(&mut self, project_id: &str, video_info: VideoInfo, nuggets: Vec<VideoNugget>, analysis: Option<ContentAnalysis>) -> Result<String, String> {
        let project = self.projects.get_mut(project_id)
            .ok_or("Project not found")?;

        let video_id = Uuid::new_v4().to_string();
        let video_project = VideoProject {
            id: video_id.clone(),
            video_info: video_info.clone(),
            nuggets: nuggets.clone(),
            analysis,
            processing_history: vec![ProcessingEvent {
                id: Uuid::new_v4().to_string(),
                event_type: EventType::VideoAdded,
                timestamp: chrono::Utc::now().to_rfc3339(),
                details: format!("Video '{}' added to project", video_info.title),
                user_id: None,
                parameters: HashMap::new(),
            }],
            custom_tags: Vec::new(),
            notes: String::new(),
            status: VideoStatus::Completed,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
        };

        project.videos.push(video_project);
        project.updated_at = chrono::Utc::now().to_rfc3339();
        
        // Update metadata
        project.metadata.total_videos = project.videos.len();
        project.metadata.total_nuggets = project.videos.iter().map(|v| v.nuggets.len()).sum();
        project.metadata.total_duration_seconds = project.videos.iter().map(|v| v.video_info.duration).sum();
        project.metadata.last_activity = chrono::Utc::now().to_rfc3339();

        self.save_project(project)?;
        Ok(video_id)
    }

    pub fn get_project(&self, project_id: &str) -> Option<&Project> {
        self.projects.get(project_id)
    }

    pub fn get_project_mut(&mut self, project_id: &str) -> Option<&mut Project> {
        self.projects.get_mut(project_id)
    }

    pub fn list_projects(&self) -> Vec<&Project> {
        self.projects.values().collect()
    }

    pub fn delete_project(&mut self, project_id: &str) -> Result<(), String> {
        let project = self.projects.remove(project_id)
            .ok_or("Project not found")?;

        // Remove project directory
        if project.workspace_path.exists() {
            std::fs::remove_dir_all(&project.workspace_path)
                .map_err(|e| format!("Failed to remove project directory: {}", e))?;
        }

        Ok(())
    }

    pub fn update_project_settings(&mut self, project_id: &str, settings: ProjectSettings) -> Result<(), String> {
        let project = self.projects.get_mut(project_id)
            .ok_or("Project not found")?;

        project.settings = settings;
        project.updated_at = chrono::Utc::now().to_rfc3339();
        project.metadata.last_activity = chrono::Utc::now().to_rfc3339();

        self.add_processing_event(
            project_id,
            EventType::ConfigurationChanged,
            "Project settings updated".to_string(),
            HashMap::new(),
        )?;

        self.save_project(project)?;
        Ok(())
    }

    pub fn add_collaborator(&mut self, project_id: &str, collaborator: Collaborator) -> Result<(), String> {
        let project = self.projects.get_mut(project_id)
            .ok_or("Project not found")?;

        // Check if collaborator already exists
        if project.collaborators.iter().any(|c| c.email == collaborator.email) {
            return Err("Collaborator already exists in this project".to_string());
        }

        project.collaborators.push(collaborator);
        project.updated_at = chrono::Utc::now().to_rfc3339();
        project.metadata.last_activity = chrono::Utc::now().to_rfc3339();

        self.save_project(project)?;
        Ok(())
    }

    pub fn remove_collaborator(&mut self, project_id: &str, collaborator_id: &str) -> Result<(), String> {
        let project = self.projects.get_mut(project_id)
            .ok_or("Project not found")?;

        let initial_len = project.collaborators.len();
        project.collaborators.retain(|c| c.id != collaborator_id);

        if project.collaborators.len() == initial_len {
            return Err("Collaborator not found".to_string());
        }

        project.updated_at = chrono::Utc::now().to_rfc3339();
        project.metadata.last_activity = chrono::Utc::now().to_rfc3339();

        self.save_project(project)?;
        Ok(())
    }

    pub fn add_processing_event(&mut self, project_id: &str, event_type: EventType, details: String, parameters: HashMap<String, serde_json::Value>) -> Result<(), String> {
        let project = self.projects.get_mut(project_id)
            .ok_or("Project not found")?;

        let event = ProcessingEvent {
            id: Uuid::new_v4().to_string(),
            event_type,
            timestamp: chrono::Utc::now().to_rfc3339(),
            details,
            user_id: None,
            parameters,
        };

        // Add event to all videos (global project events)
        for video in &mut project.videos {
            video.processing_history.push(event.clone());
        }

        project.metadata.last_activity = chrono::Utc::now().to_rfc3339();
        self.save_project(project)?;
        Ok(())
    }

    pub fn export_project(&self, project_id: &str, export_path: &str, include_files: bool) -> Result<(), String> {
        let project = self.projects.get(project_id)
            .ok_or("Project not found")?;

        let export_data = if include_files {
            // Create zip archive with all project files
            self.create_project_archive(project, export_path)?
        } else {
            // Export just the project metadata as JSON
            let json_data = serde_json::to_string_pretty(project)
                .map_err(|e| format!("Failed to serialize project: {}", e))?;
            
            std::fs::write(export_path, json_data)
                .map_err(|e| format!("Failed to write export file: {}", e))?;
        };

        Ok(())
    }

    fn create_project_archive(&self, project: &Project, archive_path: &str) -> Result<(), String> {
        // This would create a zip archive containing all project files
        // For now, just export the JSON
        let json_data = serde_json::to_string_pretty(project)
            .map_err(|e| format!("Failed to serialize project: {}", e))?;
        
        std::fs::write(archive_path, json_data)
            .map_err(|e| format!("Failed to write archive: {}", e))?;
        
        Ok(())
    }

    pub fn import_project(&mut self, import_path: &str) -> Result<String, String> {
        let content = std::fs::read_to_string(import_path)
            .map_err(|e| format!("Failed to read import file: {}", e))?;

        let mut project: Project = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse project data: {}", e))?;

        // Generate new ID to avoid conflicts
        let old_id = project.id.clone();
        project.id = Uuid::new_v4().to_string();
        
        // Update workspace path
        project.workspace_path = self.workspace_root.join(&project.id);
        
        // Create project directory
        std::fs::create_dir_all(&project.workspace_path)
            .map_err(|e| format!("Failed to create project directory: {}", e))?;

        self.save_project(&project)?;
        self.projects.insert(project.id.clone(), project.clone());

        Ok(project.id)
    }

    fn save_project(&self, project: &Project) -> Result<(), String> {
        let project_file = project.workspace_path.join("project.json");
        let json_data = serde_json::to_string_pretty(project)
            .map_err(|e| format!("Failed to serialize project: {}", e))?;

        std::fs::write(project_file, json_data)
            .map_err(|e| format!("Failed to save project: {}", e))?;

        Ok(())
    }

    pub fn load_projects(&mut self) -> Result<(), String> {
        for entry in std::fs::read_dir(&self.workspace_root)
            .map_err(|e| format!("Failed to read workspace directory: {}", e))? {
            
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let project_file = entry.path().join("project.json");
            
            if project_file.exists() {
                let content = std::fs::read_to_string(&project_file)
                    .map_err(|e| format!("Failed to read project file: {}", e))?;
                
                let project: Project = serde_json::from_str(&content)
                    .map_err(|e| format!("Failed to parse project file: {}", e))?;
                
                self.projects.insert(project.id.clone(), project);
            }
        }
        
        Ok(())
    }

    fn default_settings() -> ProjectSettings {
        let mut quality_presets = HashMap::new();
        
        quality_presets.insert("high".to_string(), QualityPreset {
            name: "High Quality".to_string(),
            video_quality: "1080p".to_string(),
            audio_quality: "320k".to_string(),
            format: "mp4".to_string(),
            target_size_mb: None,
        });
        
        quality_presets.insert("medium".to_string(), QualityPreset {
            name: "Medium Quality".to_string(),
            video_quality: "720p".to_string(),
            audio_quality: "192k".to_string(),
            format: "mp4".to_string(),
            target_size_mb: Some(50),
        });

        ProjectSettings {
            auto_analyze: true,
            default_nugget_duration: 30.0,
            default_overlap: 5.0,
            auto_transcribe: true,
            ai_analysis_enabled: true,
            export_formats: vec!["json".to_string(), "csv".to_string()],
            social_media_formats: true,
            backup_enabled: true,
            backup_interval_hours: 24,
            quality_presets,
        }
    }

    fn create_default_templates() -> Vec<ProjectTemplate> {
        vec![
            ProjectTemplate {
                id: "education".to_string(),
                name: "Educational Content".to_string(),
                description: "Optimized for tutorials, lectures, and educational videos".to_string(),
                settings: ProjectSettings {
                    auto_analyze: true,
                    default_nugget_duration: 60.0,
                    default_overlap: 10.0,
                    auto_transcribe: true,
                    ai_analysis_enabled: true,
                    export_formats: vec!["json".to_string(), "markdown".to_string()],
                    social_media_formats: false,
                    backup_enabled: true,
                    backup_interval_hours: 12,
                    quality_presets: HashMap::new(),
                },
                suggested_tags: vec!["education".to_string(), "tutorial".to_string(), "learning".to_string()],
                workflow: vec![
                    WorkflowStep {
                        name: "Extract Key Concepts".to_string(),
                        description: "Identify main educational concepts".to_string(),
                        automated: true,
                        parameters: HashMap::new(),
                    },
                    WorkflowStep {
                        name: "Generate Study Notes".to_string(),
                        description: "Create structured notes from content".to_string(),
                        automated: true,
                        parameters: HashMap::new(),
                    },
                ],
            },
            ProjectTemplate {
                id: "social_media".to_string(),
                name: "Social Media Content".to_string(),
                description: "Optimized for creating viral social media clips".to_string(),
                settings: ProjectSettings {
                    auto_analyze: true,
                    default_nugget_duration: 15.0,
                    default_overlap: 2.0,
                    auto_transcribe: true,
                    ai_analysis_enabled: true,
                    export_formats: vec!["json".to_string()],
                    social_media_formats: true,
                    backup_enabled: true,
                    backup_interval_hours: 6,
                    quality_presets: HashMap::new(),
                },
                suggested_tags: vec!["viral".to_string(), "social".to_string(), "short".to_string()],
                workflow: vec![
                    WorkflowStep {
                        name: "Find Viral Moments".to_string(),
                        description: "Identify engaging clips for social media".to_string(),
                        automated: true,
                        parameters: HashMap::new(),
                    },
                    WorkflowStep {
                        name: "Generate Captions".to_string(),
                        description: "Create platform-specific captions".to_string(),
                        automated: true,
                        parameters: HashMap::new(),
                    },
                ],
            },
        ]
    }

    pub fn get_templates(&self) -> &[ProjectTemplate] {
        &self.templates
    }

    pub fn create_backup(&self, project_id: &str) -> Result<String, String> {
        let project = self.projects.get(project_id)
            .ok_or("Project not found")?;

        let backup_name = format!("backup_{}_{}.json", project_id, chrono::Utc::now().timestamp());
        let backup_path = project.workspace_path.join("backups").join(backup_name);
        
        std::fs::create_dir_all(backup_path.parent().unwrap())
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;

        let json_data = serde_json::to_string_pretty(project)
            .map_err(|e| format!("Failed to serialize project: {}", e))?;

        std::fs::write(&backup_path, json_data)
            .map_err(|e| format!("Failed to write backup: {}", e))?;

        Ok(backup_path.to_string_lossy().to_string())
    }
}