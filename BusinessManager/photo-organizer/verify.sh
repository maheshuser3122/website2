#!/bin/bash
# Bad Photo Detection System - Verification Script

echo "========================================"
echo "Bad Photo Detection System Verification"
echo "========================================"
echo ""

# Check backend service
echo "✓ Checking Backend Service..."
if [ -f "backend/src/services/badPhotoDetectionService.js" ]; then
    echo "  ✅ badPhotoDetectionService.js exists"
    lines=$(wc -l < backend/src/services/badPhotoDetectionService.js)
    echo "     Lines: $lines"
else
    echo "  ❌ badPhotoDetectionService.js NOT FOUND"
fi

# Check frontend component
echo ""
echo "✓ Checking Frontend Component..."
if [ -f "frontend/src/pages/BadPhotoDetectionPage.jsx" ]; then
    echo "  ✅ BadPhotoDetectionPage.jsx exists"
    lines=$(wc -l < frontend/src/pages/BadPhotoDetectionPage.jsx)
    echo "     Lines: $lines"
else
    echo "  ❌ BadPhotoDetectionPage.jsx NOT FOUND"
fi

# Check CSS
echo ""
echo "✓ Checking Styling..."
if [ -f "frontend/src/styles/BadPhotoDetectionPage.css" ]; then
    echo "  ✅ BadPhotoDetectionPage.css exists"
    lines=$(wc -l < frontend/src/styles/BadPhotoDetectionPage.css)
    echo "     Lines: $lines"
else
    echo "  ❌ BadPhotoDetectionPage.css NOT FOUND"
fi

# Check App.jsx integration
echo ""
echo "✓ Checking App.jsx Integration..."
if grep -q "BadPhotoDetectionPage" frontend/src/App.jsx; then
    echo "  ✅ BadPhotoDetectionPage imported in App.jsx"
else
    echo "  ❌ BadPhotoDetectionPage NOT imported in App.jsx"
fi

if grep -q "bad-photos" frontend/src/App.jsx; then
    echo "  ✅ 'bad-photos' case exists in App.jsx"
else
    echo "  ❌ 'bad-photos' case NOT found in App.jsx"
fi

if grep -q "Trash2" frontend/src/App.jsx; then
    echo "  ✅ Trash2 icon imported in App.jsx"
else
    echo "  ❌ Trash2 icon NOT imported in App.jsx"
fi

# Check server.js integration
echo ""
echo "✓ Checking server.js Integration..."
if grep -q "BadPhotoDetectionService" backend/src/server.js; then
    echo "  ✅ BadPhotoDetectionService imported"
else
    echo "  ❌ BadPhotoDetectionService NOT imported"
fi

if grep -q "bad-photos/analyze" backend/src/server.js; then
    echo "  ✅ /api/bad-photos/analyze endpoint exists"
else
    echo "  ❌ /api/bad-photos/analyze endpoint NOT found"
fi

if grep -q "bad-photos/cleanup" backend/src/server.js; then
    echo "  ✅ /api/bad-photos/cleanup endpoint exists"
else
    echo "  ❌ /api/bad-photos/cleanup endpoint NOT found"
fi

if grep -q "bad-photos/detection-methods" backend/src/server.js; then
    echo "  ✅ /api/bad-photos/detection-methods endpoint exists"
else
    echo "  ❌ /api/bad-photos/detection-methods endpoint NOT found"
fi

# Check sample photos
echo ""
echo "✓ Checking Sample Photos..."
if [ -d "sample_photos" ]; then
    photo_count=$(find sample_photos -type f -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l)
    echo "  ✅ sample_photos directory exists"
    echo "     Photos found: $photo_count"
else
    echo "  ❌ sample_photos directory NOT FOUND"
fi

echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
