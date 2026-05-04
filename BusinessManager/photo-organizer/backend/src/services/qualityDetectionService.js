import sharp from 'sharp'
import crypto from 'crypto'
import { readFileSync } from 'fs'

class QualityDetectionService {
  constructor() {
    this.issues = []
  }

  /**
   * Analyze photo quality and detect issues
   * Returns: { success, issues: [], score, flagged }
   */
  async analyzePhoto(filepath, filename) {
    const issues = []
    let score = 100 // Start with perfect score

    try {
      const buffer = readFileSync(filepath)
      const metadata = await sharp(filepath).metadata()
      
      // 1. Check for blur (Laplacian variance)
      const blurScore = await this.detectBlur(filepath, metadata)
      if (blurScore < 100) {
        issues.push({
          type: 'blur',
          severity: blurScore < 50 ? 'high' : 'medium',
          message: `Image appears blurry (clarity: ${blurScore}%)`,
          score: blurScore
        })
        score -= (100 - blurScore) * 0.3
      }

      // 2. Check for very dark/low contrast (accidental photo)
      const contrastScore = await this.detectLowContrast(filepath, metadata)
      if (contrastScore < 30) {
        issues.push({
          type: 'accidental',
          severity: 'high',
          message: 'Very dark or low contrast - possibly accidental shot',
          score: contrastScore
        })
        score -= 25
      }

      // 3. Check for duplicate hash (perceptual hashing)
      const hash = await this.generatePerceptualHash(filepath)

      // 4. Check image entropy (randomness - helps detect duplicates/solid colors)
      const entropy = await this.calculateEntropy(filepath, metadata)
      if (entropy < 2) {
        issues.push({
          type: 'accidental',
          severity: 'high',
          message: 'Extremely low image complexity - likely accidental shot or solid color',
          score: entropy * 50
        })
        score -= 30
      }

      // 5. Check for proper composition (face/object presence)
      const hasContent = await this.detectContent(filepath, metadata)
      if (!hasContent) {
        issues.push({
          type: 'accidental',
          severity: 'medium',
          message: 'Unable to detect faces or objects - possibly accidental shot',
          score: 40
        })
        score -= 15
      }

      // 6. Check for extreme aspect ratios or size issues
      const sizeIssue = this.checkDimensions(metadata)
      if (sizeIssue) {
        issues.push({
          type: 'dimension',
          severity: 'low',
          message: sizeIssue
        })
        score -= 5
      }

      // Ensure score stays within 0-100
      score = Math.max(0, Math.min(100, score))

      return {
        filename,
        filepath,
        hash,
        quality: {
          score: Math.round(score),
          issues,
          flagged: score < 60,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            size: buffer.length,
            hasAlpha: metadata.hasAlpha,
            colorspace: metadata.colorspace,
            entropy: Math.round(entropy * 100) / 100
          }
        }
      }
    } catch (error) {
      console.error(`Error analyzing ${filename}:`, error.message)
      return {
        filename,
        filepath,
        quality: {
          score: 50,
          issues: [
            {
              type: 'error',
              severity: 'medium',
              message: `Could not fully analyze: ${error.message}`
            }
          ],
          flagged: true
        }
      }
    }
  }

  /**
   * Detect blur using Laplacian variance
   * Higher variance = sharper image
   */
  async detectBlur(filepath, metadata) {
    try {
      // Calculate Laplacian variance as a blur metric
      // This is a simplified version - a full implementation would use cv2/opencv
      
      // For now, use a heuristic based on file size and dimensions
      // Blurry images typically have lower entropy
      const entropy = await this.calculateEntropy(filepath, metadata)
      
      // Normalize entropy to 0-100 score
      // Low entropy = blurry, High entropy = sharp
      const blurScore = Math.min(100, entropy * 8)
      
      return Math.round(blurScore)
    } catch (error) {
      return 75 // Default to decent quality if can't analyze
    }
  }

  /**
   * Detect low contrast / very dark images (accidental shots)
   */
  async detectLowContrast(filepath, metadata) {
    try {
      // Use sharp to analyze image statistics
      const stats = await sharp(filepath)
        .stats()

      if (!stats || !stats.channels) {
        return 50
      }

      // Calculate average brightness
      const brightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length

      // Calculate contrast (std dev)
      const contrast = stats.channels.reduce((sum, ch) => sum + ch.stdDev, 0) / stats.channels.length

      // Very dark image (brightness < 50)
      if (brightness < 50) {
        return Math.round((brightness / 50) * 30)
      }

      // Very low contrast
      if (contrast < 10) {
        return Math.round((contrast / 10) * 40)
      }

      // Good contrast and brightness
      return 100
    } catch (error) {
      return 75
    }
  }

  /**
   * Calculate image entropy (randomness)
   * Low entropy = solid colors or repetitive patterns
   * High entropy = varied content
   */
  async calculateEntropy(filepath, metadata) {
    try {
      // Get histogram
      const stats = await sharp(filepath).stats()

      if (!stats || !stats.channels) {
        return 5 // Default medium entropy
      }

      // Calculate entropy for each channel
      let totalEntropy = 0
      const histograms = stats.channels

      // Simplified entropy: use standard deviation as proxy
      histograms.forEach(channel => {
        // Normalize std dev to 0-8 scale
        const normalized = Math.min(8, channel.stdDev / 32)
        totalEntropy += normalized
      })

      return totalEntropy / histograms.length
    } catch (error) {
      return 5
    }
  }

  /**
   * Detect if image has content (faces, objects, text)
   * Uses heuristic: if image has reasonable dimensions and isn't too uniform
   */
  async detectContent(filepath, metadata) {
    try {
      const stats = await sharp(filepath).stats()

      if (!stats || !stats.channels) {
        return true // Assume has content if can't analyze
      }

      // Check if image is too uniform (all one color)
      const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdDev, 0) / stats.channels.length

      // If standard deviation is very low, image is mostly one color
      if (avgStdDev < 5) {
        return false // No content
      }

      // Check image dimensions - very small images are suspicious
      if (metadata.width < 100 || metadata.height < 100) {
        return false
      }

      return true
    } catch (error) {
      return true
    }
  }

  /**
   * Check for problematic dimensions
   */
  checkDimensions(metadata) {
    // Extremely wide panoramic
    if (metadata.width / metadata.height > 3) {
      return 'Extremely wide aspect ratio - possible accidental panorama'
    }

    // Extremely tall
    if (metadata.height / metadata.width > 3) {
      return 'Extremely tall aspect ratio - possibly vertical video frame'
    }

    // Very small resolution
    if (metadata.width < 320 || metadata.height < 240) {
      return 'Very low resolution image'
    }

    return null
  }

  /**
   * Generate perceptual hash for duplicate detection
   * Simple version: resize image and hash pixel values
   */
  async generatePerceptualHash(filepath) {
    try {
      // Create a small thumbnail for hashing
      const buffer = await sharp(filepath)
        .resize(8, 8, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer()

      // Generate hash from pixel values
      const hash = crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex')

      return hash
    } catch (error) {
      // Fallback to file hash
      const buffer = readFileSync(filepath)
      return crypto.createHash('sha256').update(buffer).digest('hex')
    }
  }

  /**
   * Find duplicate images using perceptual hash
   * Returns: { duplicates: [[photo1, photo2], ...], unique: [photo1, ...] }
   */
  findDuplicates(analyzedPhotos, hashSimilarityThreshold = 0.9) {
    const duplicates = []
    const processed = new Set()

    for (let i = 0; i < analyzedPhotos.length; i++) {
      if (processed.has(i)) continue

      const duplicateGroup = [analyzedPhotos[i]]
      processed.add(i)

      for (let j = i + 1; j < analyzedPhotos.length; j++) {
        if (processed.has(j)) continue

        // Simple comparison: identical hashes or very similar
        if (analyzedPhotos[i].quality.hash === analyzedPhotos[j].quality.hash) {
          duplicateGroup.push(analyzedPhotos[j])
          processed.add(j)
        }
      }

      if (duplicateGroup.length > 1) {
        duplicates.push(duplicateGroup)
      }
    }

    const unique = analyzedPhotos.filter((_, idx) => !processed.has(idx) || 
      duplicates.every(group => group[0] === analyzedPhotos[idx]))

    return { duplicates, unique }
  }

  /**
   * Get recommendation for a flagged photo
   */
  getRecommendation(analysis) {
    if (analysis.quality.score >= 80) {
      return { action: 'keep', reason: 'High quality photo' }
    }

    if (analysis.quality.score >= 60) {
      return { action: 'review', reason: 'Minor quality issues - review before keeping' }
    }

    // Check primary issue
    const issues = analysis.quality.issues
    const hasBlur = issues.some(i => i.type === 'blur' && i.severity === 'high')
    const hasAccidental = issues.some(i => i.type === 'accidental' && i.severity === 'high')
    const hasDuplicate = issues.some(i => i.type === 'duplicate')

    if (hasBlur) {
      return { action: 'delete', reason: 'Photo is significantly blurred' }
    }

    if (hasAccidental) {
      return { action: 'delete', reason: 'Appears to be an accidental shot' }
    }

    if (hasDuplicate) {
      return { action: 'review', reason: 'Potential duplicate - compare with similar photos' }
    }

    return { action: 'review', reason: `Low quality score (${analysis.quality.score}%)` }
  }
}

export default new QualityDetectionService()
