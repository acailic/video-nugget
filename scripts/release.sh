#!/bin/bash

# Video Nugget Release Script
# Automates version bumping, tagging, and release creation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
RELEASE_TYPE=""
SKIP_TESTS=false
DRY_RUN=false
CURRENT_BRANCH=$(git branch --show-current)

# Function to print usage
usage() {
    echo "Usage: $0 -t <release_type> [options]"
    echo ""
    echo "Required arguments:"
    echo "  -t, --type TYPE     Release type: major, minor, patch, alpha, beta, rc"
    echo ""
    echo "Optional arguments:"
    echo "  -s, --skip-tests    Skip running tests before release"
    echo "  -d, --dry-run       Show what would be done without making changes"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t patch                    # Release v1.0.1"
    echo "  $0 -t minor                    # Release v1.1.0"
    echo "  $0 -t major                    # Release v2.0.0"
    echo "  $0 -t alpha                    # Release v1.0.0-alpha.1"
    echo "  $0 -t patch --dry-run          # Show what would happen"
    exit 1
}

# Function to print colored output
log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to get current version from Cargo.toml
get_current_version() {
    grep '^version = ' src-tauri/Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/'
}

# Function to calculate next version
calculate_next_version() {
    local current_version=$1
    local release_type=$2
    
    # Parse version components
    if [[ $current_version =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(-(.+))?$ ]]; then
        major=${BASH_REMATCH[1]}
        minor=${BASH_REMATCH[2]}
        patch=${BASH_REMATCH[3]}
        prerelease=${BASH_REMATCH[5]}
    else
        log $RED "Error: Invalid version format: $current_version"
        exit 1
    fi
    
    case $release_type in
        major)
            echo "$((major + 1)).0.0"
            ;;
        minor)
            echo "${major}.$((minor + 1)).0"
            ;;
        patch)
            echo "${major}.${minor}.$((patch + 1))"
            ;;
        alpha)
            if [[ -z $prerelease ]]; then
                echo "${major}.${minor}.${patch}-alpha.1"
            else
                # Extract alpha number and increment
                if [[ $prerelease =~ ^alpha\.([0-9]+)$ ]]; then
                    alpha_num=${BASH_REMATCH[1]}
                    echo "${major}.${minor}.${patch}-alpha.$((alpha_num + 1))"
                else
                    echo "${major}.${minor}.${patch}-alpha.1"
                fi
            fi
            ;;
        beta)
            if [[ -z $prerelease ]]; then
                echo "${major}.${minor}.${patch}-beta.1"
            else
                if [[ $prerelease =~ ^beta\.([0-9]+)$ ]]; then
                    beta_num=${BASH_REMATCH[1]}
                    echo "${major}.${minor}.${patch}-beta.$((beta_num + 1))"
                else
                    echo "${major}.${minor}.${patch}-beta.1"
                fi
            fi
            ;;
        rc)
            if [[ -z $prerelease ]]; then
                echo "${major}.${minor}.${patch}-rc.1"
            else
                if [[ $prerelease =~ ^rc\.([0-9]+)$ ]]; then
                    rc_num=${BASH_REMATCH[1]}
                    echo "${major}.${minor}.${patch}-rc.$((rc_num + 1))"
                else
                    echo "${major}.${minor}.${patch}-rc.1"
                fi
            fi
            ;;
        *)
            log $RED "Error: Invalid release type: $release_type"
            exit 1
            ;;
    esac
}

# Function to update version in files
update_version_files() {
    local new_version=$1
    
    if [[ $DRY_RUN == true ]]; then
        log $YELLOW "Would update version to $new_version in:"
        log $YELLOW "  - src-tauri/Cargo.toml"
        log $YELLOW "  - package.json"
        log $YELLOW "  - src-tauri/tauri.conf.json"
        return
    fi
    
    # Update Cargo.toml
    sed -i.bak "s/^version = \".*\"/version = \"$new_version\"/" src-tauri/Cargo.toml
    rm src-tauri/Cargo.toml.bak
    
    # Update package.json
    npm version $new_version --no-git-tag-version
    
    # Update tauri.conf.json
    jq ".version = \"$new_version\"" src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp
    mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json
    
    log $GREEN "✓ Updated version files to $new_version"
}

# Function to run tests
run_tests() {
    if [[ $SKIP_TESTS == true ]]; then
        log $YELLOW "⚠ Skipping tests"
        return
    fi
    
    if [[ $DRY_RUN == true ]]; then
        log $YELLOW "Would run tests"
        return
    fi
    
    log $YELLOW "Running tests..."
    
    # Frontend tests
    npm run lint
    npx tsc --noEmit
    
    # Backend tests
    cd src-tauri
    cargo fmt --all -- --check
    cargo clippy --all-targets --all-features -- -D warnings
    cargo test --verbose
    cd ..
    
    log $GREEN "✓ All tests passed"
}

# Function to create git tag and commit
create_release() {
    local version=$1
    local tag="v$version"
    
    if [[ $DRY_RUN == true ]]; then
        log $YELLOW "Would create git commit and tag $tag"
        return
    fi
    
    # Add all changed files
    git add .
    
    # Create commit
    git commit -m "chore: bump version to $version"
    
    # Create tag
    git tag -a "$tag" -m "Release $tag"
    
    log $GREEN "✓ Created commit and tag $tag"
}

# Function to push changes
push_changes() {
    local version=$1
    local tag="v$version"
    
    if [[ $DRY_RUN == true ]]; then
        log $YELLOW "Would push changes to origin"
        return
    fi
    
    # Push commit and tag
    git push origin $CURRENT_BRANCH
    git push origin "$tag"
    
    log $GREEN "✓ Pushed changes to origin"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            RELEASE_TYPE="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log $RED "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate required arguments
if [[ -z $RELEASE_TYPE ]]; then
    log $RED "Error: Release type is required"
    usage
fi

# Validate release type
case $RELEASE_TYPE in
    major|minor|patch|alpha|beta|rc)
        ;;
    *)
        log $RED "Error: Invalid release type: $RELEASE_TYPE"
        usage
        ;;
esac

# Main execution
main() {
    log $GREEN "🚀 Starting Video Nugget release process..."
    
    # Check if we're on main branch for stable releases
    if [[ $RELEASE_TYPE =~ ^(major|minor|patch)$ && $CURRENT_BRANCH != "main" ]]; then
        log $RED "Error: Stable releases must be created from the main branch"
        log $YELLOW "Current branch: $CURRENT_BRANCH"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) && $DRY_RUN == false ]]; then
        log $RED "Error: You have uncommitted changes"
        log $YELLOW "Please commit or stash your changes before releasing"
        exit 1
    fi
    
    # Get current version
    local current_version=$(get_current_version)
    log $YELLOW "Current version: $current_version"
    
    # Calculate next version
    local next_version=$(calculate_next_version $current_version $RELEASE_TYPE)
    log $YELLOW "Next version: $next_version"
    
    if [[ $DRY_RUN == true ]]; then
        log $YELLOW "🔍 DRY RUN MODE - No changes will be made"
    fi
    
    # Confirm release
    if [[ $DRY_RUN == false ]]; then
        echo -n "Create release $next_version? (y/N): "
        read -r confirm
        if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
            log $YELLOW "Release cancelled"
            exit 0
        fi
    fi
    
    # Execute release steps
    run_tests
    update_version_files $next_version
    create_release $next_version
    push_changes $next_version
    
    if [[ $DRY_RUN == true ]]; then
        log $GREEN "✅ Dry run completed successfully"
        log $YELLOW "To actually create the release, remove the --dry-run flag"
    else
        log $GREEN "✅ Release $next_version created successfully!"
        log $YELLOW "GitHub Actions will now build and publish the release"
        log $YELLOW "View the release at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\).git/\1/')/releases"
    fi
}

# Check if required tools are installed
check_dependencies() {
    local missing_deps=()
    
    command -v git >/dev/null 2>&1 || missing_deps+=(git)
    command -v npm >/dev/null 2>&1 || missing_deps+=(npm)
    command -v cargo >/dev/null 2>&1 || missing_deps+=(cargo)
    command -v jq >/dev/null 2>&1 || missing_deps+=(jq)
    
    if [[ ${#missing_deps[@]} -ne 0 ]]; then
        log $RED "Error: Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            log $RED "  - $dep"
        done
        exit 1
    fi
}

# Run dependency check and main function
check_dependencies
main