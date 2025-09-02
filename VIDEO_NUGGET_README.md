# Video Nugget - Professional Video Content Processing Suite

A powerful Rust Tauri-based desktop application for processing videos into bite-sized content nuggets, perfect for content creators, educators, and social media managers.

## 🚀 Features

### 🎥 Core Video Processing
- **Smart Video Segmentation**: Automatically split videos into configurable nuggets
- **Multi-Platform Support**: Download and process videos from YouTube and other platforms
- **Advanced Transcription**: Real-time speech-to-text using Whisper AI
- **AI-Powered Analysis**: Content categorization, sentiment analysis, and engagement scoring

### 🧠 AI-Powered Intelligence
- **Content Analysis**: Automatic summarization and topic extraction
- **Highlight Detection**: Identify key moments, questions, and insights
- **Smart Tagging**: AI-generated tags for better organization
- **Multiple AI Providers**: Support for OpenAI GPT, Claude, and Gemini

### 📱 Social Media Integration
- **Format Optimization**: Automatic conversion to TikTok, Instagram, and YouTube Shorts formats
- **Caption Generation**: Platform-specific captions and hashtags
- **Thumbnail Creation**: Auto-generated thumbnails for each nugget

### 🗂️ Project Management
- **Workspace Organization**: Multi-project support with collaboration features
- **Version Control**: Track processing history and changes
- **Template System**: Pre-configured workflows for different content types
- **Export Options**: JSON, CSV, Markdown, and custom formats

### ⚡ Batch Processing
- **Concurrent Processing**: Handle multiple videos simultaneously
- **Queue Management**: Priority-based processing with retry logic
- **Progress Tracking**: Real-time monitoring with ETA calculations
- **Playlist Support**: Bulk import from YouTube playlists

## 🛠️ Technology Stack

### Backend (Rust)
- **Tauri 2.0**: Cross-platform desktop framework
- **FFmpeg**: Video processing and format conversion
- **Whisper**: Speech recognition and transcription
- **Tokio**: Async runtime for concurrent processing
- **Reqwest**: HTTP client for API integrations

### Frontend (TypeScript/React)
- **React 18**: Modern UI framework
- **Vite**: Fast build tooling
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **React Query**: Data fetching and state management

## 📋 Prerequisites

Before installation, ensure you have:

### Required Software
1. **Rust (1.70+)**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js (18+)**
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

3. **FFmpeg**
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

4. **Whisper (Optional, for transcription)**
   ```bash
   pip install openai-whisper
   ```

5. **yt-dlp (Optional, for YouTube downloads)**
   ```bash
   pip install yt-dlp
   ```

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/video-nugget.git
cd video-nugget

# Install dependencies
npm install

# Install Tauri CLI
npm install --save-dev @tauri-apps/cli
```

### 2. Development Setup

```bash
# Start the development server
npm run tauri:dev
```

This will:
- Compile the Rust backend
- Start the React development server
- Launch the desktop application

### 3. Production Build

```bash
# Build for production
npm run tauri:build
```

The built application will be available in `src-tauri/target/release/`.

## ⚙️ Configuration

### API Keys (Optional)

For enhanced AI features, configure API keys in the application settings:

1. **OpenAI API Key**: For GPT-powered analysis
2. **Claude API Key**: For Anthropic Claude analysis
3. **YouTube API Key**: For enhanced video metadata

### Project Structure

```
video-nugget/
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   ├── main.rs           # Main application entry
│   │   ├── video_processor.rs # Core video processing
│   │   ├── ffmpeg_processor.rs # FFmpeg integration
│   │   ├── speech_recognition.rs # Whisper integration
│   │   ├── ai_analyzer.rs    # AI-powered analysis
│   │   ├── batch_processor.rs # Batch job management
│   │   ├── project_manager.rs # Project organization
│   │   └── youtube_api.rs    # YouTube integration
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── src/                      # React frontend
│   ├── components/          # UI components
│   ├── lib/                 # Utility libraries
│   └── hooks/               # React hooks
├── public/                   # Static assets
└── package.json             # Node.js dependencies
```

## 📖 Usage Guide

### Basic Video Processing

1. **Start Processing**:
   - Enter a YouTube URL in the main interface
   - Click "Analyze URL" to fetch video information
   - Configure nugget duration and overlap settings
   - Enable desired features (transcription, AI analysis)
   - Click "Process Video"

2. **Review Results**:
   - Browse generated nuggets in the Results tab
   - View transcription and AI analysis
   - Export in various formats (JSON, CSV, Markdown)

### Project Management

1. **Create Project**:
   - Click "New Project" in the Project Manager
   - Choose a template (Educational, Social Media, etc.)
   - Configure project settings

2. **Add Videos**:
   - Process videos and save to project
   - Organize with custom tags and notes
   - Track processing history

3. **Collaborate**:
   - Add team members with role-based permissions
   - Share projects and export results
   - Maintain version control

### Batch Processing

1. **Create Batch Job**:
   - Switch to the Batch Processor
   - Provide job name and video URLs (one per line)
   - Configure processing settings
   - Set concurrent job limits

2. **Monitor Progress**:
   - Track processing status in real-time
   - View ETA and completion statistics
   - Handle failed jobs with retry logic

## 🔧 Advanced Features

### Custom AI Models

Configure local or custom AI models:

```javascript
// In src/lib/tauri-api-enhanced.ts
const aiConfig = {
  model_preference: AIModel.Local,
  custom_endpoint: 'http://localhost:8000/analyze',
  // ... other settings
};
```

### Workflow Automation

Create custom processing pipelines:

```rust
// In src-tauri/src/project_manager.rs
let workflow = vec![
    WorkflowStep {
        name: "Extract Audio".to_string(),
        automated: true,
        parameters: HashMap::new(),
    },
    WorkflowStep {
        name: "Generate Transcript".to_string(),
        automated: true,
        parameters: HashMap::new(),
    },
    // ... additional steps
];
```

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd src-tauri
cargo test

# Frontend tests
npm test

# End-to-end tests
npm run test:e2e
```

## 🚢 Deployment

### Desktop Distribution

```bash
# Build for current platform
npm run tauri:build

# Build for specific platforms
npm run tauri:build -- --target x86_64-pc-windows-msvc
npm run tauri:build -- --target x86_64-apple-darwin
npm run tauri:build -- --target x86_64-unknown-linux-gnu
```

## 📈 Performance Optimization

### Memory Management
- Videos are processed in chunks to minimize RAM usage
- Temporary files are cleaned up automatically
- Concurrent processing is limited based on system resources

### Storage Optimization
- Configurable output quality settings
- Compression options for different use cases
- Automatic cleanup of old processing artifacts

## 🛡️ Security & Privacy

### Data Protection
- All processing happens locally by default
- Optional cloud features require explicit consent
- No video content is transmitted to third parties without permission

### API Key Management
- Secure storage of API credentials
- Option to use local AI models for offline processing
- Transparent data usage policies

## 🐛 Troubleshooting

### Common Issues

1. **FFmpeg not found**:
   ```
   Error: FFmpeg not found. Please install FFmpeg and ensure it's in your PATH.
   ```
   Solution: Install FFmpeg as described in Prerequisites

2. **Transcription failing**:
   ```
   Error: Whisper transcription failed
   ```
   Solution: Install Whisper with `pip install openai-whisper`

3. **YouTube download errors**:
   ```
   Error: Failed to download video
   ```
   Solution: Install yt-dlp with `pip install yt-dlp`

### Debug Mode

Enable debug logging:

```bash
# Development
RUST_LOG=debug npm run tauri:dev

# Production
RUST_LOG=debug ./video-nugget
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test && cd src-tauri && cargo test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team**: For the excellent cross-platform framework
- **FFmpeg**: For video processing capabilities
- **OpenAI**: For Whisper speech recognition
- **shadcn**: For beautiful UI components
- **Community Contributors**: For features, bug reports, and feedback

## 📞 Support

- **Documentation**: [Full documentation](https://docs.video-nugget.dev)
- **Issues**: [GitHub Issues](https://github.com/your-username/video-nugget/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/video-nugget/discussions)

## 🗺️ Roadmap

### Version 2.0 (Q2 2024)
- [ ] Real-time video preview and editing
- [ ] Advanced timeline editor
- [ ] Plugin marketplace
- [ ] Cloud synchronization
- [ ] Mobile companion app

---

**Made with ❤️ by the Video Nugget Team**

*Transform your long-form content into engaging, bite-sized nuggets that captivate your audience.*