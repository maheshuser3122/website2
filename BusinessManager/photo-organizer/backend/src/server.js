import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { ScannerService } from './services/scannerService.js';
import { GeocodingService } from './services/geocodingService.js';
import { OrganizationService } from './services/organizationService.js';
import { AutoEditService } from './services/autoEditService.js';
import SmartOrganizeService from './services/smartOrganizeService.js';
import PhotoNamingService from './services/photoNamingService.js';
import QualityDetectionService from './services/qualityDetectionService.js';
import { AutoEnhancementService } from './services/autoEnhancementService.js';
import { BadPhotoDetectionService } from './services/badPhotoDetectionService.js';
import { DuplicateDetectionService } from './services/duplicateDetectionService.js';
import { AIVisionService } from './services/aiVisionService.js';
import { AIEnhancedBadPhotoDetectionService } from './services/aiEnhancedBadPhotoDetectionService.js';
import AIQualityDetectionService from './services/aiQualityDetectionService.js';
import { BatchPhotoProcessingService } from './services/batchPhotoProcessingService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services
const scannerService = new ScannerService();
const geocodingService = new GeocodingService();
const organizationService = new OrganizationService();
const autoEditService = new AutoEditService();
const smartOrganizeService = new SmartOrganizeService();
const photoNamingService = new PhotoNamingService();
const autoEnhancementService = new AutoEnhancementService();
const badPhotoDetectionService = new BadPhotoDetectionService();
const duplicateDetectionService = new DuplicateDetectionService();

// Initialize AI services
const aiVisionService = new AIVisionService();
const aiEnhancedBadPhotoDetection = new AIEnhancedBadPhotoDetectionService();
const aiQualityDetection = new AIQualityDetectionService();
const batchPhotoProcessingService = new BatchPhotoProcessingService();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 }
}));

// In-memory storage for session data
let sessionData = {
  photos: [],
  locations: [],
  currentScan: null
};

// Store progress update callbacks
let progressClients = [];

// SSE endpoint for progress updates
app.get('/api/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  progressClients.push(res);
  
  // Send initial state
  if (sessionData.currentScan) {
    res.write(`data: ${JSON.stringify(sessionData.currentScan)}\n\n`);
  }
  
  req.on('close', () => {
    progressClients = progressClients.filter(client => client !== res);
  });
});

// Broadcast progress to all connected clients
function broadcastProgress(progressData) {
  progressClients.forEach(client => {
    client.write(`data: ${JSON.stringify(progressData)}\n\n`);
  });
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Photo Organizer API is running' });
});

// Serve image file endpoint
app.get('/api/image', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      return res.status(403).json({ error: 'Invalid path' });
    }

    const stats = await fs.stat(normalizedPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    
    const fileStream = (await fs.readFile(normalizedPath));
    res.send(fileStream);
  } catch (error) {
    console.error('Image serving error:', error.message);
    res.status(404).json({ error: 'Image not found' });
  }
});

// Test OpenAI API Key
app.post('/api/test-api-key', async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({ valid: false, error: 'API key is required' });
  }

  try {
    // Import OpenAI directly to test
    const { default: OpenAI } = await import('openai');
    
    const client = new OpenAI({
      apiKey: apiKey.trim()
    });

    // Simple test: List models to validate API key works
    const models = await client.models.list();

    if (models && models.data && models.data.length > 0) {
      res.json({
        valid: true,
        message: 'API key is valid and working',
        model: 'gpt-4-vision-preview'
      });
    } else {
      res.status(400).json({
        valid: false,
        error: 'API key is valid but no models available'
      });
    }
  } catch (error) {
    console.error('API key test error:', error.message);
    
    let errorMsg = 'API test failed';
    const errorStr = error.message.toLowerCase();
    
    if (errorStr.includes('401') || errorStr.includes('invalid_api_key') || errorStr.includes('unauthorized')) {
      errorMsg = 'Invalid API key. Please check your key and try again.';
    } else if (errorStr.includes('429') || errorStr.includes('rate_limit')) {
      errorMsg = 'Rate limit exceeded. Please try again later.';
    } else if (errorStr.includes('econnrefused') || errorStr.includes('enotfound')) {
      errorMsg = 'Cannot connect to OpenAI. Check your internet connection.';
    } else if (errorStr.includes('timeout')) {
      errorMsg = 'Request timed out. Try again in a moment.';
    }
    
    res.status(400).json({
      valid: false,
      error: errorMsg
    });
  }
});

// List folders in a directory
app.post('/api/folders', async (req, res) => {
  const { path: folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: 'path is required' });
  }

  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const folders = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name)
      .sort();

    res.json({ success: true, folders });
  } catch (error) {
    console.error(`Error reading directory ${folderPath}:`, error.message);
    res.status(400).json({ 
      success: false, 
      error: `Cannot access directory: ${error.message}` 
    });
  }
});

// Open folder in file explorer
app.post('/api/open-folder', async (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: 'folderPath is required' });
  }

  try {
    // Convert relative path to absolute
    let absolutePath = folderPath;
    if (!path.isAbsolute(folderPath)) {
      absolutePath = path.join(process.cwd(), folderPath);
    }

    // Check if folder exists
    await fs.access(absolutePath);

    // Open based on platform
    const platform = process.platform;
    if (platform === 'win32') {
      exec(`explorer "${absolutePath}"`, (error) => {
        if (error) {
          console.error('Error opening folder:', error);
        }
      });
    } else if (platform === 'darwin') {
      exec(`open "${absolutePath}"`, (error) => {
        if (error) {
          console.error('Error opening folder:', error);
        }
      });
    } else {
      // Linux
      exec(`xdg-open "${absolutePath}"`, (error) => {
        if (error) {
          console.error('Error opening folder:', error);
        }
      });
    }

    res.json({ 
      success: true, 
      message: `Opening folder: ${absolutePath}` 
    });
  } catch (error) {
    console.error(`Error opening folder ${folderPath}:`, error.message);
    res.status(400).json({ 
      success: false, 
      error: `Cannot open folder: ${error.message}` 
    });
  }
});

// Start photo scan
app.post('/api/scan', async (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: 'folderPath is required' });
  }

  try {
    console.log(`Starting scan for: ${folderPath}`);
    sessionData.currentScan = { status: 'scanning', startTime: new Date(), processed: 0, failed: 0, total: 0, currentFile: '' };
    broadcastProgress(sessionData.currentScan);
    
    // Set progress callback
    scannerService.onProgressUpdate = (progress) => {
      sessionData.currentScan = { ...progress, startTime: sessionData.currentScan.startTime };
      broadcastProgress(sessionData.currentScan);
    };
    
    const result = await scannerService.scanDirectory(folderPath);
    console.log(`Scan result:`, result);

    if (result.success) {
      // Geocode all photos with GPS data
      const photosWithLocation = await geocodePhotos(result.photos);
      
      // Transform photos to have metadata structure
      const transformedPhotos = transformPhotoData(photosWithLocation);
      sessionData.photos = transformedPhotos;

      // Summarize locations
      sessionData.locations = summarizeLocations(transformedPhotos);
      sessionData.currentScan = { status: 'complete', endTime: new Date() };

      res.json({
        success: true,
        message: `Scanned and organized ${result.photos.length} photos`,
        stats: result.stats,
        photos: sessionData.photos,
        locations: sessionData.locations
      });
    } else {
      sessionData.currentScan = { status: 'failed', error: result.error };
      res.status(500).json({
        success: false,
        error: result.error,
        photos: result.photos,
        stats: result.stats
      });
    }
  } catch (error) {
    console.error('Scan error:', error);
    sessionData.currentScan = { status: 'failed', error: error.message };
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scan progress
app.get('/api/scan/progress', (req, res) => {
  res.json({
    progress: scannerService.getProgress(),
    sessionStatus: sessionData.currentScan
  });
});

// Get all scanned photos
app.get('/api/photos', (req, res) => {
  const { country, city, startDate, endDate } = req.query;
  
  let filtered = sessionData.photos;

  if (country) {
    filtered = filtered.filter(p => p.location?.country === country);
  }
  if (city) {
    filtered = filtered.filter(p => p.location?.city === city);
  }
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    filtered = filtered.filter(p => {
      if (!p.dateTime) return true;
      const photoDate = new Date(p.dateTime);
      if (start && photoDate < start) return false;
      if (end && photoDate > end) return false;
      return true;
    });
  }

  res.json({
    total: filtered.length,
    photos: filtered
  });
});

// Get location summary
app.get('/api/locations', (req, res) => {
  res.json({
    total: sessionData.locations.length,
    locations: sessionData.locations
  });
});

// Organize and export photos
app.post('/api/organize', async (req, res) => {
  const { outputPath, scheme } = req.body;

  if (!outputPath) {
    return res.status(400).json({ error: 'outputPath is required' });
  }

  try {
    const result = await organizationService.organizePhotos(
      sessionData.photos,
      outputPath,
      scheme || 'country/city/year'
    );

    // Also create an index
    await organizationService.createPhotoIndex(sessionData.photos, outputPath);

    res.json({
      success: true,
      message: 'Photos organized successfully',
      stats: result.stats,
      results: result.organized.slice(0, 10) // Return first 10 for preview
    });
  } catch (error) {
    console.error('Organization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  res.json({
    totalPhotos: sessionData.photos.length,
    photosWithGPS: sessionData.photos.filter(p => p.gps).length,
    photosWithMetadata: sessionData.photos.filter(p => p.camera).length,
    uniqueLocations: sessionData.locations.length,
    uniqueCountries: [...new Set(sessionData.photos.map(p => p.location?.country).filter(Boolean))].length,
    cameras: getCameraStats(sessionData.photos)
  });
});

// Helper functions

// Transform photo data into metadata structure expected by frontend
function transformPhotoData(photos) {
  return photos.map(photo => {
    // Create a readable location string
    const locationString = photo.location 
      ? `${photo.location.city || ''}, ${photo.location.country || ''}`.trim().replace(/^,\s*|\s*,$/, '')
      : null;

    return {
      id: photo.id,
      name: photo.filename,
      path: photo.filepath,
      size: photo.filesize,
      modified: photo.modified,
      thumbnail: photo.thumbnail || '',
      metadata: {
        dateTime: photo.dateTime,
        location: locationString,
        locationObject: photo.location, // Keep full location object for services
        exif: {
          Model: photo.camera?.model,
          Make: photo.camera?.make,
          LensModel: photo.camera?.lensModel,
          GPSLatitude: photo.gps?.latitude,
          GPSLongitude: photo.gps?.longitude,
          GPSAltitude: photo.gps?.altitude
        }
      }
    };
  });
}

async function geocodePhotos(photos) {
  const photosWithLocation = [];

  for (const photo of photos) {
    if (photo.gps) {
      try {
        const location = await geocodingService.reverseGeocode(
          photo.gps.latitude,
          photo.gps.longitude
        );
        photosWithLocation.push({ ...photo, location });
      } catch (error) {
        console.error('Geocoding error:', error);
        photosWithLocation.push(photo);
      }
    } else {
      photosWithLocation.push(photo);
    }
  }

  return photosWithLocation;
}

function summarizeLocations(photos) {
  const locationMap = new Map();

  photos.forEach(photo => {
    if (photo.location) {
      const key = `${photo.location.country}|${photo.location.city}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          ...photo.location,
          photoCount: 0
        });
      }
      const loc = locationMap.get(key);
      loc.photoCount++;
    }
  });

  return Array.from(locationMap.values());
}

function getCameraStats(photos) {
  const cameraMap = new Map();

  photos.forEach(photo => {
    if (photo.camera?.model) {
      const key = photo.camera.model;
      if (!cameraMap.has(key)) {
        cameraMap.set(key, { model: key, count: 0 });
      }
      cameraMap.get(key).count++;
    }
  });

  return Array.from(cameraMap.values()).sort((a, b) => b.count - a.count);
}

// Generate smart names for photos
app.post('/api/smart-names', async (req, res) => {
  const { photos } = req.body;

  if (!photos || photos.length === 0) {
    return res.status(400).json({ error: 'No photos provided' });
  }

  try {
    const namedPhotos = photoNamingService.generateNamesForPhotos(photos);

    res.json({
      success: true,
      message: `Generated smart names for ${namedPhotos.length} photos`,
      photos: namedPhotos
    });
  } catch (error) {
    console.error('Smart naming error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Auto-edit endpoint
app.post('/api/auto-edit', async (req, res) => {
  const { photos, effects } = req.body;

  if (!photos || photos.length === 0) {
    return res.status(400).json({ error: 'No photos provided' });
  }

  try {
    const result = await autoEditService.autoEditPhotos(photos, effects);

    res.json({
      success: true,
      message: `Applied effects to ${result.edited.length} Canon R50 photos`,
      stats: result.stats,
      edited: result.edited.length,
      organized: result.edited.length,
      failed: result.failed.length,
      outputPath: 'Effects logged (Use Smart Organize to save edited photos to: ./smart_organized_photos/)',
      details: result.edited.slice(0, 10), // Return first 10 for preview
      failedDetails: result.failed
    });
  } catch (error) {
    console.error('Auto-edit error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Smart organize by location with auto-edit
app.post('/api/smart-organize', async (req, res) => {
  const { photos, effects, suggestedNames } = req.body;

  if (!photos || photos.length === 0) {
    return res.status(400).json({ error: 'No photos provided' });
  }

  try {
    // Set up progress callback
    smartOrganizeService.onProgressUpdate = (progress) => {
      broadcastProgress(progress);
    };

    const result = await smartOrganizeService.organizeByLocation(photos, effects, suggestedNames);

    res.json({
      success: result.success,
      message: result.message,
      stats: result.stats,
      processed: result.stats.processed,
      locationsCreated: result.stats.locationsCreated,
      failed: result.stats.failed,
      locations: result.results.locations,
      outputPath: result.results.outputPath,
      failedPhotos: result.results.failed.slice(0, 10)
    });
  } catch (error) {
    console.error('Smart organize error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// Quality detection: Analyze all photos for quality issues
app.post('/api/analyze-quality', async (req, res) => {
  const { photos } = req.body;

  if (!photos || photos.length === 0) {
    return res.status(400).json({ error: 'No photos provided' });
  }

  try {
    const analyzedPhotos = [];
    const total = photos.length;

    console.log(`[QualityDetection] Analyzing ${total} photos for quality issues`);

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      const analysis = await QualityDetectionService.analyzePhoto(
        photo.filepath,
        photo.filename
      );

      // Add recommendation
      analysis.recommendation = QualityDetectionService.getRecommendation(analysis);

      analyzedPhotos.push(analysis);

      // Broadcast progress
      broadcastProgress({
        type: 'quality',
        current: `Analyzing: ${photo.filename}`,
        processed: i + 1,
        total
      });
    }

    // Find duplicates
    const { duplicates, unique } = QualityDetectionService.findDuplicates(analyzedPhotos);

    // Mark duplicates in analysis
    duplicates.forEach(group => {
      group.forEach((photo, idx) => {
        if (idx > 0) { // Mark all but first as potential duplicate
          const analysis = analyzedPhotos.find(a => a.filepath === photo.filepath);
          if (analysis) {
            analysis.quality.issues.push({
              type: 'duplicate',
              severity: 'medium',
              message: 'Potential duplicate of ' + group[0].filename
            });
            analysis.recommendation = QualityDetectionService.getRecommendation(analysis);
          }
        }
      });
    });

    // Separate into categories
    const flagged = analyzedPhotos.filter(p => p.quality.flagged);
    const good = analyzedPhotos.filter(p => !p.quality.flagged);
    const toReview = flagged.filter(p => p.recommendation.action === 'review');
    const toDelete = flagged.filter(p => p.recommendation.action === 'delete');

    res.json({
      success: true,
      stats: {
        total,
        good: good.length,
        flagged: flagged.length,
        toReview: toReview.length,
        toDelete: toDelete.length,
        duplicates: duplicates.length
      },
      analysis: analyzedPhotos,
      duplicates,
      summary: {
        good: good.map(p => ({ filename: p.filename, score: p.quality.score })),
        flagged: flagged.map(p => ({
          filename: p.filename,
          score: p.quality.score,
          issues: p.quality.issues,
          recommendation: p.recommendation
        }))
      }
    });
  } catch (error) {
    console.error('Quality analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quality decision: Delete or keep flagged photos
app.post('/api/quality-action', async (req, res) => {
  const { actions } = req.body; // { [photoPath]: 'keep' | 'delete' }

  if (!actions || typeof actions !== 'object') {
    return res.status(400).json({ error: 'Invalid actions provided' });
  }

  try {
    let deleted = 0;
    let kept = 0;
    const errors = [];

    for (const [photoPath, action] of Object.entries(actions)) {
      try {
        if (action === 'delete') {
          await fs.unlink(photoPath);
          deleted++;
          console.log(`[QualityAction] Deleted: ${photoPath}`);
        } else if (action === 'keep') {
          kept++;
        }
      } catch (err) {
        errors.push({
          file: photoPath,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      stats: {
        deleted,
        kept,
        errors: errors.length
      },
      details: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Quality action error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint: Inject GPS data into scanned photos (for testing without real GPS)
app.post('/api/test/inject-gps', (req, res) => {
  if (!sessionData.photos || sessionData.photos.length === 0) {
    return res.status(400).json({ error: 'No photos scanned yet' });
  }

  // Halloween locations with GPS coordinates
  const halloweenLocations = [
    { city: 'Salem', country: 'USA', latitude: 42.5195, longitude: -70.8967, state: 'Massachusetts' },
    { city: 'Sleepy Hollow', country: 'USA', latitude: 41.0534, longitude: -73.8621, state: 'New York' },
    { city: 'Transylvania', country: 'Romania', latitude: 45.9532, longitude: 24.9675, state: 'Cluj' },
    { city: 'Dublin', country: 'Ireland', latitude: 53.3498, longitude: -6.2603, state: 'Dublin' },
    { city: 'New Orleans', country: 'USA', latitude: 29.9511, longitude: -90.2623, state: 'Louisiana' },
    { city: 'Oahu', country: 'Hawaii', latitude: 21.3099, longitude: -157.8581, state: 'Hawaii' }
  ];

  // Assign GPS data cycling through locations
  const updatedPhotos = sessionData.photos.map((photo, idx) => {
    const location = halloweenLocations[idx % halloweenLocations.length];
    return {
      ...photo,
      metadata: {
        ...photo.metadata,
        locationObject: location,
        location: `${location.city}, ${location.country}`,
        exif: {
          ...photo.metadata.exif,
          GPSLatitude: location.latitude,
          GPSLongitude: location.longitude
        }
      }
    };
  });

  sessionData.photos = updatedPhotos;
  sessionData.locations = halloweenLocations.slice(0, Math.min(6, sessionData.photos.length));

  res.json({
    success: true,
    message: `Injected GPS data into ${updatedPhotos.length} photos for testing`,
    photos: updatedPhotos,
    locations: sessionData.locations
  });
});

// Enhancement endpoints
app.post('/api/enhance/auto', async (req, res) => {
  const { photoPaths } = req.body;

  if (!photoPaths || photoPaths.length === 0) {
    return res.status(400).json({ error: 'No photos provided' });
  }

  try {
    const results = [];
    
    for (const photoPath of photoPaths) {
      try {
        const result = await autoEnhancementService.autoEnhance(photoPath);
        results.push(result);
      } catch (err) {
        results.push({
          success: false,
          path: photoPath,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Enhanced ${results.filter(r => r.success).length}/${photoPaths.length} photos`,
      results,
      stats: {
        total: photoPaths.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enhance/custom', async (req, res) => {
  const { photoPath, enhancements } = req.body;

  if (!photoPath || !enhancements) {
    return res.status(400).json({ error: 'photoPath and enhancements are required' });
  }

  try {
    const result = await autoEnhancementService.enhanceWithOptions(photoPath, enhancements);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enhance/crop', async (req, res) => {
  const { photoPath } = req.body;

  if (!photoPath) {
    return res.status(400).json({ error: 'photoPath is required' });
  }

  try {
    const result = await autoEnhancementService.autoCrop(photoPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enhance/straighten', async (req, res) => {
  const { photoPath, angle } = req.body;

  if (!photoPath) {
    return res.status(400).json({ error: 'photoPath is required' });
  }

  try {
    const result = await autoEnhancementService.straighten(photoPath, angle || 0);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enhance/detect-type', async (req, res) => {
  const { photoPath } = req.body;

  if (!photoPath) {
    return res.status(400).json({ error: 'photoPath is required' });
  }

  try {
    const photoType = await autoEnhancementService.detectPhotoType(photoPath);
    res.json({ 
      success: true,
      photoPath,
      type: photoType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/enhance/batch', async (req, res) => {
  res.json({
    endpoints: [
      { method: 'POST', path: '/api/enhance/auto', description: 'Auto-enhance photos' },
      { method: 'POST', path: '/api/enhance/custom', description: 'Custom enhancements' },
      { method: 'POST', path: '/api/enhance/crop', description: 'Auto-crop' },
      { method: 'POST', path: '/api/enhance/straighten', description: 'Straighten tilted photos' },
      { method: 'POST', path: '/api/enhance/detect-type', description: 'Detect photo type' }
    ]
  });
});

// Bad Photo Detection endpoints
app.post('/api/bad-photos/analyze', async (req, res) => {
  const { photoPaths } = req.body;

  if (!photoPaths || photoPaths.length === 0) {
    return res.status(400).json({ error: 'No photos provided' });
  }

  try {
    const results = await badPhotoDetectionService.batchAnalyze(photoPaths);
    const summary = badPhotoDetectionService.summarizeResults(results);

    res.json({
      success: true,
      message: `Analyzed ${results.length} photos for bad quality`,
      results,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bad-photos/cleanup', async (req, res) => {
  const { photoPaths, mode = 'review' } = req.body;

  if (!photoPaths || photoPaths.length === 0) {
    return res.status(400).json({ error: 'No photos provided' });
  }

  try {
    const results = await badPhotoDetectionService.batchAnalyze(photoPaths);
    const summary = badPhotoDetectionService.summarizeResults(results);

    if (mode === 'auto-delete') {
      // Auto-delete mode: delete high-confidence bad photos
      const deleted = [];
      const kept = [];
      const errors = [];

      for (const result of results) {
        if (result.error) {
          errors.push({ photo: result.filename, error: result.error });
          continue;
        }

        if (result.recommendation.action === 'auto-delete') {
          try {
            await fs.unlink(result.path);
            deleted.push(result.filename);
          } catch (err) {
            errors.push({ photo: result.filename, error: err.message });
          }
        } else {
          kept.push(result.filename);
        }
      }

      res.json({
        success: true,
        mode: 'auto-delete',
        stats: {
          deleted: deleted.length,
          kept: kept.length,
          errors: errors.length
        },
        deleted,
        kept,
        errors,
        summary
      });
    } else {
      // Review mode: move bad photos to Review folder
      const reviewDir = path.join(path.dirname(photoPaths[0]), 'Review', 'Bad Photos');
      
      try {
        await fs.mkdir(reviewDir, { recursive: true });
      } catch (err) {
        return res.status(500).json({ error: `Cannot create review directory: ${err.message}` });
      }

      const moved = [];
      const skipped = [];
      const errors = [];

      for (const result of results) {
        if (result.error || result.recommendation.action === 'keep') {
          skipped.push(result.filename);
          continue;
        }

        try {
          const newPath = path.join(reviewDir, result.filename);
          await fs.rename(result.path, newPath);
          moved.push({
            original: result.filename,
            reason: result.recommendation.reason,
            issues: result.issues.map(i => i.type)
          });
        } catch (err) {
          errors.push({ photo: result.filename, error: err.message });
        }
      }

      res.json({
        success: true,
        mode: 'review',
        stats: {
          moved: moved.length,
          skipped: skipped.length,
          errors: errors.length
        },
        moved,
        reviewFolder: reviewDir,
        summary
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bad-photos/detection-methods', (req, res) => {
  res.json({
    methods: [
      {
        number: 1,
        name: 'Blurry/Out-of-Focus',
        description: 'Detects blurry images using Laplacian variance',
        detection: 'Measures edge sharpness - low variance = blurry'
      },
      {
        number: 2,
        name: 'Closed Eyes/Blinking',
        description: 'Detects closed or blinking eyes in photos',
        detection: 'Analyzes upper face region contrast and entropy'
      },
      {
        number: 3,
        name: 'Weird/Distorted Faces',
        description: 'Detects facial distortions or blocking',
        detection: 'Checks color distribution uniformity'
      },
      {
        number: 4,
        name: 'Accidental Photos',
        description: 'Detects pocket/floor/bag shots and dark images',
        detection: 'Very low entropy + dark brightness + no color'
      },
      {
        number: 5,
        name: 'Low Resolution/Pixelated',
        description: 'Detects heavily cropped or low-resolution images',
        detection: 'Checks dimensions, aspect ratio, and megapixels'
      },
      {
        number: 6,
        name: 'Duplicates',
        description: 'Detects duplicate or near-duplicate photos',
        detection: 'Perceptual hashing (8x8 average hash)'
      }
    ],
    modes: [
      {
        name: 'Auto-Delete',
        description: 'Automatically deletes high-confidence bad photos',
        riskLevel: 'High - permanent deletion',
        recommended: false
      },
      {
        name: 'Review',
        description: 'Moves flagged photos to Review/Bad Photos folder for user confirmation',
        riskLevel: 'Low - photos can be restored',
        recommended: true
      }
    ]
  });
});

// Duplicate Detection Routes
app.post('/api/duplicates/analyze', async (req, res) => {
  try {
    const { photoPaths } = req.body;
    
    if (!photoPaths || !Array.isArray(photoPaths) || photoPaths.length === 0) {
      return res.status(400).json({ error: 'photoPaths array is required' });
    }

    console.log(`Starting duplicate analysis for ${photoPaths.length} photos...`);
    const analysis = await duplicateDetectionService.analyzeDuplicates(photoPaths);
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing duplicates:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/duplicates/cleanup', async (req, res) => {
  try {
    const { duplicateGroups, mode } = req.body;
    
    if (!duplicateGroups || !Array.isArray(duplicateGroups)) {
      return res.status(400).json({ error: 'duplicateGroups array is required' });
    }
    
    if (!mode || !['review', 'auto-delete'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be "review" or "auto-delete"' });
    }

    console.log(`Starting duplicate cleanup in ${mode} mode...`);
    
    // Flatten duplicate groups to get all duplicate paths
    const allDuplicates = [];
    for (const group of duplicateGroups) {
      if (group.duplicates && Array.isArray(group.duplicates)) {
        allDuplicates.push(...group.duplicates.map(dup => dup.path));
      }
    }

    const result = await duplicateDetectionService.removeDisplayingDuplicates(
      allDuplicates,
      mode === 'review'
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/duplicates/detection-methods', (req, res) => {
  res.json({
    methods: [
      {
        level: 1,
        name: 'Exact Duplicates',
        description: 'Identifies identical files using SHA-256 hashing',
        detection: 'Files with same byte content and hash',
        confidence: '100%',
        accuracy: 'Perfect - cryptographic hash'
      },
      {
        level: 2,
        name: 'Near-Duplicates',
        description: 'Finds visually similar photos using perceptual hashing',
        detection: 'Perceptual hashes with Hamming distance < 5 bits',
        confidence: '85-95%',
        accuracy: 'High - catches resized/recompressed copies'
      },
      {
        level: 3,
        name: 'Burst-Mode/Similar',
        description: 'Detects rapid-fire burst photos and visually similar images',
        detection: 'SSIM > 0.85 similarity with clustering algorithm',
        confidence: '80-90%',
        accuracy: 'Very good - catches subtle variations'
      }
    ],
    qualityMetrics: {
      'Resolution (40%)': 'Image dimensions in megapixels',
      'Sharpness (40%)': 'Laplacian variance (blur detection)',
      'Aspect Ratio (20%)': 'Standard 16:9, 4:3, 1:1 preferences'
    },
    modes: [
      {
        name: 'Review',
        description: 'Moves duplicates to Review/Duplicates folder for user inspection',
        riskLevel: 'Low - photos can be restored',
        recommended: true
      },
      {
        name: 'Auto-Delete',
        description: 'Permanently removes duplicate photos, keeping the highest quality version',
        riskLevel: 'High - permanent deletion',
        recommended: false
      }
    ]
  });
});

// ==================== AI Vision API Endpoints ====================

// AI: Analyze image with vision API
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const analysis = await aiVisionService.analyzeImage(imagePath);
    res.json(analysis);
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Detect labels in image
app.post('/api/ai/detect-labels', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const labels = await aiVisionService.detectLabels(imagePath);
    res.json(labels);
  } catch (error) {
    console.error('Label detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Detect faces in image
app.post('/api/ai/detect-faces', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const faces = await aiVisionService.detectFaces(imagePath);
    res.json(faces);
  } catch (error) {
    console.error('Face detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Detect text in image
app.post('/api/ai/detect-text', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const text = await aiVisionService.detectText(imagePath);
    res.json(text);
  } catch (error) {
    console.error('Text detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Detect objects in image
app.post('/api/ai/detect-objects', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const objects = await aiVisionService.detectObjects(imagePath);
    res.json(objects);
  } catch (error) {
    console.error('Object detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Assess image quality
app.post('/api/ai/assess-quality', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const quality = await aiVisionService.assessQuality(imagePath);
    res.json(quality);
  } catch (error) {
    console.error('Quality assessment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Categorize photo
app.post('/api/ai/categorize', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const categorization = await aiVisionService.categorizePhoto(imagePath);
    res.json(categorization);
  } catch (error) {
    console.error('Categorization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Generate smart filename
app.post('/api/ai/generate-filename', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const filename = await aiVisionService.generateSmartFilename(imagePath);
    res.json(filename);
  } catch (error) {
    console.error('Filename generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI-Enhanced Bad Photo Detection ====================

// AI: Enhanced bad photo analysis
app.post('/api/ai/bad-photos/analyze', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const analysis = await aiEnhancedBadPhotoDetection.analyzePhotoWithAI(imagePath);
    res.json(analysis);
  } catch (error) {
    console.error('AI bad photo analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Batch analyze bad photos
app.post('/api/ai/bad-photos/batch-analyze', async (req, res) => {
  try {
    const { imagePaths } = req.body;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({ error: 'imagePaths array is required' });
    }

    const results = await aiEnhancedBadPhotoDetection.analyzeBatchWithAI(imagePaths);
    res.json({
      total: imagePaths.length,
      analyzed: results.length,
      results
    });
  } catch (error) {
    console.error('Batch bad photo analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Get detailed recommendations
app.post('/api/ai/bad-photos/recommendations', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const recommendations = await aiEnhancedBadPhotoDetection.getDetailedRecommendations(imagePath);
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Filter bad photos
app.post('/api/ai/bad-photos/filter', async (req, res) => {
  try {
    const { imagePaths, severityThreshold = 'medium' } = req.body;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({ error: 'imagePaths array is required' });
    }

    const results = await aiEnhancedBadPhotoDetection.filterBadPhotosWithAI(imagePaths, severityThreshold);
    res.json(results);
  } catch (error) {
    console.error('Bad photo filtering error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI Quality Detection ====================

// AI: Analyze quality
app.post('/api/ai/quality/analyze', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const analysis = await aiQualityDetection.analyzeQuality(imagePath);
    res.json(analysis);
  } catch (error) {
    console.error('Quality analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Compare photos quality
app.post('/api/ai/quality/compare', async (req, res) => {
  try {
    const { imagePaths } = req.body;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({ error: 'imagePaths array is required' });
    }

    const comparison = await aiQualityDetection.comparePhotos(imagePaths);
    res.json(comparison);
  } catch (error) {
    console.error('Quality comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Batch quality analysis
app.post('/api/ai/quality/batch-analyze', async (req, res) => {
  try {
    const { imagePaths } = req.body;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({ error: 'imagePaths array is required' });
    }

    const results = await aiQualityDetection.batchAnalyzeQuality(imagePaths);
    res.json(results);
  } catch (error) {
    console.error('Batch quality analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Get enhancement suggestions
app.post('/api/ai/quality/enhancement-suggestions', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const suggestions = await aiQualityDetection.getEnhancementSuggestions(imagePath);
    res.json(suggestions);
  } catch (error) {
    console.error('Enhancement suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Select best photos
app.post('/api/ai/quality/select-best', async (req, res) => {
  try {
    const { imagePaths, keepCount = 1 } = req.body;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({ error: 'imagePaths array is required' });
    }

    const results = await aiQualityDetection.selectBestPhotos(imagePaths, keepCount);
    res.json(results);
  } catch (error) {
    console.error('Best photo selection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Analyze quality trend
app.post('/api/ai/quality/trend-analysis', async (req, res) => {
  try {
    const { imagePaths } = req.body;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({ error: 'imagePaths array is required' });
    }

    const trends = await aiQualityDetection.analyzeTrend(imagePaths);
    res.json(trends);
  } catch (error) {
    console.error('Trend analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Health check and status
app.get('/api/ai/status', (req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: process.env.AI_ENABLED !== 'false',
    features: {
      visionAnalysis: true,
      faceDetection: true,
      objectDetection: true,
      textDetection: true,
      qualityAssessment: true,
      photoCategoriztion: true,
      smartNaming: true,
      badPhotoDetection: true,
      batchProcessing: true,
      enhancementSuggestions: true,
      photoComparison: true
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// BATCH PHOTO PROCESSING ENDPOINTS (NEW)
// ============================================

/**
 * MAIN ENTRY POINT: Process all photos in directory
 * - Recursively scans all folders
 * - Detects bad quality photos using AI + traditional methods
 * - Moves bad photos to separate folder
 * - Auto-enhances good photos
 * 
 * NO COMPROMISE: Uses multiple detection methods for accuracy
 */
app.post('/api/batch/process-all', async (req, res) => {
  try {
    console.log('📥 Batch process request received:', {
      hasRootDirectory: !!req.body.rootDirectory,
      useAI: req.body.useAI,
      hasApiKey: !!req.body.apiKey
    });

    const {
      rootDirectory,
      useAI = true,
      autoEnhance = true,
      organizeByLocation = true,
      badPhotoFolder = 'Bad_Photos',
      enhancedFolder = 'Enhanced_Photos',
      locationFolder = 'By_Location',
      aiQualityThreshold = 50,
      apiKey  // Accept optional API key from frontend
    } = req.body;

    if (!rootDirectory || typeof rootDirectory !== 'string' || !rootDirectory.trim()) {
      console.error('❌ Invalid rootDirectory:', rootDirectory);
      return res.status(400).json({ error: 'rootDirectory is required and must be a valid path' });
    }

    // Check if directory exists
    try {
      const stats = await fs.stat(rootDirectory);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: 'rootDirectory must be a valid directory path' });
      }
    } catch (statError) {
      console.error('❌ Directory stat error:', statError.message);
      return res.status(400).json({ error: `Cannot access directory: ${statError.message}` });
    }

    console.log(`\n🚀 Starting batch processing from API...`);
    console.log(`   📁 Directory: ${rootDirectory}`);
    console.log(`   🧠 Use AI: ${useAI}`);
    console.log(`   ✨ Auto-enhance: ${autoEnhance}`);
    console.log(`   🌍 Organize by location: ${organizeByLocation}`);
    console.log(`   🔑 API Key provided: ${apiKey ? 'Yes' : 'No'}`);

    // Create progress callback
    const onProgress = (progressData) => {
      broadcastProgress(progressData);
      sessionData.currentScan = progressData;
    };

    // Process all photos
    let result;
    try {
      result = await batchPhotoProcessingService.processAllPhotos(rootDirectory, {
        useAI,
        autoEnhance,
        organizeByLocation,
        badPhotoFolder,
        enhancedFolder,
        locationFolder,
        onProgress,
        aiQualityThreshold,
        apiKey  // Pass API key to batch processing service
      });
    } catch (processError) {
      console.error('❌ Processing error:', processError);
      throw processError;
    }

    if (!result) {
      console.error('❌ No result returned from batch processing service');
      return res.status(500).json({ error: 'Processing failed: no result returned', success: false });
    }

    console.log(`✅ Batch processing completed with status: ${result.status}`);
    res.json({
      success: result.status === 'SUCCESS',
      result: result
    });

  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Unknown error occurred during batch processing',
      stack: error.stack,
      success: false
    });
  }
});

/**
 * Get batch processing status
 */
app.get('/api/batch/status', (req, res) => {
  const status = batchPhotoProcessingService.getStatus();
  res.json({
    status: 'ok',
    ...status
  });
});

/**
 * Reset batch processing service (clear caches)
 */
app.post('/api/batch/reset', (req, res) => {
  batchPhotoProcessingService.reset();
  res.json({
    status: 'ok',
    message: 'Batch processing service reset'
  });
});

/**
 * Quick scan: Just analyze photos without making changes
 */
app.post('/api/batch/analyze-only', async (req, res) => {
  try {
    console.log('📥 Analysis request received:', { hasRootDirectory: !!req.body.rootDirectory });

    const { rootDirectory, useAI = true, aiQualityThreshold = 50, apiKey } = req.body;

    if (!rootDirectory || typeof rootDirectory !== 'string' || !rootDirectory.trim()) {
      console.error('❌ Invalid rootDirectory:', rootDirectory);
      return res.status(400).json({ error: 'rootDirectory is required and must be a valid path' });
    }

    // If API key provided from frontend, temporarily set it (override .env)
    if (apiKey && apiKey.trim()) {
      process.env.OPENAI_API_KEY = apiKey;
      console.log(`✅ Using API key provided from frontend`);
    }

    const scannerService = new ScannerService();
    const badPhotoDetectionService = new BadPhotoDetectionService();
    
    console.log(`\n📊 Starting analysis-only scan of: ${rootDirectory}`);

    let scanResult;
    try {
      scanResult = await scannerService.scanDirectory(rootDirectory);
    } catch (scanError) {
      console.error('❌ Scan error:', scanError.message);
      return res.status(400).json({ error: `Scan failed: ${scanError.message}` });
    }

    if (!scanResult || !scanResult.success) {
      return res.status(400).json({ error: scanResult?.error || 'Unknown scan error' });
    }

    const analysis = {
      totalPhotos: scanResult.photos.length,
      photosByQuality: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      },
      details: []
    };

    for (const photo of scanResult.photos) {
      try {
        const detection = await badPhotoDetectionService.analyzePhoto(photo.path);
        const score = Math.max(0, Math.min(100, 85 - (detection.issues?.length || 0) * 10));

        let quality;
        if (score >= 80) quality = 'excellent';
        else if (score >= 60) quality = 'good';
        else if (score >= 40) quality = 'fair';
        else quality = 'poor';

        analysis.photosByQuality[quality]++;
        analysis.details.push({
          path: photo.path,
          filename: path.basename(photo.path),
          score: score.toFixed(2),
          quality: quality,
          issues: detection.issues || []
        });
      } catch (error) {
        console.warn(`Error analyzing ${photo.path}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Photo Organizer API running on http://localhost:${PORT}`);
  console.log(`CORS enabled for ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`\n💡 Test Tip: If scanned photos have no GPS data, use /api/test/inject-gps to add mock location data`);
  console.log(`\n📸 Enhancement Features:`);
  console.log(`   - Auto-enhance: POST /api/enhance/auto`);
  console.log(`   - Custom enhance: POST /api/enhance/custom`);
  console.log(`   - Auto-crop: POST /api/enhance/crop`);
  console.log(`   - Straighten: POST /api/enhance/straighten`);
  console.log(`   - Detect type: POST /api/enhance/detect-type`);
  console.log(`\n🧹 Bad Photo Detection Features:`);
  console.log(`   - Analyze bad photos: POST /api/bad-photos/analyze`);
  console.log(`   - Cleanup (review/auto): POST /api/bad-photos/cleanup`);
  console.log(`   - Detection methods: GET /api/bad-photos/detection-methods`);
  console.log(`\n🔄 Duplicate Detection Features:`);
  console.log(`   - Analyze duplicates: POST /api/duplicates/analyze`);
  console.log(`   - Cleanup (review/auto): POST /api/duplicates/cleanup`);
  console.log(`   - Detection methods: GET /api/duplicates/detection-methods`);
  console.log(`\n🤖 AI Vision API Features:`);
  console.log(`   - Full analysis: POST /api/ai/analyze`);
  console.log(`   - Detect labels: POST /api/ai/detect-labels`);
  console.log(`   - Detect faces: POST /api/ai/detect-faces`);
  console.log(`   - Detect text: POST /api/ai/detect-text`);
  console.log(`   - Detect objects: POST /api/ai/detect-objects`);
  console.log(`   - Assess quality: POST /api/ai/assess-quality`);
  console.log(`   - Categorize: POST /api/ai/categorize`);
  console.log(`   - Generate filename: POST /api/ai/generate-filename`);
  console.log(`   - AI bad photo analysis: POST /api/ai/bad-photos/analyze`);
  console.log(`   - AI quality analysis: POST /api/ai/quality/analyze`);
  console.log(`   - AI status: GET /api/ai/status`);
  console.log(`\n🚀 BATCH PHOTO PROCESSING (NEW - AUTOMATED):`);
  console.log(`   ⭐ MAIN: Process all photos: POST /api/batch/process-all`);
  console.log(`      Parameters:`);
  console.log(`        - rootDirectory (required): Path to scan`);
  console.log(`        - useAI (default: true): Use AI quality detection`);
  console.log(`        - autoEnhance (default: true): Auto-enhance good photos`);
  console.log(`        - organizeByLocation (default: true): Organize by country/city 🌍`);
  console.log(`        - badPhotoFolder (default: 'Bad_Photos'): Folder for bad photos`);
  console.log(`        - enhancedFolder (default: 'Enhanced_Photos'): Folder for enhanced photos`);
  console.log(`        - locationFolder (default: 'By_Location'): Base folder for location organization`);
  console.log(`        - aiQualityThreshold (default: 50): Quality score threshold (0-100)`);
  console.log(`   - Get status: GET /api/batch/status`);
  console.log(`   - Analysis only (no changes): POST /api/batch/analyze-only`);
  console.log(`   - Reset cache: POST /api/batch/reset`);
});

