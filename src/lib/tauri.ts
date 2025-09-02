// Tauri Desktop Integration Layer
// Provides seamless connection to Rust backend

// Check if running in Tauri environment
export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Mock Tauri API for web preview, real implementations for desktop
const createTauriAPI = () => {
  if (isTauri()) {
    // Real Tauri APIs will be injected here
    return {
      invoke: (window as any).__TAURI__.invoke,
      fs: (window as any).__TAURI__.fs,
      dialog: (window as any).__TAURI__.dialog,
      notification: (window as any).__TAURI__.notification,
      window: (window as any).__TAURI__.window,
    };
  }
  
  // Mock APIs for web development
  return {
    invoke: async (cmd: string, args?: any) => {
      console.log(`Mock Tauri Command: ${cmd}`, args);
      // Simulate real backend responses
      switch (cmd) {
        case 'process_youtube_video':
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, id: Math.random().toString(36) };
        case 'get_videos':
          return [
            { id: '1', title: 'React Hooks Tutorial', status: 'completed' },
            { id: '2', title: 'AI Fundamentals', status: 'processing' }
          ];
        default:
          return { success: true };
      }
    },
    fs: {
      writeTextFile: async (path: string, content: string) => console.log('Write file:', path),
      readTextFile: async (path: string) => 'mock content'
    },
    dialog: {
      save: async () => '/mock/path/file.txt',
      open: async () => ['/mock/path/file.txt']
    },
    notification: {
      sendNotification: (options: any) => console.log('Notification:', options)
    },
    window: {
      setTitle: (title: string) => document.title = title,
      minimize: () => console.log('Minimize window'),
      maximize: () => console.log('Maximize window'),
      close: () => console.log('Close window')
    }
  };
};

export const tauri = createTauriAPI();

// Desktop-specific video processing
export const processVideo = async (url: string, options: {
  summaryType: string;
  customPrompt?: string;
  aiProvider?: string;
}) => {
  return await tauri.invoke('process_youtube_video', {
    url,
    options
  });
};

// Desktop file operations
export const exportSummary = async (videoId: string, format: 'markdown' | 'json' | 'txt') => {
  const filePath = await tauri.dialog.save({
    defaultPath: `summary_${videoId}.${format}`,
    filters: [{
      name: format.toUpperCase(),
      extensions: [format]
    }]
  });
  
  if (filePath) {
    const content = await tauri.invoke('export_summary', { videoId, format });
    await tauri.fs.writeTextFile(filePath, content);
    
    tauri.notification.sendNotification({
      title: 'Export Complete',
      body: `Summary exported to ${filePath}`
    });
  }
};

// Desktop database operations
export const getVideos = async () => {
  return await tauri.invoke('get_videos');
};

export const deleteVideo = async (videoId: string) => {
  return await tauri.invoke('delete_video', { videoId });
};

// Desktop configuration
export const saveConfig = async (config: any) => {
  return await tauri.invoke('save_config', config);
};

export const loadConfig = async () => {
  return await tauri.invoke('load_config');
};