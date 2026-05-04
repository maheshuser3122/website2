import { BadPhotoDetectionService } from './badPhotoDetectionService.js';
import AIVisionService from './aiVisionService.js';
import fs from 'fs/promises';

/**
 * AI-Enhanced Bad Photo Detection Service
 * Combines traditional computer vision with AI-powered analysis
 * Provides more accurate detection and better recommendations
 */
export class AIEnhancedBadPhotoDetectionService extends BadPhotoDetectionService {
  constructor() {
    super();
    this.aiVision = new AIVisionService();
    this.aiEnabled = process.env.AI_ENABLED !== 'false';
  }

  /**
   * Analyze photo with AI enhancement
   * Combines traditional + AI methods for best results
   */
  async analyzePhotoWithAI(photoPath) {
    try {
      // Get traditional analysis
      const traditionalResults = await this.analyzePhoto(photoPath);

      if (!this.aiEnabled) {
        return traditionalResults;
      }

      // Get AI analysis
      const aiAnalysis = await this.aiVision.analyzeImage(photoPath);
      const qualityAssessment = await this.aiVision.assessQuality(photoPath);

      // Merge results
      const enhancedResults = {
        ...traditionalResults,
        aiAnalysis: {
          labels: aiAnalysis.labels,
          faces: aiAnalysis.faces,
          text: aiAnalysis.text,
          objects: aiAnalysis.objects,
          qualityScore: qualityAssessment.qualityScore,
          qualityRating: qualityAssessment.rating,
          qualityIssues: qualityAssessment.issues,
          recommendations: qualityAssessment.recommendations
        },
        enhancedIssues: this._mergeIssues(
          traditionalResults.issues,
          qualityAssessment.issues
        ),
        aiConfidence: this._calculateAIConfidence(
          traditionalResults,
          qualityAssessment
        )
      };

      // Update severity based on AI findings
      enhancedResults.severity = this._determineEnhancedSeverity(enhancedResults);

      return enhancedResults;
    } catch (error) {
      console.error(`AI-enhanced bad photo detection error: ${error.message}`);
      // Fallback to traditional analysis if AI fails
      return await this.analyzePhoto(photoPath);
    }
  }

  /**
   * Batch analyze photos with AI
   */
  async analyzeBatchWithAI(photoPaths) {
    const batchSize = parseInt(process.env.AI_MAX_BATCH_SIZE) || 5;
    const results = [];

    for (let i = 0; i < photoPaths.length; i += batchSize) {
      const batch = photoPaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(photoPath => 
          this.analyzePhotoWithAI(photoPath).catch(error => ({
            path: photoPath,
            error: error.message
          }))
        )
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get detailed AI-powered recommendations
   */
  async getDetailedRecommendations(photoPath) {
    try {
      if (!this.aiEnabled) {
        return null;
      }

      const analysis = await this.analyzePhotoWithAI(photoPath);
      const qualityAssessment = await this.aiVision.assessQuality(photoPath);

      const recommendations = {
        delete: [],
        edit: [],
        keep: [],
        organize: []
      };

      // Delete recommendations
      if (analysis.enhancedIssues.length > 2) {
        recommendations.delete.push('Multiple quality issues detected - consider deleting');
      }

      // Edit recommendations
      if (qualityAssessment.issues.includes('Blurred faces detected')) {
        recommendations.edit.push('Re-take photo with better lighting or steadier hand');
      }
      if (qualityAssessment.issues.includes('Overexposed')) {
        recommendations.edit.push('Reduce exposure or adjust brightness in post-processing');
      }

      // Keep recommendations
      if (analysis.aiAnalysis.qualityScore > 75) {
        recommendations.keep.push('High-quality photo - good for sharing/printing');
      }

      // Organization recommendations
      const categorization = await this.aiVision.categorizePhoto(photoPath);
      recommendations.organize.push(`Suggested category: ${categorization.categories.join(', ')}`);

      return {
        path: photoPath,
        recommendations,
        qualityScore: analysis.aiAnalysis.qualityScore,
        categories: categorization.categories,
        suggestedFilename: await this._getSuggestedFilename(photoPath),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Filter bad photos using AI
   * Returns: array of bad photos with severity levels
   */
  async filterBadPhotosWithAI(photoPaths, severityThreshold = 'medium') {
    try {
      const results = await this.analyzeBatchWithAI(photoPaths);

      const severityOrder = ['low', 'medium', 'high'];
      const thresholdLevel = severityOrder.indexOf(severityThreshold);

      const badPhotos = results.filter(result => {
        if (result.error) return false; // Skip errors
        const photoSeverityLevel = severityOrder.indexOf(result.severity);
        return photoSeverityLevel >= thresholdLevel;
      });

      return {
        total: photoPaths.length,
        analyzed: results.length,
        badPhotosFound: badPhotos.length,
        badPhotos: badPhotos.sort((a, b) => {
          const orderMap = { high: 0, medium: 1, low: 2 };
          return orderMap[a.severity] - orderMap[b.severity];
        }),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error filtering bad photos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper: Merge traditional and AI issues
   */
  _mergeIssues(traditionalIssues, aiIssues) {
    const merged = [...traditionalIssues];
    
    aiIssues.forEach(aiIssue => {
      const exists = merged.some(ti => 
        ti.type.toLowerCase() === aiIssue.toLowerCase()
      );
      if (!exists) {
        merged.push({
          type: aiIssue,
          source: 'AI',
          severity: 'medium'
        });
      }
    });

    return merged;
  }

  /**
   * Helper: Calculate combined confidence
   */
  _calculateAIConfidence(traditional, aiQuality) {
    const traditionalScore = 100 - (traditional.issues.length * 20);
    const aiScore = parseFloat(aiQuality.qualityScore);
    return ((traditionalScore + aiScore) / 2).toFixed(2);
  }

  /**
   * Helper: Determine enhanced severity
   */
  _determineEnhancedSeverity(results) {
    if (parseFloat(results.aiAnalysis.qualityScore) < 40) return 'high';
    if (results.aiAnalysis.qualityIssues.length > 2) return 'high';
    if (results.enhancedIssues.length > 2) return 'high';
    if (results.enhancedIssues.length > 1) return 'medium';
    return 'good';
  }

  /**
   * Helper: Get suggested filename
   */
  async _getSuggestedFilename(photoPath) {
    try {
      const result = await this.aiVision.generateSmartFilename(photoPath);
      return result.suggestedFilename;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear AI cache
   */
  clearAICache() {
    if (this.aiVision) {
      this.aiVision.clearCache();
    }
  }
}

export default AIEnhancedBadPhotoDetectionService;
