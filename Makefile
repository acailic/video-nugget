.PHONY: help setup dev build test lint clean release install-hooks

# Default help target
help:
	@echo "Video Nugget Development Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  setup          Install all dependencies and setup development environment"
	@echo "  install-hooks  Install pre-commit hooks"
	@echo ""
	@echo "Development:"
	@echo "  dev            Start development server"
	@echo "  build          Build for production"
	@echo "  build-dev      Build for development"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  test           Run all tests"
	@echo "  test-rust      Run Rust tests only"
	@echo "  test-frontend  Run frontend tests only"
	@echo "  lint           Run all linters"
	@echo "  lint-fix       Fix linting issues automatically"
	@echo "  coverage       Generate test coverage report"
	@echo ""
	@echo "Release:"
	@echo "  release-patch  Create patch release (1.0.0 -> 1.0.1)"
	@echo "  release-minor  Create minor release (1.0.0 -> 1.1.0)"  
	@echo "  release-major  Create major release (1.0.0 -> 2.0.0)"
	@echo "  release-alpha  Create alpha release (1.0.0 -> 1.0.0-alpha.1)"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean          Clean build artifacts"
	@echo "  deps-update    Update dependencies"

# Setup and installation
setup:
	@echo "🔧 Setting up development environment..."
	npm ci
	@echo "✅ Setup complete!"

install-hooks:
	@echo "🔧 Installing pre-commit hooks..."
	pip install pre-commit
	pre-commit install
	pre-commit install --hook-type commit-msg
	@echo "✅ Pre-commit hooks installed!"

# Development
dev:
	@echo "🚀 Starting development server..."
	npm run tauri:dev

build:
	@echo "📦 Building for production..."
	npm run build
	npm run tauri:build

build-dev:
	@echo "📦 Building for development..."
	npm run build:dev

# Testing
test: test-frontend test-rust

test-rust:
	@echo "🧪 Running Rust tests..."
	cd src-tauri && cargo test --verbose

test-frontend:
	@echo "🧪 Running frontend tests..."
	npm run lint
	npx tsc --noEmit

coverage:
	@echo "📊 Generating test coverage..."
	cd src-tauri && cargo install cargo-tarpaulin
	cd src-tauri && cargo tarpaulin --out html --output-dir ../coverage
	@echo "✅ Coverage report generated in coverage/ directory"

# Linting
lint:
	@echo "🔍 Running all linters..."
	npm run lint
	npx tsc --noEmit
	cd src-tauri && cargo fmt -- --check
	cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings

lint-fix:
	@echo "🔧 Fixing linting issues..."
	npm run lint -- --fix
	cd src-tauri && cargo fmt

# Release management
release-patch:
	@./scripts/release.sh -t patch

release-minor:
	@./scripts/release.sh -t minor

release-major:
	@./scripts/release.sh -t major

release-alpha:
	@./scripts/release.sh -t alpha

release-dry-run:
	@./scripts/release.sh -t patch --dry-run

# Maintenance
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf coverage/
	rm -rf node_modules/.cache/
	cd src-tauri && cargo clean
	@echo "✅ Clean complete!"

deps-update:
	@echo "📦 Updating dependencies..."
	npm update
	cd src-tauri && cargo update
	@echo "✅ Dependencies updated!"

# Tauri-specific commands
tauri-info:
	@echo "ℹ️ Tauri system information:"
	npx tauri info

tauri-dev:
	npm run tauri:dev

tauri-build:
	npm run tauri:build

# Git helpers
git-status:
	@git status --short

git-log:
	@git log --oneline -10

# Docker support (future)
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t video-nugget .

docker-run:
	@echo "🐳 Running in Docker..."
	docker run -p 3000:3000 video-nugget