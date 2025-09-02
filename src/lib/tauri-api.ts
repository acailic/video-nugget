import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

// Types for the backend data structures
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
}

// Tauri command wrappers
export class TauriAPI {
  /**
   * Get information about a video from its URL
   */
  static async getVideoInfo(url: string): Promise<VideoInfo> {
    return await invoke('get_video_info', { url });
  }

  /**
   * Process a video and extract nuggets
   */
  static async processVideo(
    url: string,
    config: ProcessingConfig = {}
  ): Promise<ProcessingResult> {
    return await invoke('process_video', { url, config });
  }

  /**
   * Save nuggets to a file
   */
  static async saveNuggets(
    nuggets: VideoNugget[],
    filepath: string
  ): Promise<string> {
    return await invoke('save_nuggets', { nuggets, filepath });
  }

  /**
   * Load nuggets from a file
   */
  static async loadNuggets(filepath: string): Promise<VideoNugget[]> {
    return await invoke('load_nuggets', { filepath });
  }

  /**
   * Export nuggets in different formats
   */
  static async exportNuggets(
    nuggets: VideoNugget[],
    format: 'json' | 'csv' | 'markdown',
    filepath: string
  ): Promise<string> {
    return await invoke('export_nuggets', { nuggets, format, filepath });
  }

  /**
   * Get the application version
   */
  static async getAppVersion(): Promise<string> {
    return await invoke('get_app_version');
  }

  /**
   * Open a file in the default application
   */
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

// Wrapper with error handling
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

// Hook-style API for React components
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