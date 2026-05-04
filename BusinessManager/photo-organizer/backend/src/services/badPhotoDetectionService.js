import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Advanced Bad Photo Detection Service
 * Detects 6 types of problematic photos:
 * 1. Blurry/out-of-focus (Laplacian variance)
 * 2. Closed-eye/blinking (entropy-based heuristic)
 * 3. Weird/distorted faces (low contrast + entropy)
 * 4. Accidental photos (very low entropy, no content)
 * 5. Low resolution/pixelated (dimension + compression check)
 * 6. Duplicates (perceptual hashing)
 */
export class BadPhotoDetectionService {
  constructor() {
    this.detectionCache = new Map()
    this.photoHashes = new Map() // For duplicate detection
  }

  /**
   * Comprehensive analysis - all 6 detection methods
   */
  async analyzePhoto(photoPath) {
    try {
      const buffer = await fs.readFile(photoPath)
      const image = sharp(photoPath)
      const metadata = await image.metadata()

      const results = {
        path: photoPath,
        filename: path.basename(photoPath),
        timestamp: new Date().toISOString(),
        issues: [],
        severity: 'good',
        detections: {}
      }

      // 1. Blurry/Out-of-Focus Detection
      results.detections.blur = await this._detectBlur(buffer, metadata)
      if (results.detections.blur.isBad) {
        results.issues.push({
          type: 'Blurry',
          severity: results.detections.blur.severity,
          confidence: results.detections.blur.confidence,
          score: results.detections.blur.score
        })
      }

      // 2. Closed-Eye/Blinking Detection (heuristic-based)
      results.detections.closedEye = await this._detectClosedEyes(buffer, metadata)
      if (results.detections.closedEye.isBad) {
        results.issues.push({
          type: 'Closed Eyes',
          severity: results.detections.closedEye.severity,
          confidence: results.detections.closedEye.confidence
        })
      }

      // 3. Weird/Distorted Faces Detection
      results.detections.distortedFace = await this._detectDistortedFace(buffer, metadata)
      if (results.detections.distortedFace.isBad) {
        results.issues.push({
          type: 'Distorted Face',
          severity: results.detections.distortedFace.severity,
          confidence: results.detections.distortedFace.confidence
        })
      }

      // 4. Accidental Photos Detection
      results.detections.accidental = await this._detectAccidentalPhoto(buffer, metadata)
      if (results.detections.accidental.isBad) {
        results.issues.push({
          type: 'Accidental Photo',
          severity: results.detections.accidental.severity,
          confidence: results.detections.accidental.confidence,
          reason: results.detections.accidental.reason
        })
      }

      // 5. Low Resolution/Pixelated Detection
      results.detections.lowResolution = await this._detectLowResolution(metadata)
      if (results.detections.lowResolution.isBad) {
        results.issues.push({
          type: 'Low Resolution',
          severity: results.detections.lowResolution.severity,
          confidence: results.detections.lowResolution.confidence,
          details: results.detections.lowResolution.details
        })
      }

      // 6. Duplicate Detection
      results.detections.duplicate = await this._detectDuplicate(buffer, photoPath)
      if (results.detections.duplicate.isDuplicate) {
        results.issues.push({
          type: 'Duplicate',
          severity: 'medium',
          confidence: results.detections.duplicate.confidence,
          duplicateOf: results.detections.duplicate.duplicateOf
        })
      }

      // Determine overall severity
      if (results.issues.length === 0) {
        results.severity = 'good'
      } else {
        const severities = results.issues.map(i => i.severity || 'low')
        if (severities.includes('high')) results.severity = 'high'
        else if (severities.includes('medium')) results.severity = 'medium'
        else results.severity = 'low'
      }

      // Recommendation
      results.recommendation = this._getRecommendation(results)

      return results
    } catch (error) {
      console.error(`Bad photo detection error: ${error.message}`)
      throw error
    }
  }

  /**
   * 1. BLURRY/OUT-OF-FOCUS DETECTION
   * Uses Laplacian variance - low variance = blurry
   */
  async _detectBlur(buffer, metadata) {
    try {
      // Convert to grayscale and get pixel data
      const gray = await sharp(buffer)
        .grayscale()
        .raw()
        .toBuffer()

      const { width, height } = metadata
      const laplacianVariance = this._calculateLaplacianVariance(gray, width, height)

      // Thresholds: < 80 = very blurry, 80-150 = somewhat blurry
      // Increased threshold from 150 to 100 to reduce false positives on good photos
      const isBad = laplacianVariance < 100
      const severity = laplacianVariance < 50 ? 'high' : 'medium'
      const confidence = Math.min(100, (100 - laplacianVariance) / 100 * 100)

      return {
        isBad,
        severity: isBad ? severity : 'low',
        confidence: Math.round(isBad ? confidence : 100 - confidence),
        score: Math.round(laplacianVariance),
        threshold: 100
      }
    } catch (error) {
      console.error(`Blur detection error: ${error.message}`)
      return { isBad: false, severity: 'low', confidence: 0, score: 0 }
    }
  }

  /**
   * Calculate Laplacian variance for blur detection
   */
  _calculateLaplacianVariance(grayBuffer, width, height) {
    // Laplacian kernel: detects edges/changes
    const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0]
    const result = []

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const py = y + ky - 1
            const px = x + kx - 1
            sum += kernel[ky * 3 + kx] * grayBuffer[py * width + px]
          }
        }
        result.push(sum)
      }
    }

    // Calculate variance
    const mean = result.reduce((a, b) => a + b, 0) / result.length
    const variance = result.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / result.length

    return Math.sqrt(variance) // Return standard deviation (Laplacian variance)
  }

  /**
   * 2. CLOSED-EYE/BLINKING DETECTION
   * Uses entropy and contrast patterns in face region
   * Heuristic: Closed eyes = lower contrast in upper face area
   */
  async _detectClosedEyes(buffer, metadata) {
    try {
      const gray = await sharp(buffer)
        .grayscale()
        .extract({
          left: 0,
          top: 0,
          width: metadata.width,
          height: Math.floor(metadata.height * 0.4) // Upper 40% = face region
        })
        .raw()
        .toBuffer()

      const contrast = this._calculateContrast(gray)
      const entropy = this._calculateEntropy(gray)

      // Low contrast + low entropy in upper region = likely closed eyes
      // VERY lenient - only flag if BOTH contrast AND entropy are extremely low
      const isBad = contrast < 10 && entropy < 0.5
      const confidence = isBad ? Math.min(100, (10 - contrast) / 10 * 100) : 0

      return {
        isBad,
        severity: isBad ? 'medium' : 'low',
        confidence: Math.round(confidence),
        contrast: Math.round(contrast),
        entropy: Math.round(entropy * 10) / 10
      }
    } catch (error) {
      console.error(`Closed eye detection error: ${error.message}`)
      return { isBad: false, severity: 'low', confidence: 0 }
    }
  }

  /**
   * 3. WEIRD/DISTORTED FACES DETECTION
   * Uses color distribution and local contrast
   * Distorted faces = uneven color distribution + low overall contrast
   */
  async _detectDistortedFace(buffer, metadata) {
    try {
      const { r, g, b } = await this._getColorChannels(buffer, metadata)

      // Calculate standard deviation for each channel
      const rStd = this._standardDeviation(r)
      const gStd = this._standardDeviation(g)
      const bStd = this._standardDeviation(b)

      // Very uneven color distribution = potential distortion/blocking
      const colorUniformity = (rStd + gStd + bStd) / 3
      // VERY lenient - only flag severe/extreme distortion
      const isBad = colorUniformity < 4 // Only extreme distortion

      const confidence = isBad ? Math.max(50, (10 - colorUniformity) / 10 * 100) : 0

      return {
        isBad,
        severity: isBad ? 'medium' : 'low',
        confidence: Math.round(confidence),
        colorUniformity: Math.round(colorUniformity)
      }
    } catch (error) {
      console.error(`Distorted face detection error: ${error.message}`)
      return { isBad: false, severity: 'low', confidence: 0 }
    }
  }

  /**
   * 4. ACCIDENTAL PHOTOS DETECTION
   * Signs: very low entropy, no content, dark image, or all one color
   */
  async _detectAccidentalPhoto(buffer, metadata) {
    try {
      const gray = await sharp(buffer)
        .grayscale()
        .raw()
        .toBuffer()

      const entropy = this._calculateEntropy(gray)
      const brightness = this._calculateBrightness(gray)
      const colorfulness = await this._calculateColorfulness(buffer)

      const reasons = []
      let isBad = false

      // Very low entropy = likely pocket/bag/floor shot
      // EXTREMELY lenient - only flag near-zero entropy
      if (entropy < 0.3) {
        reasons.push('Almost no content (very low entropy)')
        isBad = true
      }

      // Very dark image
      // VERY lenient - only flag nearly pitch black
      if (brightness < 5) {
        reasons.push('Pitch black (likely pocket/bag shot)')
        isBad = true
      }

      // Completely desaturated (grayscale-ish)
      // DISABLED - B&W and desaturated photos are valid
      // if (colorfulness < 5) {
      //   reasons.push('No color content')
      //   isBad = true
      // }

      // All one color or very uniform
      // Only flag if BOTH entropy AND brightness are near-zero
      if (entropy < 0.2 && brightness < 2) {
        reasons.push('Uniform color (likely floor/wall)')
        isBad = true
      }

      return {
        isBad,
        severity: isBad ? 'high' : 'low',
        confidence: isBad ? Math.min(100, entropy < 1 ? 100 : 70) : 0,
        reason: reasons.join('; '),
        entropy: Math.round(entropy * 10) / 10,
        brightness: Math.round(brightness),
        colorfulness: Math.round(colorfulness)
      }
    } catch (error) {
      console.error(`Accidental photo detection error: ${error.message}`)
      return { isBad: false, severity: 'low', confidence: 0, reason: '' }
    }
  }

  /**
   * 5. LOW RESOLUTION/PIXELATED DETECTION
   */
  async _detectLowResolution(metadata) {
    const { width, height } = metadata

    const issues = []
    let isBad = false

    // Check absolute resolution (less than 800x600 is low for modern standards)
    if (width < 800 || height < 600) {
      issues.push(`Very small dimensions: ${width}x${height}`)
      isBad = true
    }

    // Check aspect ratio (extreme ratios = likely cropped too much)
    const aspectRatio = Math.max(width, height) / Math.min(width, height)
    if (aspectRatio > 4) {
      issues.push(`Extreme aspect ratio: ${aspectRatio.toFixed(1)}:1 (heavily cropped)`)
      isBad = true
    }

    // Check if mega-zoomed (very small photo enlarged)
    const megapixels = (width * height) / 1_000_000
    if (megapixels < 0.3) {
      issues.push(`Very low megapixels: ${megapixels.toFixed(1)}MP`)
      isBad = true
    }

    return {
      isBad,
      severity: isBad ? 'high' : 'low',
      confidence: isBad ? 80 : 0,
      details: {
        width,
        height,
        megapixels: Math.round(megapixels * 10) / 10,
        aspectRatio: Math.round(aspectRatio * 10) / 10,
        issues
      }
    }
  }

  /**
   * 6. DUPLICATE DETECTION using Perceptual Hashing
   */
  async _detectDuplicate(buffer, photoPath) {
    try {
      const hash = await this._generatePerceptualHash(buffer)

      if (this.photoHashes.has(hash)) {
        // Found duplicate
        return {
          isDuplicate: true,
          confidence: 95,
          duplicateOf: this.photoHashes.get(hash),
          hash
        }
      }

      // Store hash for future comparisons
      this.photoHashes.set(hash, photoPath)

      return {
        isDuplicate: false,
        confidence: 0,
        duplicateOf: null,
        hash
      }
    } catch (error) {
      console.error(`Duplicate detection error: ${error.message}`)
      return { isDuplicate: false, confidence: 0, duplicateOf: null }
    }
  }

  /**
   * Generate perceptual hash (8x8 average hash)
   */
  async _generatePerceptualHash(buffer) {
    try {
      // Resize to 8x8
      const small = await sharp(buffer)
        .resize(8, 8, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer()

      // Calculate average brightness
      const sum = small.reduce((a, b) => a + b, 0)
      const avg = sum / small.length

      // Create hash: 1 if pixel > avg, 0 otherwise
      const hash = Array.from(small)
        .map(pixel => pixel > avg ? '1' : '0')
        .join('')

      return crypto.createHash('sha256').update(hash).digest('hex')
    } catch (error) {
      return crypto.randomBytes(16).toString('hex')
    }
  }

  /**
   * Helper: Calculate contrast (standard deviation of pixel values)
   */
  _calculateContrast(grayBuffer) {
    const mean = grayBuffer.reduce((a, b) => a + b, 0) / grayBuffer.length
    const variance = grayBuffer.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / grayBuffer.length
    return Math.sqrt(variance)
  }

  /**
   * Helper: Calculate entropy (randomness/information)
   */
  _calculateEntropy(grayBuffer) {
    const histogram = new Array(256).fill(0)
    for (const pixel of grayBuffer) {
      histogram[pixel]++
    }

    let entropy = 0
    for (const count of histogram) {
      if (count === 0) continue
      const p = count / grayBuffer.length
      entropy -= p * Math.log2(p)
    }
    return entropy
  }

  /**
   * Helper: Calculate average brightness
   */
  _calculateBrightness(grayBuffer) {
    return grayBuffer.reduce((a, b) => a + b, 0) / grayBuffer.length
  }

  /**
   * Helper: Calculate standard deviation
   */
  _standardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  /**
   * Helper: Get color channels as separate arrays
   */
  async _getColorChannels(buffer, metadata) {
    const raw = await sharp(buffer)
      .raw()
      .toBuffer()

    const r = [], g = [], b = []
    for (let i = 0; i < raw.length; i += 3) {
      r.push(raw[i])
      g.push(raw[i + 1])
      b.push(raw[i + 2])
    }
    return { r, g, b }
  }

  /**
   * Helper: Calculate colorfulness (saturation indicator)
   */
  async _calculateColorfulness(buffer) {
    try {
      const { r, g, b } = await this._getColorChannels(buffer, await sharp(buffer).metadata())

      // RMS of differences between channels = colorfulness
      let sum = 0
      for (let i = 0; i < r.length; i++) {
        const dr = r[i] - g[i]
        const dg = g[i] - b[i]
        const db = b[i] - r[i]
        sum += dr * dr + dg * dg + db * db
      }

      return Math.sqrt(sum / r.length)
    } catch (error) {
      return 50 // Default medium colorfulness
    }
  }

  /**
   * Get recommendation based on analysis
   */
  _getRecommendation(analysis) {
    if (analysis.issues.length === 0) {
      return { action: 'keep', reason: 'Good quality photo' }
    }

    const severities = analysis.issues.map(i => i.severity || 'low')
    const hasHighSeverity = severities.includes('high')
    const highSeverityCount = severities.filter(s => s === 'high').length

    if (hasHighSeverity && highSeverityCount >= 2) {
      return { action: 'auto-delete', reason: 'Multiple high-severity issues' }
    }

    if (analysis.issues.some(i => i.type === 'Accidental Photo')) {
      return { action: 'auto-delete', reason: 'Accidental photo detected' }
    }

    if (analysis.issues.some(i => i.type === 'Duplicate')) {
      return { action: 'review', reason: 'Possible duplicate - review before delete' }
    }

    return { action: 'review', reason: 'Review recommended - user decision' }
  }

  /**
   * Batch analyze photos
   */
  async batchAnalyze(photoPaths) {
    const results = []
    for (const photoPath of photoPaths) {
      try {
        const result = await this.analyzePhoto(photoPath)
        results.push(result)
      } catch (error) {
        results.push({
          path: photoPath,
          filename: path.basename(photoPath),
          error: error.message
        })
      }
    }
    return results
  }

  /**
   * Get summary statistics
   */
  summarizeResults(analysisResults) {
    const summary = {
      total: analysisResults.length,
      good: 0,
      needsReview: 0,
      autoDelete: 0,
      byIssueType: {},
      recommendations: {
        keep: 0,
        review: 0,
        autoDelete: 0
      }
    }

    for (const result of analysisResults) {
      if (result.error) continue

      if (result.issues.length === 0) {
        summary.good++
      } else if (result.recommendation.action === 'auto-delete') {
        summary.autoDelete++
      } else {
        summary.needsReview++
      }

      summary.recommendations[result.recommendation.action]++

      for (const issue of result.issues) {
        const type = issue.type
        summary.byIssueType[type] = (summary.byIssueType[type] || 0) + 1
      }
    }

    return summary
  }

  /**
   * Reset duplicate detection (start fresh)
   */
  resetDuplicateDetection() {
    this.photoHashes.clear()
  }
}

export default new BadPhotoDetectionService()
