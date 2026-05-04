import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import AIVisionService from './services/aiVisionService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize AI Vision Service
const aiVisionService = new AIVisionService();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 }
}));

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'OpenAI Vision API running',
    apiKeyConfigured: !!process.env.OPENAI_API_KEY
  });
});

/**
 * Full Image Analysis
 * Performs comprehensive analysis of an image
 */
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    const result = await aiVisionService.analyzeImage(
      imageUrl || imagePath || base64Image
    );

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: error.message || 'Analysis failed' 
    });
  }
});

/**
 * Detect Objects
 * Identifies objects in the image
 */
app.post('/api/ai/detect-objects', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    const result = await aiVisionService.detectObjects(
      imageUrl || imagePath || base64Image
    );

    res.json(result);
  } catch (error) {
    console.error('Object detection error:', error);
    res.status(500).json({ 
      error: error.message || 'Object detection failed' 
    });
  }
});

/**
 * Detect Faces
 * Identifies and describes faces in the image
 */
app.post('/api/ai/detect-faces', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    const result = await aiVisionService.detectFaces(
      imageUrl || imagePath || base64Image
    );

    res.json(result);
  } catch (error) {
    console.error('Face detection error:', error);
    res.status(500).json({ 
      error: error.message || 'Face detection failed' 
    });
  }
});

/**
 * Detect Text
 * Extracts and recognizes text in the image (OCR)
 */
app.post('/api/ai/detect-text', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    const result = await aiVisionService.detectText(
      imageUrl || imagePath || base64Image
    );

    res.json(result);
  } catch (error) {
    console.error('Text detection error:', error);
    res.status(500).json({ 
      error: error.message || 'Text detection failed' 
    });
  }
});

/**
 * Detect Labels
 * Identifies general labels/categories in the image
 */
app.post('/api/ai/detect-labels', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    const result = await aiVisionService.detectLabels(
      imageUrl || imagePath || base64Image
    );

    res.json(result);
  } catch (error) {
    console.error('Label detection error:', error);
    res.status(500).json({ 
      error: error.message || 'Label detection failed' 
    });
  }
});

/**
 * Assess Image Quality
 * Evaluates the quality of an image
 */
app.post('/api/ai/assess-quality', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    const result = await aiVisionService.assessQuality(
      imageUrl || imagePath || base64Image
    );

    res.json(result);
  } catch (error) {
    console.error('Quality assessment error:', error);
    res.status(500).json({ 
      error: error.message || 'Quality assessment failed' 
    });
  }
});

/**
 * Categorize Image
 * Categorizes the image into different categories
 */
app.post('/api/ai/categorize', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    const result = await aiVisionService.categorizePhoto(
      imageUrl || imagePath || base64Image
    );

    res.json(result);
  } catch (error) {
    console.error('Categorization error:', error);
    res.status(500).json({ 
      error: error.message || 'Categorization failed' 
    });
  }
});

/**
 * Generate Smart Filename
 * Generates an intelligent filename based on image content
 */
app.post('/api/ai/generate-filename', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    const result = await aiVisionService.generateSmartFilename(
      imageUrl || imagePath || base64Image
    );

    res.json(result);
  } catch (error) {
    console.error('Filename generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Filename generation failed' 
    });
  }
});

/**
 * Custom Vision Query
 * Send a custom prompt to analyze the image
 */
app.post('/api/ai/query', async (req, res) => {
  try {
    const { imageUrl, imagePath, base64Image, prompt } = req.body;

    if (!imageUrl && !imagePath && !base64Image) {
      return res.status(400).json({ 
        error: 'One of imageUrl, imagePath, or base64Image is required' 
      });
    }

    if (!prompt) {
      return res.status(400).json({ 
        error: 'prompt is required' 
      });
    }

    const result = await aiVisionService.queryImage(
      imageUrl || imagePath || base64Image,
      prompt
    );

    res.json(result);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      error: error.message || 'Query failed' 
    });
  }
});

/**
 * AI Status
 * Check the status of the AI service
 */
app.get('/api/ai/status', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4-vision';

  res.json({
    status: hasApiKey ? 'ready' : 'not-configured',
    apiKeyConfigured: hasApiKey,
    model: model,
    message: hasApiKey 
      ? `OpenAI API is configured with model: ${model}`
      : 'OpenAI API key not configured. Set OPENAI_API_KEY in .env'
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/ai/analyze - Full image analysis',
      'POST /api/ai/detect-objects - Detect objects',
      'POST /api/ai/detect-faces - Detect faces',
      'POST /api/ai/detect-text - Extract text (OCR)',
      'POST /api/ai/detect-labels - Identify labels',
      'POST /api/ai/assess-quality - Assess quality',
      'POST /api/ai/categorize - Categorize image',
      'POST /api/ai/generate-filename - Generate smart filename',
      'POST /api/ai/query - Custom prompt query',
      'GET /api/ai/status - AI service status',
      'GET /api/health - Health check'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 OpenAI Vision API Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`\n📷 Available Endpoints:\n`);
  
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const status = hasApiKey ? '✅' : '⚠️';
  
  console.log(`${status} API Key Status: ${hasApiKey ? 'Configured' : 'NOT SET - Set OPENAI_API_KEY in .env'}`);
  console.log(`📝 Model: ${process.env.OPENAI_MODEL || 'gpt-4-vision'}`);
  console.log(`\n🔗 API Endpoints:`);
  console.log(`   POST /api/ai/analyze - Full image analysis`);
  console.log(`   POST /api/ai/detect-objects - Detect objects in image`);
  console.log(`   POST /api/ai/detect-faces - Detect faces`);
  console.log(`   POST /api/ai/detect-text - Extract text (OCR)`);
  console.log(`   POST /api/ai/detect-labels - Identify labels/tags`);
  console.log(`   POST /api/ai/assess-quality - Assess image quality`);
  console.log(`   POST /api/ai/categorize - Categorize the image`);
  console.log(`   POST /api/ai/generate-filename - Generate smart filename`);
  console.log(`   POST /api/ai/query - Custom prompt query`);
  console.log(`   GET  /api/ai/status - Service status`);
  console.log(`   GET  /api/health - Health check\n`);
  
  console.log(`📊 CORS Enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}\n`);
});
