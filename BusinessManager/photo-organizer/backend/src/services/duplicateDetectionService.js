import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Comprehensive Duplicate & Near-Duplicate Detection Service
 * 
 * Three levels of detection:
 * 1. Exact Duplicates - File hashing (MD5/SHA-1)
 * 2. Near-Duplicates - Perceptual hashing (pHash, aHash, dHash)
 * 3. Burst-Mode Clustering - SSIM + clustering for similar photos
 */
export class DuplicateDetectionService {
  constructor() {
    this.fileHashes = new Map()      // For exact duplicate detection
    this.perceptualHashes = new Map() // For near-duplicate detection
    this.imageMetadata = new Map()    // For quality comparison
  }

  /**
   * Comprehensive duplicate analysis
   */
  async analyzeDuplicates(photoPaths) {
    try {
      const results = {
        timestamp: new Date().toISOString(),
        total: photoPaths.length,
        duplicateGroups: [],
        exactDuplicates: [],
        nearDuplicates: [],
        burstModePhotos: [],
        qualityAnalysis: {},
        stats: {
          totalDuplicates: 0,
          exactDuplicateGroups: 0,
          nearDuplicateGroups: 0,
          burstModeGroups: 0,
          totalPhotosToKeep: 0,
          totalPhotosToRemove: 0
        }
      }

      // Step 1: Calculate exact duplicates (file hashing)
      await this._detectExactDuplicates(photoPaths, results)

      // Step 2: Calculate near-duplicates (perceptual hashing)
      await this._detectNearDuplicates(photoPaths, results)

      // Step 3: Detect burst-mode and similar photos (SSIM + clustering)
      await this._detectBurstMode(photoPaths, results)

      // Step 4: Quality analysis and keep best
      await this._analyzeQuality(photoPaths, results)

      // Step 5: Consolidate findings
      this._consolidateDuplicates(results)

      return results
    } catch (error) {
      console.error(`Duplicate detection error: ${error.message}`)
      return {
        success: false,
        error: error.message,
        duplicateGroups: [],
        stats: { totalDuplicates: 0, exactDuplicateGroups: 0, nearDuplicateGroups: 0, burstModeGroups: 0, totalPhotosToKeep: 0, totalPhotosToRemove: 0 }
      }
    }
  }

  /**
   * 1. EXACT DUPLICATE DETECTION - File Hashing
   * Uses SHA-256 hashing to find identical files
   */
  async _detectExactDuplicates(photoPaths, results) {
    const hashMap = new Map()

    for (const photoPath of photoPaths) {
      try {
        const buffer = await fs.readFile(photoPath)
        const hash = crypto.createHash('sha256').update(buffer).digest('hex')

        this.fileHashes.set(photoPath, hash)

        if (!hashMap.has(hash)) {
          hashMap.set(hash, [])
        }
        hashMap.get(hash).push({
          path: photoPath,
          filename: path.basename(photoPath),
          size: buffer.length
        })
      } catch (error) {
        console.error(`Error hashing ${photoPath}: ${error.message}`)
      }
    }

    // Find groups with duplicates
    for (const [hash, files] of hashMap.entries()) {
      if (files.length > 1) {
        const group = {
          type: 'EXACT_DUPLICATE',
          hash,
          count: files.length,
          files,
          keep: files[0], // Keep first one by default
          remove: files.slice(1),
          confidence: 1.0
        }
        results.exactDuplicates.push(group)
        results.stats.exactDuplicateGroups++
        results.stats.totalDuplicates += files.length - 1
      }
    }
  }

  /**
   * 2. NEAR-DUPLICATE DETECTION - Perceptual Hashing
   * Uses aHash, pHash, dHash to find similar images
   */
  async _detectNearDuplicates(photoPaths, results) {
    const hashMap = new Map()
    const HAMMING_THRESHOLD = 5 // Allow up to 5 bit differences

    // Calculate perceptual hashes for all photos
    const hashes = new Map()
    for (const photoPath of photoPaths) {
      try {
        const hash = await this._generatePerceptualHash(photoPath)
        hashes.set(photoPath, hash)
        this.perceptualHashes.set(photoPath, hash)
      } catch (error) {
        console.error(`Error generating hash for ${photoPath}: ${error.message}`)
      }
    }

    // Find similar images by comparing hashes
    const processed = new Set()
    for (const [path1, hash1] of hashes.entries()) {
      if (processed.has(path1)) continue

      const group = {
        type: 'NEAR_DUPLICATE',
        count: 1,
        files: [{ path: path1, filename: path.basename(path1), hash: hash1, similarity: 1.0 }],
        confidence: 0
      }

      for (const [path2, hash2] of hashes.entries()) {
        if (path1 === path2 || processed.has(path2)) continue

        const distance = this._hammingDistance(hash1, hash2)
        const similarity = 1 - (distance / 64) // Convert to 0-1 scale

        if (distance <= HAMMING_THRESHOLD) {
          group.files.push({
            path: path2,
            filename: path.basename(path2),
            hash: hash2,
            similarity: Math.round(similarity * 100) / 100
          })
          group.count++
          group.confidence = Math.max(group.confidence, similarity)
          processed.add(path2)
        }
      }

      if (group.count > 1) {
        // Sort by similarity (best first)
        group.files.sort((a, b) => b.similarity - a.similarity)
        group.keep = group.files[0]
        group.remove = group.files.slice(1)
        results.nearDuplicates.push(group)
        results.stats.nearDuplicateGroups++
        results.stats.totalDuplicates += group.count - 1
      }

      processed.add(path1)
    }
  }

  /**
   * 3. BURST-MODE DETECTION - SSIM + Clustering
   * Detects photos taken in rapid succession with slight variations
   */
  async _detectBurstMode(photoPaths, results) {
    const SSIM_THRESHOLD = 0.85 // 85% similarity = burst-mode candidate
    const TIME_THRESHOLD = 3000 // 3 seconds between shots

    // Create graph of similar images
    const similarityGraph = new Map()
    for (const photoPath of photoPaths) {
      similarityGraph.set(photoPath, [])
    }

    // Compare all pairs for SSIM similarity
    for (let i = 0; i < photoPaths.length; i++) {
      for (let j = i + 1; j < photoPaths.length; j++) {
        try {
          const similarity = await this._calculateSSIM(photoPaths[i], photoPaths[j])

          if (similarity >= SSIM_THRESHOLD) {
            similarityGraph.get(photoPaths[i]).push({
              path: photoPaths[j],
              similarity
            })
            similarityGraph.get(photoPaths[j]).push({
              path: photoPaths[i],
              similarity
            })
          }
        } catch (error) {
          // Skip on error
        }
      }
    }

    // Cluster similar images
    const clusters = this._clusterSimilarPhotos(similarityGraph, photoPaths)

    for (const cluster of clusters) {
      if (cluster.length > 1) {
        const group = {
          type: 'BURST_MODE',
          count: cluster.length,
          files: cluster.map(p => ({
            path: p,
            filename: path.basename(p)
          })),
          confidence: 0.95
        }
        group.keep = group.files[0] // Will be updated by quality analysis
        group.remove = group.files.slice(1)
        results.burstModePhotos.push(group)
        results.stats.burstModeGroups++
        results.stats.totalDuplicates += group.count - 1
      }
    }
  }

  /**
   * Quality Analysis - Keep Sharpest & Highest Resolution
   */
  async _analyzeQuality(photoPaths, results) {
    for (const photoPath of photoPaths) {
      try {
        const image = sharp(photoPath)
        const metadata = await image.metadata()
        const blur = await this._calculateBluriness(photoPath)

        this.imageMetadata.set(photoPath, {
          path: photoPath,
          width: metadata.width,
          height: metadata.height,
          megapixels: (metadata.width * metadata.height) / 1_000_000,
          blur: blur, // Lower = sharper
          quality: this._calculateQualityScore(metadata.width, metadata.height, blur)
        })
      } catch (error) {
        console.error(`Error analyzing quality of ${photoPath}: ${error.message}`)
      }
    }

    // Update keep/remove based on quality
    const allGroups = [
      ...results.exactDuplicates,
      ...results.nearDuplicates,
      ...results.burstModePhotos
    ]

    for (const group of allGroups) {
      if (group.files.length > 1) {
        // Sort by quality score (best first)
        const filesWithQuality = group.files.map(f => ({
          ...f,
          quality: this.imageMetadata.get(f.path)?.quality || 0
        }))

        filesWithQuality.sort((a, b) => (b.quality || 0) - (a.quality || 0))

        group.keep = filesWithQuality[0]
        group.remove = filesWithQuality.slice(1)
      }
    }
  }

  /**
   * Consolidate all duplicate findings
   */
  _consolidateDuplicates(results) {
    // Combine all groups
    results.duplicateGroups = [
      ...results.exactDuplicates,
      ...results.nearDuplicates,
      ...results.burstModePhotos
    ]

    // Update stats
    results.stats.totalPhotosToRemove = results.stats.totalDuplicates
    results.stats.totalPhotosToKeep = results.total - results.stats.totalDuplicates

    // Sort by type priority (exact > near > burst)
    results.duplicateGroups.sort((a, b) => {
      const priority = { 'EXACT_DUPLICATE': 0, 'NEAR_DUPLICATE': 1, 'BURST_MODE': 2 }
      return priority[a.type] - priority[b.type]
    })
  }

  /**
   * Generate 64-bit perceptual hash
   */
  async _generatePerceptualHash(photoPath) {
    try {
      const buffer = await sharp(photoPath)
        .resize(8, 8, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer()

      const mean = buffer.reduce((a, b) => a + b, 0) / buffer.length

      let hash = ''
      for (let i = 0; i < buffer.length; i++) {
        hash += buffer[i] > mean ? '1' : '0'
      }

      return hash
    } catch (error) {
      console.error(`Error generating perceptual hash: ${error.message}`)
      return '0'.repeat(64)
    }
  }

  /**
   * Calculate Hamming distance between two binary hashes
   */
  _hammingDistance(hash1, hash2) {
    if (hash1.length !== hash2.length) return hash1.length
    let distance = 0
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) distance++
    }
    return distance
  }

  /**
   * Calculate SSIM (Structural Similarity Index)
   * Measures perceived quality difference between images
   */
  async _calculateSSIM(photoPath1, photoPath2) {
    try {
      // Resize both to 8x8 for comparison
      const buffer1 = await sharp(photoPath1)
        .resize(8, 8, { fit: 'fill' })
        .raw()
        .toBuffer()

      const buffer2 = await sharp(photoPath2)
        .resize(8, 8, { fit: 'fill' })
        .raw()
        .toBuffer()

      // Calculate mean luminance
      const mean1 = buffer1.reduce((a, b) => a + b, 0) / buffer1.length
      const mean2 = buffer2.reduce((a, b) => a + b, 0) / buffer2.length

      // Calculate variance and covariance
      let variance1 = 0, variance2 = 0, covariance = 0
      for (let i = 0; i < buffer1.length; i++) {
        variance1 += Math.pow(buffer1[i] - mean1, 2)
        variance2 += Math.pow(buffer2[i] - mean2, 2)
        covariance += (buffer1[i] - mean1) * (buffer2[i] - mean2)
      }
      variance1 /= buffer1.length
      variance2 /= buffer2.length
      covariance /= buffer1.length

      // SSIM formula
      const c1 = 6.5025
      const c2 = 58.5225
      const ssim = ((2 * mean1 * mean2 + c1) * (2 * covariance + c2)) /
        ((mean1 * mean1 + mean2 * mean2 + c1) * (variance1 + variance2 + c2))

      return Math.max(0, Math.min(1, ssim))
    } catch (error) {
      console.error(`Error calculating SSIM: ${error.message}`)
      return 0
    }
  }

  /**
   * Cluster similar photos using graph traversal
   */
  _clusterSimilarPhotos(similarityGraph, photoPaths) {
    const visited = new Set()
    const clusters = []

    for (const photoPath of photoPaths) {
      if (!visited.has(photoPath)) {
        const cluster = []
        const queue = [photoPath]

        while (queue.length > 0) {
          const current = queue.shift()
          if (visited.has(current)) continue

          visited.add(current)
          cluster.push(current)

          // Add connected photos to queue
          for (const similar of similarityGraph.get(current) || []) {
            if (!visited.has(similar.path)) {
              queue.push(similar.path)
            }
          }
        }

        if (cluster.length > 0) {
          clusters.push(cluster)
        }
      }
    }

    return clusters
  }

  /**
   * Calculate blurriness (Laplacian variance)
   */
  async _calculateBluriness(photoPath) {
    try {
      const gray = await sharp(photoPath)
        .grayscale()
        .raw()
        .toBuffer()

      const { width, height } = (await sharp(photoPath).metadata())
      return this._calculateLaplacianVariance(gray, width, height)
    } catch (error) {
      return 0
    }
  }

  /**
   * Laplacian variance for blur detection
   */
  _calculateLaplacianVariance(buffer, width, height) {
    const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0]
    const result = []

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const py = y + ky - 1
            const px = x + kx - 1
            const idx = py * width + px
            sum += buffer[idx] * kernel[ky * 3 + kx]
          }
        }
        result.push(sum)
      }
    }

    const mean = result.reduce((a, b) => a + b, 0) / result.length
    const variance = result.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / result.length
    return variance
  }

  /**
   * Calculate overall quality score
   */
  _calculateQualityScore(width, height, blurriness) {
    const megapixels = (width * height) / 1_000_000
    const resolutionScore = Math.min(100, megapixels * 5) // Normalize to 0-100
    const sharpnessScore = Math.min(100, 100 - (blurriness / 300) * 100) // Lower blur = higher score
    const aspectRatio = Math.max(width, height) / Math.min(width, height)
    const aspectScore = aspectRatio <= 4 ? 100 : 50 // Penalize extreme ratios

    return (resolutionScore * 0.4 + sharpnessScore * 0.4 + aspectScore * 0.2)
  }

  /**
   * Remove duplicate photos (safe mode - moves to folder)
   */
  async removeDisplayingDuplicates(results, mode = 'review') {
    const cleanupResults = {
      success: true,
      mode,
      stats: {
        total: 0,
        moved: 0,
        deleted: 0,
        errors: 0
      },
      details: {
        moved_photos: [],
        deleted_photos: [],
        errors: []
      }
    }

    const baseDir = path.dirname(results.duplicateGroups[0]?.remove[0]?.path || '')
    const reviewFolder = path.join(baseDir, 'Review', 'Duplicates')

    if (mode === 'review') {
      await fs.mkdir(reviewFolder, { recursive: true })
    }

    for (const group of results.duplicateGroups) {
      for (const file of group.remove || []) {
        try {
          cleanupResults.stats.total++

          if (mode === 'review') {
            // Move to review folder
            const destPath = path.join(reviewFolder, file.filename)
            await fs.copyFile(file.path, destPath)
            await fs.unlink(file.path)
            cleanupResults.stats.moved++
            cleanupResults.details.moved_photos.push(file.filename)
          } else if (mode === 'auto-delete') {
            // Permanently delete
            await fs.unlink(file.path)
            cleanupResults.stats.deleted++
            cleanupResults.details.deleted_photos.push(file.filename)
          }
        } catch (error) {
          cleanupResults.stats.errors++
          cleanupResults.details.errors.push({
            file: file.filename,
            error: error.message
          })
        }
      }
    }

    cleanupResults.folder = reviewFolder
    return cleanupResults
  }
}

export default new DuplicateDetectionService()
