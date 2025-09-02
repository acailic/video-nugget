import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

// Core data structures
export interface VideoNugget {
  id: string;
  title: string;
  start_time: number;
  end_time: number;
  transcript?: string;
  tags: string[];
  created_at: string;
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  nuggets: VideoNugget[];
}

export interface VideoInfo {
  title: string;
  duration: number;
  url: string;
  thumbnail?: string;
}

export interface ProcessingConfig {
  nugget_duration?: number;
  overlap_duration?: number;
  extract_transcript?: boolean;
  enable_transcript?: boolean;
  enable_ai_analysis?: boolean;
  enable_social_formats?: boolean;
}

// Advanced processing types
export interface SpeechAnalysis {
  segments: TranscriptSegment[];
  language: string;
  total_speech_time: number;
  word_count: number;
  average_confidence: number;
}

export interface TranscriptSegment {
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
  speaker_id?: string;
}

export interface ContentAnalysis {
  summary: string;
  key_topics: string[];
  sentiment_score: number;
  engagement_score: number;
  suggested_tags: string[];
  highlight_moments: HighlightMoment[];
  content_categories: string[];
  difficulty_level: string;
}

export interface HighlightMoment {
  start_time: number;
  end_time: number;
  reason: string;
  confidence: number;
  moment_type: MomentType;
}

export enum MomentType {
  KeyPoint = 'KeyPoint',
  Question = 'Question',
  Demonstration = 'Demonstration',
  Conclusion = 'Conclusion',
  CallToAction = 'CallToAction',
  Humor = 'Humor',
  Insight = 'Insight',
  Controversy = 'Controversy',
}

export interface SocialMediaFormats {
  tiktok: string;
  instagram: string;
  youtube_short: string;
}

// Batch processing types
export interface BatchJob {
  id: string;
  name: string;
  urls: string[];
  config: BatchConfig;
  status: BatchStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress: BatchProgress;
  results: BatchResult[];
}

export interface BatchConfig {
  video_config: Record<string, any>;
  output_directory: string;
  export_formats: string[];
  enable_ai_analysis: boolean;
  enable_transcript: boolean;
  enable_social_formats: boolean;
  concurrent_jobs: number;
  retry_failed: boolean;
  max_retries: number;
}

export enum BatchStatus {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  Paused = 'Paused',
}

export interface BatchProgress {
  total_videos: number;
  processed_videos: number;
  failed_videos: number;
  current_video?: string;
  percentage: number;
  eta_minutes?: number;
  start_time?: number;
}

export interface BatchResult {
  url: string;
  video_info?: VideoInfo;
  nuggets: VideoNugget[];
  analysis?: ContentAnalysis;
  output_files: string[];
  status: ProcessingStatus;
  error_message?: string;
  processing_time_seconds: number;
}

export enum ProcessingStatus {
  Success = 'Success',
  Failed = 'Failed',
  Skipped = 'Skipped',
  Retrying = 'Retrying',
}

// Project management types
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  workspace_path: string;
  videos: VideoProject[];
  tags: string[];
  collaborators: Collaborator[];
  settings: ProjectSettings;
  metadata: ProjectMetadata;
}

export interface VideoProject {
  id: string;
  video_info: VideoInfo;
  nuggets: VideoNugget[];
  analysis?: ContentAnalysis;
  processing_history: ProcessingEvent[];
  custom_tags: string[];
  notes: string;
  status: VideoStatus;
  created_at: string;
  updated_at: string;
}

export interface ProcessingEvent {
  id: string;
  event_type: EventType;
  timestamp: string;
  details: string;
  user_id?: string;
  parameters: Record<string, any>;
}

export enum EventType {
  VideoAdded = 'VideoAdded',
  NuggetsGenerated = 'NuggetsGenerated',
  AnalysisCompleted = 'AnalysisCompleted',
  ExportCreated = 'ExportCreated',
  TagsUpdated = 'TagsUpdated',
  NotesUpdated = 'NotesUpdated',
  ConfigurationChanged = 'ConfigurationChanged',
  BatchProcessed = 'BatchProcessed',
}

export enum VideoStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
  Archived = 'Archived',
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: CollaboratorRole;
  permissions: Permission[];
  joined_at: string;
}

export enum CollaboratorRole {
  Owner = 'Owner',
  Editor = 'Editor',
  Viewer = 'Viewer',
  Guest = 'Guest',
}

export enum Permission {
  ViewProject = 'ViewProject',
  EditProject = 'EditProject',
  AddVideos = 'AddVideos',
  DeleteVideos = 'DeleteVideos',
  ProcessVideos = 'ProcessVideos',
  ExportData = 'ExportData',
  ManageCollaborators = 'ManageCollaborators',
  ChangeSettings = 'ChangeSettings',
}

export interface ProjectSettings {
  auto_analyze: boolean;
  default_nugget_duration: number;
  default_overlap: number;
  auto_transcribe: boolean;
  ai_analysis_enabled: boolean;
  export_formats: string[];
  social_media_formats: boolean;
  backup_enabled: boolean;
  backup_interval_hours: number;
  quality_presets: Record<string, QualityPreset>;
}

export interface QualityPreset {
  name: string;
  video_quality: string;
  audio_quality: string;
  format: string;
  target_size_mb?: number;
}

export interface ProjectMetadata {
  total_videos: number;
  total_nuggets: number;
  total_duration_seconds: number;
  storage_used_mb: number;
  last_activity: string;
  version: string;
}

// Enhanced Tauri API wrapper
export class TauriAPI {
  // Basic video processing
  static async getVideoInfo(url: string): Promise<VideoInfo> {
    return await invoke('get_video_info', { url });
  }

  static async processVideo(
    url: string,
    config: ProcessingConfig = {}
  ): Promise<ProcessingResult> {
    return await invoke('process_video', { url, config });
  }

  static async processVideoAdvanced(
    url: string,
    config: ProcessingConfig = {}
  ): Promise<ProcessingResult> {
    return await invoke('process_video_advanced', { url, config });
  }

  // File management
  static async saveNuggets(
    nuggets: VideoNugget[],
    filepath: string
  ): Promise<string> {
    return await invoke('save_nuggets', { nuggets, filepath });
  }

  static async loadNuggets(filepath: string): Promise<VideoNugget[]> {
    return await invoke('load_nuggets', { filepath });
  }

  static async exportNuggets(
    nuggets: VideoNugget[],
    format: 'json' | 'csv' | 'markdown',
    filepath: string
  ): Promise<string> {
    return await invoke('export_nuggets', { nuggets, format, filepath });
  }

  // Advanced processing features
  static async extractTranscript(url: string): Promise<SpeechAnalysis> {
    return await invoke('extract_transcript', { url });
  }

  static async analyzeContent(
    transcript: string,
    title: string,
    description?: string
  ): Promise<ContentAnalysis> {
    return await invoke('analyze_content', { transcript, title, description });
  }

  static async generateSubtitles(
    transcriptSegments: TranscriptSegment[],
    format: 'srt' | 'vtt' | 'ass'
  ): Promise<string> {
    return await invoke('generate_subtitles', { 
      transcript_segments: transcriptSegments, 
      format 
    });
  }

  static async createSocialFormats(videoPath: string): Promise<SocialMediaFormats> {
    return await invoke('create_social_formats', { video_path: videoPath });
  }

  // Batch processing
  static async createBatchJob(
    name: string,
    urls: string[],
    config: BatchConfig
  ): Promise<string> {
    return await invoke('create_batch_job', { name, urls, config });
  }

  static async startBatchJob(jobId: string): Promise<void> {
    return await invoke('start_batch_job', { job_id: jobId });
  }

  static async getBatchJobStatus(jobId: string): Promise<BatchJob | null> {
    return await invoke('get_batch_job_status', { job_id: jobId });
  }

  static async cancelBatchJob(jobId: string): Promise<void> {
    return await invoke('cancel_batch_job', { job_id: jobId });
  }

  static async listBatchJobs(): Promise<BatchJob[]> {
    return await invoke('list_batch_jobs');
  }

  // Project management
  static async createProject(
    name: string,
    description?: string,
    templateId?: string
  ): Promise<string> {
    return await invoke('create_project', { name, description, template_id: templateId });
  }

  static async addVideoToProject(
    projectId: string,
    videoInfo: VideoInfo,
    nuggets: VideoNugget[],
    analysis?: ContentAnalysis
  ): Promise<string> {
    return await invoke('add_video_to_project', { 
      project_id: projectId, 
      video_info: videoInfo, 
      nuggets, 
      analysis 
    });
  }

  static async getProject(projectId: string): Promise<Project | null> {
    return await invoke('get_project', { project_id: projectId });
  }

  static async listProjects(): Promise<Project[]> {
    return await invoke('list_projects');
  }

  static async updateProjectSettings(
    projectId: string,
    settings: ProjectSettings
  ): Promise<void> {
    return await invoke('update_project_settings', { 
      project_id: projectId, 
      settings 
    });
  }

  static async deleteProject(projectId: string): Promise<void> {
    return await invoke('delete_project', { project_id: projectId });
  }

  static async exportProject(
    projectId: string,
    exportPath: string,
    includeFiles: boolean = false
  ): Promise<void> {
    return await invoke('export_project', { 
      project_id: projectId, 
      export_path: exportPath, 
      include_files: includeFiles 
    });
  }

  static async importProject(importPath: string): Promise<string> {
    return await invoke('import_project', { import_path: importPath });
  }

  // Utility functions
  static async getAppVersion(): Promise<string> {
    return await invoke('get_app_version');
  }

  static async openFile(filepath: string): Promise<void> {
    return await invoke('open_file', { filepath });
  }
}

// Error handling utility
export class TauriError extends Error {
  constructor(message: string, public readonly original?: unknown) {
    super(message);
    this.name = 'TauriError';
  }

  static fromUnknown(error: unknown): TauriError {
    if (error instanceof Error) {
      return new TauriError(error.message, error);
    }
    return new TauriError(String(error), error);
  }
}

// Safe invoke wrapper
export const safeTauriInvoke = async <T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> => {
  try {
    return await invoke(command, args);
  } catch (error) {
    throw TauriError.fromUnknown(error);
  }
};

// React hooks for Tauri commands
export const useTauriCommand = <T>(
  command: string,
  args?: Record<string, unknown>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TauriError | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await safeTauriInvoke<T>(command, args);
      setData(result);
      return result;
    } catch (err) {
      const tauriError = TauriError.fromUnknown(err);
      setError(tauriError);
      throw tauriError;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
};

// Specialized hooks for common operations
export const useVideoProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processVideo = async (url: string, config: ProcessingConfig = {}) => {
    setProcessing(true);
    setError(null);
    try {
      const result = await TauriAPI.processVideoAdvanced(url, config);
      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return { processing, result, error, processVideo };
};

export const useBatchProcessor = () => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshJobs = async () => {
    setLoading(true);
    try {
      const jobList = await TauriAPI.listBatchJobs();
      setJobs(jobList);
    } catch (error) {
      console.error('Failed to refresh batch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (name: string, urls: string[], config: BatchConfig) => {
    const jobId = await TauriAPI.createBatchJob(name, urls, config);
    await refreshJobs();
    return jobId;
  };

  const startJob = async (jobId: string) => {
    await TauriAPI.startBatchJob(jobId);
    await refreshJobs();
  };

  const cancelJob = async (jobId: string) => {
    await TauriAPI.cancelBatchJob(jobId);
    await refreshJobs();
  };

  return { jobs, loading, refreshJobs, createJob, startJob, cancelJob };
};

export const useProjectManager = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshProjects = async () => {
    setLoading(true);
    try {
      const projectList = await TauriAPI.listProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, description?: string, templateId?: string) => {
    const projectId = await TauriAPI.createProject(name, description, templateId);
    await refreshProjects();
    return projectId;
  };

  const loadProject = async (projectId: string) => {
    const project = await TauriAPI.getProject(projectId);
    setCurrentProject(project);
    return project;
  };

  const addVideoToProject = async (
    projectId: string,
    videoInfo: VideoInfo,
    nuggets: VideoNugget[],
    analysis?: ContentAnalysis
  ) => {
    const videoId = await TauriAPI.addVideoToProject(projectId, videoInfo, nuggets, analysis);
    await refreshProjects();
    if (currentProject?.id === projectId) {
      await loadProject(projectId);
    }
    return videoId;
  };

  return { 
    projects, 
    currentProject, 
    loading, 
    refreshProjects, 
    createProject, 
    loadProject, 
    addVideoToProject 
  };
};