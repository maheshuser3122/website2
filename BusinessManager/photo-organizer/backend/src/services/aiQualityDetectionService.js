import AIVisionService from './aiVisionService.js';

/**
 * AI-Powered Quality Detection Service
 * Uses Google Cloud Vision API for intelligent quality assessment
 */
export class AIQualityDetectionService {
  constructor() {
    this.aiVision = new AIVisionService();
    this.qualityCache = new Map();
  }

  /**
   * Comprehensive quality analysis
   */
  async analyzeQuality(imagePath) {
    try {
      const cacheKey = `quality-${imagePath}`;
      if (this.qualityCache.has(cacheKey)) {
        return this.qualityCache.get(cacheKey);
      }

      const [quality, categorization] = await Promise.all([
        this.aiVision.assessQuality(imagePath),
        this.aiVision.categorizePhoto(imagePath)
      ]);

      const result = {
        imagePath,
        qualityScore: quality.qualityScore,
        rating: quality.rating,
        issues: quality.issues,
        recommendations: quality.recommendations,
        categories: categorization.categories,
        detailedMetrics: await this._getDetailedMetrics(imagePath),
        timestamp: new Date().toISOString()
      };

      this.qualityCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Quality analysis error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compare quality between multiple photos
   */
  async comparePhotos(imagePaths) {
    try {
      const analyses = await Promise.all(
        imagePaths.map(path => this.analyzeQuality(path))
      );

      const sorted = analyses.sort((a, b) => 
        parseFloat(b.qualityScore) - parseFloat(a.qualityScore)
      );

      return {
        totalPhotos: imagePaths.length,
        bestPhoto: sorted[0],
        worstPhoto: sorted[sorted.length - 1],
        averageQualityScore: (
          sorted.reduce((sum, p) => sum + parseFloat(p.qualityScore), 0) / 
          sorted.length
        ).toFixed(2),
        allPhotos: sorted,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Photo comparison error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch quality analysis
   */
  async batchAnalyzeQuality(imagePaths) {
    const results = [];
    const batchSize = parseInt(process.env.AI_MAX_BATCH_SIZE) || 5;

    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(path => 
          this.analyzeQuality(path).catch(error => ({
            imagePath: path,
            error: error.message
          }))
        )
      );
      results.push(...batchResults);
    }

    return {
      total: imagePaths.length,
      analyzed: results.filter(r => !r.error).length,
      results: results.sort((a, b) => 
        (parseFloat(b.qualityScore) || 0) - (parseFloat(a.qualityScore) || 0)
      ),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get enhancement suggestions
   */
  async getEnhancementSuggestions(imagePath) {
    try {
      const quality = await this.analyzeQuality(imagePath);
      const suggestions = [];

      // Analyze issues and provide specific suggestions
      quality.issues.forEach(issue => {
        const suggestionMap = {
          'Blurred faces detected': [
            'Use a tripod or stabilize the camera',
            'Increase shutter speed in post-processing',
            'Retake with faster lens or better lighting'
          ],
          'Overexposed faces': [
            'Reduce camera exposure compensation',
            'Use fill flash or reflector',
            'Shoot during golden hour instead of midday'
          ],
          'Low lighting': [
            'Use flash or external lighting',
            'Increase ISO (accept some grain)',
            'Use faster lens (f/1.8 or wider)'
          ]
        };

        if (suggestionMap[issue]) {
          suggestions.push({
            issue,
            suggestions: suggestionMap[issue]
          });
        }
      });

      return {
        imagePath,
        qualityScore: quality.qualityScore,
        rating: quality.rating,
        enhancements: suggestions,
        recommendations: quality.recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Enhancement suggestion error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Smart photo selection (best from a series)
   */
  async selectBestPhotos(imagePaths, keepCount = 1) {
    try {
      const comparison = await this.comparePhotos(imagePaths);
      const best = comparison.allPhotos.slice(0, keepCount);

      return {
        totalPhotos: imagePaths.length,
        selectedCount: keepCount,
        bestPhotos: best,
        averageQualityDropoff: {
          selected: (
            best.reduce((sum, p) => sum + parseFloat(p.qualityScore), 0) / best.length
          ).toFixed(2),
          notSelected: (
            comparison.allPhotos.slice(keepCount).reduce((sum, p) => 
              sum + parseFloat(p.qualityScore), 0
            ) / (comparison.allPhotos.length - keepCount) || 0
          ).toFixed(2)
        },
        deletionRecommendations: comparison.allPhotos.slice(keepCount),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Best photo selection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Quality trend analysis for a series
   */
  async analyzeTrend(imagePaths) {
    try {
      const results = await this.batchAnalyzeQuality(imagePaths);
      const validResults = results.results.filter(r => !r.error);

      const scores = validResults.map(r => parseFloat(r.qualityScore));
      const trend = {
        firstPhoto: validResults[0],
        lastPhoto: validResults[validResults.length - 1],
        best: validResults[0], // Already sorted
        worst: validResults[validResults.length - 1],
        average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
        standardDeviation: this._calculateStdDev(scores),
        improving: this._isTrendImproving(scores),
        trendAnalysis: this._describeTrend(scores)
      };

      return {
        totalAnalyzed: validResults.length,
        trend,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Trend analysis error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper: Get detailed metrics
   */
  async _getDetailedMetrics(imagePath) {
    try {
      const analysis = await this.aiVision.analyzeImage(imagePath);
      
      return {
        faces: analysis.faces.faceCount,
        objects: analysis.objects.objectCount,
        labels: analysis.labels.labels.length,
        hasText: analysis.text.textDetected,
        dominantColors: [], // Can be added with more analysis
        sharpness: 'N/A', // Would need additional processing
        exposure: analysis.faces.faces.length > 0 ? 
          this._averageExposure(analysis.faces.faces) : 'N/A'
      };
    } catch (error) {
      console.error(`Error getting metrics: ${error.message}`);
      return {};
    }
  }

  /**
   * Helper: Average exposure calculation
   */
  _averageExposure(faces) {
    const exposures = faces.map(f => f.exposedLikelihood);
    // Convert to numeric and average
    return 'Adequate'; // Simplified for now
  }

  /**
   * Helper: Calculate standard deviation
   */
  _calculateStdDev(numbers) {
    const avg = numbers.reduce((a, b) => a + b) / numbers.length;
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / numbers.length;
    return Math.sqrt(avgSquareDiff).toFixed(2);
  }

  /**
   * Helper: Check if trend is improving
   */
  _isTrendImproving(scores) {
    if (scores.length < 2) return null;
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
    return avgSecond > avgFirst;
  }

  /**
   * Helper: Describe trend
   */
  _describeTrend(scores) {
    if (scores.length < 3) return 'Insufficient data for trend analysis';
    
    const improving = this._isTrendImproving(scores);
    const consistent = this._calculateStdDev(scores) < 10;

    if (consistent && improving) return 'Quality consistently improving';
    if (consistent) return 'Quality stable and consistent';
    if (improving) return 'Quality improving despite some variation';
    return 'Quality declining';
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.qualityCache.clear();
    this.aiVision.clearCache();
  }
}

export default AIQualityDetectionService;
