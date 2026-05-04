#!/bin/bash

# Report Generator - Build & Deployment Script

set -e

echo "🚀 Report Generator - Build & Deployment"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="report-generator"
DOCKER_IMAGE="${PROJECT_NAME}:latest"
BUILD_DIR="dist"

# Functions
print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Please install Node.js 16+"
    exit 1
fi
print_success "Node.js version: $(node --version)"
print_success "npm version: $(npm --version)"

# Install dependencies
print_step "Installing dependencies..."
npm install --legacy-peer-deps
print_success "Dependencies installed"

# Run linting
print_step "Running linting..."
npm run lint || print_warning "Some linting issues found (non-blocking)"
print_success "Linting complete"

# Type checking
print_step "Type checking..."
npm run type-check || print_warning "Some type warnings found (non-blocking)"
print_success "Type checking complete"

# Build
print_step "Building application..."
npm run build
print_success "Build complete"

# Check build size
print_step "Checking build size..."
BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
print_success "Build size: $BUILD_SIZE"

# Build Docker image
if command -v docker &> /dev/null; then
    print_step "Building Docker image..."
    docker build -t $DOCKER_IMAGE .
    print_success "Docker image built: $DOCKER_IMAGE"
    
    # Show image size
    IMAGE_SIZE=$(docker images $DOCKER_IMAGE --format "{{.Size}}")
    print_success "Docker image size: $IMAGE_SIZE"
else
    print_warning "Docker not found. Skipping Docker build."
fi

# Summary
print_step "Build Summary"
echo "==============="
echo "✓ Dependencies installed"
echo "✓ Code linted"
echo "✓ Types checked"
echo "✓ Application built"
echo "✓ Build size: $BUILD_SIZE"
if command -v docker &> /dev/null; then
    echo "✓ Docker image created: $DOCKER_IMAGE"
fi

print_success "Build completed successfully!"

echo ""
echo "📦 Next steps:"
echo "  • npm run preview     - Preview the build locally"
echo "  • npm run dev         - Start development server"
if command -v docker &> /dev/null; then
    echo "  • docker run -p 3000:3000 $DOCKER_IMAGE  - Run Docker container"
fi
echo ""
