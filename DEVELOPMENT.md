# Development Guide

This guide covers the development workflow for the Video Nugget application.

## Prerequisites

### Required Tools

- **Node.js** (v18+) - Frontend development
- **Rust** (latest stable) - Backend development
- **Git** - Version control
- **jq** - JSON processing (for release script)

### Installation Commands

```bash
# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install jq (macOS)
brew install jq

# Install jq (Ubuntu)
sudo apt-get install jq
```

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd video-nugget
   make setup
   ```

2. **Start development:**
   ```bash
   make dev
   ```

3. **Run tests:**
   ```bash
   make test
   ```

## Development Workflow

### Available Commands

Use `make help` to see all available commands, or use these common ones:

```bash
# Development
make dev                 # Start development server
make build              # Build for production
make test               # Run all tests
make lint               # Check code quality
make lint-fix           # Auto-fix linting issues

# Release
make release-patch      # Create patch release (1.0.1)
make release-minor      # Create minor release (1.1.0)  
make release-major      # Create major release (2.0.0)
make release-dry-run    # Preview release changes

# Maintenance
make clean              # Clean build artifacts
make coverage           # Generate test coverage
```

### Using npm scripts directly:

```bash
npm run dev             # Start Vite dev server
npm run tauri:dev       # Start Tauri development
npm run test            # Run frontend tests
npm run test:rust       # Run Rust tests
npm run coverage        # Generate test coverage
```

## Project Structure

```
video-nugget/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── lib/               # Utilities and Tauri API
│   └── ...
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   │   ├── main.rs        # Main application
│   │   ├── video_processor.rs
│   │   ├── youtube_extractor.rs
│   │   └── file_manager.rs
│   └── Cargo.toml         # Rust dependencies
├── .github/workflows/     # CI/CD pipelines
├── scripts/               # Build and release scripts
├── Makefile              # Development commands
└── package.json          # Node.js dependencies
```

## Testing

### Running Tests

```bash
# Run all tests
make test

# Run specific test suites
make test-rust           # Rust unit tests
make test-frontend       # Frontend linting and type checking
npm run test:rust        # Direct cargo test

# Generate coverage report
make coverage           # Creates coverage/ directory with HTML report
```

### Writing Tests

#### Rust Tests
Tests are located alongside the code in `src-tauri/src/`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function_name() {
        // Test implementation
        assert_eq!(expected, actual);
    }

    #[tokio::test]
    async fn test_async_function() {
        // Async test implementation
        let result = async_function().await;
        assert!(result.is_ok());
    }
}
```

#### Test Coverage
- Aim for >80% code coverage
- Focus on critical paths and error handling
- Use `tempfile` for file system tests
- Mock external dependencies

## Code Quality

### Pre-commit Hooks

Install pre-commit hooks to ensure code quality:

```bash
make install-hooks
```

This will run the following checks on each commit:
- Rust formatting (`cargo fmt`)
- Rust linting (`cargo clippy`)  
- Rust tests (`cargo test`)
- Frontend linting (`eslint`)
- TypeScript type checking (`tsc`)
- Security scanning
- JSON/YAML validation

### Manual Quality Checks

```bash
# Run all quality checks
make lint

# Auto-fix issues
make lint-fix

# Individual checks
cd src-tauri && cargo fmt      # Format Rust code
cd src-tauri && cargo clippy   # Lint Rust code  
npm run lint                   # Lint frontend code
npx tsc --noEmit              # Check TypeScript types
```

## Release Process

### Automated Releases

Use the release script for consistent versioning:

```bash
# Patch release (1.0.0 -> 1.0.1)
make release-patch

# Minor release (1.0.0 -> 1.1.0)  
make release-minor

# Major release (1.0.0 -> 2.0.0)
make release-major

# Alpha release (1.0.0 -> 1.0.0-alpha.1)
make release-alpha

# Preview changes without releasing
make release-dry-run
```

### Release Steps

The release script automatically:

1. ✅ Validates current branch (main for stable releases)
2. ✅ Runs all tests
3. ✅ Updates version in all files
4. ✅ Creates git commit and tag
5. ✅ Pushes to GitHub
6. ✅ Triggers GitHub Actions to build and publish

### Manual Release

If needed, you can create releases manually:

```bash
# Update version in files
npm version patch --no-git-tag-version
# Update src-tauri/Cargo.toml version manually
# Update src-tauri/tauri.conf.json version manually

# Create and push tag
git add .
git commit -m "chore: bump version to 1.0.1"
git tag -a "v1.0.1" -m "Release v1.0.1"
git push origin main
git push origin v1.0.1
```

## CI/CD Pipelines

### Workflows

- **ci.yml** - Runs tests and builds on every push/PR
- **release.yml** - Builds and publishes releases when tags are pushed
- **test-coverage.yml** - Generates detailed coverage reports

### GitHub Actions Features

- ✅ Multi-platform builds (Windows, macOS, Linux)
- ✅ Automated testing with coverage reporting
- ✅ Security scanning
- ✅ Artifact uploads
- ✅ Release asset publishing

## Troubleshooting

### Common Issues

**Rust not found:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

**Tauri system dependencies (Linux):**
```bash
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf
```

**Permission denied on release script:**
```bash
chmod +x scripts/release.sh
```

**Pre-commit hooks failing:**
```bash
# Update hooks
pre-commit autoupdate

# Skip hooks for emergency commits (use sparingly)
git commit --no-verify -m "emergency fix"
```

### Development Tips

1. **Hot reload**: Both Vite and Tauri support hot reloading in development
2. **Debugging**: Use browser dev tools for frontend, `println!` or `log` for Rust
3. **Database**: Use temporary files for testing file operations
4. **Mock data**: YouTube extractor returns mock data - replace with real API calls
5. **Cross-platform**: Test on multiple platforms before release

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run quality checks: `make lint test`
5. Create a pull request

### Pull Request Checklist

- [ ] Tests pass locally
- [ ] Code is formatted and linted
- [ ] New features include tests
- [ ] Documentation is updated
- [ ] Breaking changes are documented

---

For more information, see the main [README.md](./README.md) file.