#!/bin/bash

echo "Building Website2 for GitHub Pages..."

# Create dist directory
mkdir -p dist

# Copy dashboard files
echo "Copying dashboard files..."
cp apps/dashboard/index.html dist/
cp apps/dashboard/admin.html dist/
cp apps/dashboard/api-client.js dist/

# Copy public assets
echo "Copying public assets..."
cp -r public/* dist/ 2>/dev/null || true

# Build Report Generator
echo "Building Report Generator..."
cd apps/report-generator/frontend
npm install
npm run build
cd ../../../

# Copy Report Generator dist
echo "Copying Report Generator build..."
cp -r apps/report-generator/frontend/dist/* dist/ 2>/dev/null || true

# Copy other frontend apps
echo "Copying other frontend apps..."
mkdir -p dist/invoice-generator
mkdir -p dist/resume-builder
mkdir -p dist/tds-manager

cp -r apps/invoice-generator/frontend/* dist/invoice-generator/ 2>/dev/null || true
cp -r apps/resume-builder/frontend/* dist/resume-builder/ 2>/dev/null || true
cp -r apps/tds-manager/* dist/tds-manager/ 2>/dev/null || true

echo "Build complete! Deploying to gh-pages..."
gh-pages -d dist

echo "✅ Successfully deployed to GitHub Pages!"
echo "Your site will be available at: https://mcharvtechlabs.com"
