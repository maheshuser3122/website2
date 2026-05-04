import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

/**
 * AI Vision Service - OpenAI Implementation
 * Uses GPT-4 Vision for intelligent photo analysis
 */
export class AIVisionService {
  constructor() {
    this.cache = new Map();
    this.model = 'gpt-4-turbo'; // Always use current model, not from env
    this._initializeClient();
  }

  /**
   * Initialize OpenAI client with current API key
   */
  _initializeClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log(`[AIVisionService._initializeClient] Starting initialization...`);
    console.log(`[AIVisionService._initializeClient] API Key exists: ${!!apiKey}`);
    console.log(`[AIVisionService._initializeClient] API Key length: ${apiKey ? apiKey.length : 0}`);
    console.log(`[AIVisionService._initializeClient] API Key starts with: ${apiKey ? apiKey.substring(0, 10) : 'N/A'}...`);
    
    // Check if API key is valid (not empty, not placeholder)
    if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey.trim() === '') {
      console.warn('⚠️ OpenAI API key not configured or invalid');
      console.log(`[AIVisionService._initializeClient] Setting client = null, enabled = false`);
      this.client = null;  // Mark as unavailable
      this.enabled = false;
    } else {
      try {
        console.log(`[AIVisionService._initializeClient] Creating new OpenAI client...`);
        this.client = new OpenAI({
          apiKey: apiKey
        });
        this.enabled = true;
        console.log(`✅ OpenAI client initialized with API key (using model: ${this.model})`);
        console.log(`[AIVisionService._initializeClient] Set enabled = true, client created`);
      } catch (error) {
        console.warn(`⚠️ Failed to initialize OpenAI client: ${error.message}`);
        console.log(`[AIVisionService._initializeClient] Client creation failed, setting null`);
        this.client = null;
        this.enabled = false;
      }
    }
  }

  /**
   * Reinitialize client with a new API key
   * Call this when API key is provided from frontend
   */
  setApiKey(apiKey) {
    console.log(`\n[AIVisionService.setApiKey] Called with API key`);
    console.log(`[AIVisionService.setApiKey] API Key exists: ${!!apiKey}`);
    console.log(`[AIVisionService.setApiKey] API Key length: ${apiKey ? apiKey.length : 0}`);
    console.log(`[AIVisionService.setApiKey] API Key starts with: ${apiKey ? apiKey.substring(0, 10) : 'N/A'}...`);
    
    if (apiKey && apiKey.trim() && apiKey !== 'your-openai-api-key-here') {
      console.log(`[AIVisionService.setApiKey] API key is valid, proceeding with reinitialization`);
      process.env.OPENAI_API_KEY = apiKey;
      console.log(`[AIVisionService.setApiKey] Set process.env.OPENAI_API_KEY`);
      this._initializeClient();
      console.log(`[AIVisionService.setApiKey] Reinitialization complete`);
      console.log(`[AIVisionService.setApiKey] this.enabled = ${this.enabled}`);
      console.log(`[AIVisionService.setApiKey] this.client exists = ${!!this.client}\n`);
      return true;
    }
    console.log(`[AIVisionService.setApiKey] API key validation failed, returning false\n`);
    return false;
  }

  /**
   * Helper: Convert image file to base64
   */
  async _getBase64Image(imagePath) {
    const imageContent = await fs.readFile(imagePath);
    return imageContent.toString('base64');
  }

  /**
   * Helper: Call OpenAI Vision API with prompt
   */
  async _callVision(base64Image, mimeType, prompt) {
    console.log(`\n[Vision API._callVision] Called`);
    console.log(`[Vision API._callVision] this.client exists: ${!!this.client}`);
    console.log(`[Vision API._callVision] this.enabled: ${this.enabled}`);
    console.log(`[Vision API._callVision] this.model: ${this.model}`);
    
    if (!this.client || !this.enabled) {
      const errorMsg = 'OpenAI client is not configured. Please set OPENAI_API_KEY in .env';
      console.error(`[Vision API._callVision] ERROR: ${errorMsg}`);
      console.error(`[Vision API._callVision] this.client: ${this.client}`);
      console.error(`[Vision API._callVision] this.enabled: ${this.enabled}`);
      throw new Error(errorMsg);
    }

    try {
      // Debug: log the model being used
      console.log(`[Vision API._callVision] Using model: ${this.model}`);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      });

      console.log(`[Vision API._callVision] Success`);
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(`[Vision API._callVision] API call error: ${error.message}`);
      throw new Error(`Vision API call failed: ${error.message}`);
    }
  }

  /**
   * Detect labels in an image (what's in the photo)
   * Returns: array of labels with confidence scores
   */
  async detectLabels(imagePath) {
    try {
      const cacheKey = `labels-${imagePath}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const base64Image = await this._getBase64Image(imagePath);
      
      const prompt = `Analyze this image and provide a JSON response with an array of labels. Each label should have:
      - "description": what the object/concept is
      - "confidence": a confidence score from 0-100
      - "score": decimal confidence from 0-1
      
      Return ONLY valid JSON with format: {"labels": [{"description": "...", "confidence": "...", "score": ...}]}
      Provide up to 20 labels.`;

      const response = await this._callVision(base64Image, 'image/jpeg', prompt);
      
      let labels = [];
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          labels = parsed.labels || [];
        }
      } catch (e) {
        console.warn('Failed to parse labels JSON:', e);
        labels = [];
      }

      const result = {
        labels: labels.slice(0, 20),
        timestamp: new Date().toISOString()
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Label detection error:', error);
      throw new Error(`Label detection failed: ${error.message}`);
    }
  }

  /**
   * Detect faces in an image
   * Returns: face count, locations, emotions, landmarks
   */
  async detectFaces(imagePath) {
    try {
      const cacheKey = `faces-${imagePath}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const base64Image = await this._getBase64Image(imagePath);
      
      const prompt = `Analyze this image for faces and emotions. Return a JSON response with:
      - "faceCount": number of faces detected
      - "faces": array of face objects with:
        - "confidence": detection confidence 0-100
        - "landmarks": number of facial landmarks detected
        - "rollAngle", "panAngle", "tiltAngle": head angles
        - "joyLikelihood", "sorrowLikelihood", "angerLikelihood", "surpriseLikelihood": emotion likelihoods (UNKNOWN/VERY_UNLIKELY/UNLIKELY/POSSIBLE/LIKELY/VERY_LIKELY)
        - "exposedLikelihood", "blurredLikelihood": image quality indicators
      
      Return ONLY valid JSON with format: {"faceCount": 0, "faces": [...]}`;

      const response = await this._callVision(base64Image, 'image/jpeg', prompt);
      
      let parsedData = { faceCount: 0, faces: [] };
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Failed to parse faces JSON:', e);
      }

      const result = {
        faceCount: parsedData.faceCount || 0,
        faces: parsedData.faces || [],
        timestamp: new Date().toISOString()
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Face detection error:', error);
      throw new Error(`Face detection failed: ${error.message}`);
    }
  }

  /**
   * Detect text in an image (OCR)
   * Returns: detected text with confidence
   */
  async detectText(imagePath) {
    try {
      const cacheKey = `text-${imagePath}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const base64Image = await this._getBase64Image(imagePath);
      
      const prompt = `Extract all text from this image. Return a JSON response with:
      - "fullText": all text concatenated
      - "textBlocks": array of text blocks with {"text": "...", "confidence": "..."}
      - "textDetected": boolean indicating if text was found
      
      Return ONLY valid JSON with format: {"fullText": "...", "textBlocks": [...], "textDetected": true/false}`;

      const response = await this._callVision(base64Image, 'image/jpeg', prompt);
      
      let parsedData = { fullText: '', textBlocks: [], textDetected: false };
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Failed to parse text JSON:', e);
      }

      const result = {
        fullText: parsedData.fullText || '',
        textBlocks: parsedData.textBlocks || [],
        textDetected: parsedData.textDetected || false,
        timestamp: new Date().toISOString()
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Text detection error:', error);
      throw new Error(`Text detection failed: ${error.message}`);
    }
  }

  /**
   * Detect objects and their locations
   * Returns: objects found with bounding boxes
   */
  async detectObjects(imagePath) {
    try {
      const cacheKey = `objects-${imagePath}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const base64Image = await this._getBase64Image(imagePath);
      
      const prompt = `Identify all objects in this image. Return a JSON response with:
      - "objectCount": total number of objects
      - "objects": array with {"name": "object name", "confidence": 0-100, "boundingPoly": "general location"}
      
      Return ONLY valid JSON with format: {"objectCount": 0, "objects": [...]}`;

      const response = await this._callVision(base64Image, 'image/jpeg', prompt);
      
      let parsedData = { objectCount: 0, objects: [] };
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Failed to parse objects JSON:', e);
      }

      const result = {
        objectCount: parsedData.objectCount || 0,
        objects: parsedData.objects || [],
        timestamp: new Date().toISOString()
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Object detection error:', error);
      throw new Error(`Object detection failed: ${error.message}`);
    }
  }

  /**
   * Comprehensive image analysis (all features)
   * Returns: complete analysis with labels, faces, text, objects
   */
  async analyzeImage(imagePath) {
    try {
      const cacheKey = `analysis-${imagePath}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const [labels, faces, text, objects] = await Promise.all([
        this.detectLabels(imagePath),
        this.detectFaces(imagePath),
        this.detectText(imagePath),
        this.detectObjects(imagePath)
      ]);

      const response = {
        imagePath,
        filename: path.basename(imagePath),
        timestamp: new Date().toISOString(),
        labels,
        faces,
        text,
        objects,
        summary: {
          hasFaces: faces.faceCount > 0,
          faceCount: faces.faceCount,
          hasText: text.textDetected,
          objectCount: objects.objectCount,
          topLabels: labels.labels.slice(0, 5).map(l => l.description)
        }
      };

      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw new Error(`Comprehensive image analysis failed: ${error.message}`);
    }
  }

  /**
   * Quality assessment using AI
   * Returns: quality score and recommendations
   */
  async assessQuality(imagePath) {
    try {
      const analysis = await this.analyzeImage(imagePath);
      
      let qualityScore = 50; // base score
      const issues = [];
      const recommendations = [];

      // Face blur detection
      if (analysis.faces.faceCount > 0) {
        const blurredFaces = analysis.faces.faces.filter(
          f => f.blurredLikelihood === 'VERY_LIKELY' || f.blurredLikelihood === 'LIKELY'
        );
        if (blurredFaces.length > 0) {
          qualityScore -= 15;
          issues.push('Blurred faces detected');
          recommendations.push('Use flash or better lighting for portraits');
        } else {
          qualityScore += 20;
        }
      }

      // Exposure assessment
      if (analysis.faces.faceCount > 0) {
        const exposedFaces = analysis.faces.faces.filter(
          f => f.exposedLikelihood === 'VERY_LIKELY'
        );
        if (exposedFaces.length > 0) {
          qualityScore -= 10;
          issues.push('Overexposed faces');
          recommendations.push('Reduce exposure or find better lighting');
        }
      }

      // Composition (based on objects detected)
      if (analysis.objects.objectCount > 5) {
        qualityScore += 10;
        recommendations.push('Good composition with multiple subjects');
      }

      // Label diversity (interesting content)
      if (analysis.labels.labels.length > 10) {
        qualityScore += 15;
      }

      qualityScore = Math.min(100, Math.max(0, qualityScore));

      return {
        imagePath,
        qualityScore: qualityScore.toFixed(2),
        rating: this._getQualityRating(qualityScore),
        issues,
        recommendations,
        aiAnalysis: analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Quality assessment error:', error);
      throw new Error(`Quality assessment failed: ${error.message}`);
    }
  }

  /**
   * Photo categorization based on content
   * Returns: suggested categories
   */
  async categorizePhoto(imagePath) {
    try {
      const analysis = await this.analyzeImage(imagePath);
      const categories = [];

      // Face-based categorization
      if (analysis.faces.faceCount === 1) {
        categories.push('Portrait');
      } else if (analysis.faces.faceCount > 1) {
        categories.push('Group Photo');
        categories.push('Portrait');
      }

      // Content-based categorization
      const labels = analysis.labels.labels.map(l => l.description.toLowerCase());
      
      if (labels.some(l => ['outdoor', 'landscape', 'nature', 'mountain', 'sky', 'tree'].includes(l))) {
        categories.push('Landscape');
      }
      if (labels.some(l => ['food', 'meal', 'dish', 'restaurant'].includes(l))) {
        categories.push('Food');
      }
      if (labels.some(l => ['animal', 'pet', 'dog', 'cat', 'bird'].includes(l))) {
        categories.push('Animals');
      }
      if (labels.some(l => ['building', 'architecture', 'house', 'indoor'].includes(l))) {
        categories.push('Architecture');
      }
      if (labels.some(l => ['document', 'text', 'screenshot'].includes(l))) {
        categories.push('Document');
      }

      return {
        imagePath,
        categories: [...new Set(categories)], // Remove duplicates
        confidence: analysis.labels.labels[0]?.score || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Photo categorization error:', error);
      throw new Error(`Photo categorization failed: ${error.message}`);
    }
  }

  /**
   * Generate smart filename based on content
   * Returns: suggested filename
   */
  async generateSmartFilename(imagePath) {
    try {
      const [categorization, analysis] = await Promise.all([
        this.categorizePhoto(imagePath),
        this.analyzeImage(imagePath)
      ]);

      const timestamp = new Date().toISOString().slice(0, 10);
      const topLabel = analysis.labels.labels[0]?.description || 'Photo';
      const categories = categorization.categories.slice(0, 2).join('-');
      
      let filename = `${timestamp}_${categories || topLabel}`;
      
      if (analysis.faces.faceCount > 0) {
        filename += `_${analysis.faces.faceCount}faces`;
      }

      return {
        imagePath,
        suggestedFilename: filename.replace(/\s+/g, '_').toLowerCase(),
        originalFilename: path.basename(imagePath),
        reasoning: `Based on ${analysis.labels.labels.slice(0, 3).map(l => l.description).join(', ')}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Filename generation error:', error);
      throw new Error(`Filename generation failed: ${error.message}`);
    }
  }

  /**
   * Batch analyze multiple images
   * Returns: array of analyses
   */
  async analyzeBatch(imagePaths) {
    const results = [];
    for (const imagePath of imagePaths) {
      try {
        const analysis = await this.analyzeImage(imagePath);
        results.push({
          success: true,
          imagePath,
          analysis
        });
      } catch (error) {
        results.push({
          success: false,
          imagePath,
          error: error.message
        });
      }
    }
    return results;
  }

  /**
   * Clear cache to free memory
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Helper: Get quality rating from score
   */
  _getQualityRating(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }
}

export default AIVisionService;
