import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { ScannerService } from './scannerService.js';
import { BadPhotoDetectionService } from './badPhotoDetectionService.js';
import { AIVisionService } from './aiVisionService.js';
import { AIEnhancedBadPhotoDetectionService } from './aiEnhancedBadPhotoDetectionService.js';
import { AutoEnhancementService } from './autoEnhancementService.js';
import { AIQualityDetectionService } from './aiQualityDetectionService.js';
import { GeocodingService } from './geocodingService.js';
import { DuplicateDetectionService } from './duplicateDetectionService.js';
import ExifParser from 'exif-parser';

/**
 * Batch Photo Processing Service
 * Recursively scans folders, assesses quality, and:
 * - Moves bad quality photos to a "Bad Photos" folder
 * - Auto-enhances good quality photos
 * 
 * No compromise: Uses multiple detection methods for accuracy
 */
export class BatchPhotoProcessingService {
  constructor() {
    this.scannerService = new ScannerService();
    this.badPhotoDetectionService = new BadPhotoDetectionService();
    this.aiVisionService = new AIVisionService();
    this.aiEnhancedBadPhotoDetectionService = new AIEnhancedBadPhotoDetectionService();
    this.autoEnhancementService = new AutoEnhancementService();
    this.aiQualityDetectionService = new AIQualityDetectionService();
    this.geocodingService = new GeocodingService();
    this.duplicateDetectionService = new DuplicateDetectionService();

    this.processingStats = {
      totalPhotos: 0,
      goodPhotos: 0,
      badPhotos: 0,
      enhanced: 0,
      moved: 0,
      errors: 0,
      organizedByLocation: 0,
      duplicatesRemoved: 0,
      startTime: null,
      endTime: null
    };

    this.processedPhotos = {
      good: [],
      bad: [],
      byLocation: {},
      errors: []
    };
  }

  /**
   * Main entry point: Process all photos in directory
   * 1. Recursively scan for all photos
   * 2. Assess quality with AI + traditional methods
   * 3. Move bad photos
   * 4. Auto-enhance good photos
   * 5. Organize by location/country (NEW)
   */
  async processAllPhotos(rootDirectory, options = {}) {
    const {
      useAI = true,  // Use AI quality detection
      autoEnhance = true,  // Auto-enhance good photos
      organizeByLocation = true,  // NEW: Organize by country/location
      badPhotoFolder = 'Bad_Photos',  // Subfolder for bad photos
      enhancedFolder = 'Enhanced_Photos',  // Subfolder for enhanced photos
      locationFolder = 'By_Location',  // NEW: Base folder for location organization
      onProgress = null,  // Progress callback
      aiQualityThreshold = 50,  // AI quality score threshold (0-100)
      apiKey = null  // Optional API key from request
    } = options;

    // Initialize/reinitialize AI service with provided API key
    if (apiKey) {
      console.log(`[BatchPhotoProcessingService] API key provided (length: ${apiKey.length})`);
      console.log(`[BatchPhotoProcessingService] Calling aiVisionService.setApiKey(...)`);
      const setKeyResult = this.aiVisionService.setApiKey(apiKey);
      console.log(`[BatchPhotoProcessingService] setApiKey returned: ${setKeyResult}`);
      console.log(`[BatchPhotoProcessingService] AI Vision Service enabled: ${this.aiVisionService.enabled}`);
    } else {
      console.log(`[BatchPhotoProcessingService] No API key provided from frontend`);
    }

    // Validate parameters
    if (!rootDirectory || typeof rootDirectory !== 'string') {
      throw new Error(`Invalid rootDirectory: expected string, got ${typeof rootDirectory}`);
    }
    if (!badPhotoFolder || typeof badPhotoFolder !== 'string') {
      throw new Error(`Invalid badPhotoFolder: expected string, got ${typeof badPhotoFolder}`);
    }
    if (!enhancedFolder || typeof enhancedFolder !== 'string') {
      throw new Error(`Invalid enhancedFolder: expected string, got ${typeof enhancedFolder}`);
    }
    if (!locationFolder || typeof locationFolder !== 'string') {
      throw new Error(`Invalid locationFolder: expected string, got ${typeof locationFolder}`);
    }

    this.processingStats.startTime = new Date();

    try {
      console.log(`\n${'='.repeat(70)}`);
      console.log('🚀 BATCH PHOTO PROCESSING STARTED');
      console.log(`Root Directory: ${rootDirectory}`);
      console.log(`AI Quality Assessment: ${useAI}`);
      console.log(`Auto-Enhancement: ${autoEnhance}`);
      console.log(`Location-Based Organization: ${organizeByLocation}`);
      console.log(`Quality Threshold: ${aiQualityThreshold}/100`);
      console.log(`${'='.repeat(70)}\n`);

      // Step 1: Recursively scan for all photos
      this._reportProgress('SCANNING', 'Scanning all directories for photos...', onProgress);
      const scanResult = await this.scannerService.scanDirectory(rootDirectory);
      
      if (!scanResult.success) {
        throw new Error(`Scan failed: ${scanResult.error}`);
      }

      this.processingStats.totalPhotos = scanResult.photos.length;
      console.log(`✅ Found ${scanResult.photos.length} photos`);

      if (scanResult.photos.length === 0) {
        return this._generateReport('NO_PHOTOS', 'No photos found in directory');
      }

      // Step 2: Create output folders
      this._reportProgress('PREPARING', 'Creating output folders...', onProgress);
      const badPhotosPath = path.join(rootDirectory, badPhotoFolder || 'Bad_Photos');
      const enhancedPhotosPath = path.join(rootDirectory, enhancedFolder || 'Enhanced_Photos');
      const locationBasePath = organizeByLocation ? path.join(rootDirectory, locationFolder || 'By_Location') : null;
      
      this._ensureDirectoryExists(badPhotosPath);
      if (autoEnhance) {
        this._ensureDirectoryExists(enhancedPhotosPath);
      }
      if (organizeByLocation && locationBasePath) {
        this._ensureDirectoryExists(locationBasePath);
      }

      // Step 3: Build array of photo paths and detect duplicates
      this._reportProgress('ANALYZING', 'Detecting duplicate photos...', onProgress);
      const photoPaths = scanResult.photos.map(p => p.filepath || p.path);
      const duplicateDetectionResult = await this.duplicateDetectionService.analyzeDuplicates(photoPaths);
      
      // Check for errors in duplicate detection
      if (duplicateDetectionResult.success === false) {
        console.warn(`⚠️ Duplicate detection failed: ${duplicateDetectionResult.error}`);
        console.log('Continuing without duplicate removal...');
      } else {
        console.log(`\n🔍 DUPLICATE DETECTION RESULTS:`);
        console.log(`   Total Photos: ${duplicateDetectionResult.total}`);
        console.log(`   Exact Duplicates Found: ${duplicateDetectionResult.stats.exactDuplicateGroups} groups`);
        console.log(`   Near-Duplicates Found: ${duplicateDetectionResult.stats.nearDuplicateGroups} groups`);
        console.log(`   Burst Mode Photos Found: ${duplicateDetectionResult.stats.burstModeGroups} groups`);
        console.log(`   Total Duplicates to Remove: ${duplicateDetectionResult.stats.totalPhotosToRemove}`);
        console.log(`   Photos to Keep: ${duplicateDetectionResult.stats.totalPhotosToKeep}`);
        
        // Remove duplicates (keep best quality from each group)
        if (duplicateDetectionResult.stats.totalPhotosToRemove > 0) {
        const duplicatesFolder = path.join(rootDirectory, 'Duplicates');
        this._ensureDirectoryExists(duplicatesFolder);
        
        console.log(`\n🗑️ REMOVING DUPLICATES...`);
        let removedCount = 0;
        
        // Process all duplicate groups
        if (duplicateDetectionResult.duplicateGroups && duplicateDetectionResult.duplicateGroups.length > 0) {
          for (const group of duplicateDetectionResult.duplicateGroups) {
            // Move duplicate photos to Duplicates folder
            // Handle different group structures (files array or remove array)
            const photosToRemove = group.remove || (group.files && group.files.slice(1)) || [];
            
            if (photosToRemove && photosToRemove.length > 0) {
              for (const duplicatePhoto of photosToRemove) {
                try {
                  const photoPath = duplicatePhoto.path || duplicatePhoto;
                  const dupDestination = path.join(duplicatesFolder, path.basename(photoPath));
                  await fs.rename(photoPath, dupDestination);
                  removedCount++;
                  console.log(`   ✓ Moved duplicate: ${path.basename(photoPath)}`);
                } catch (error) {
                  console.warn(`   ⚠️ Failed to move duplicate: ${error.message}`);
                }
              }
            }
          }
        }
        
        console.log(`   Total duplicates moved to Duplicates folder: ${removedCount}`);
        this.processingStats.duplicatesRemoved = removedCount;
        
        // Update photo list to exclude duplicates - keep only photos that are either:
        // 1. NOT in any duplicate group, OR
        // 2. Are the "keep" photo in a duplicate group
        const duplicatePhotosToRemove = new Set();
        const keepPhotoPaths = new Set();
        
        // Collect all duplicate photos and mark ones to remove
        for (const group of duplicateDetectionResult.duplicateGroups) {
          if (group.keep && group.keep.path) {
            keepPhotoPaths.add(group.keep.path);
          }
          if (group.remove && Array.isArray(group.remove)) {
            for (const removePhoto of group.remove) {
              duplicatePhotosToRemove.add(removePhoto.path);
            }
          }
          // Also handle files array (from exact duplicates)
          if (group.files && Array.isArray(group.files)) {
            for (let i = 1; i < group.files.length; i++) {
              duplicatePhotosToRemove.add(group.files[i].path);
            }
            if (group.files.length > 0) {
              keepPhotoPaths.add(group.files[0].path);
            }
          }
        }
        
        // Filter to keep only non-duplicate photos
        scanResult.photos = scanResult.photos.filter(p => {
          const photoPath = p.filepath || p.path;
          return !duplicatePhotosToRemove.has(photoPath);
        });
        
        this.processingStats.totalPhotos = scanResult.photos.length;
        console.log(`\n✅ Continuing with ${scanResult.photos.length} unique photos after duplicate removal\n`);
        }
      }

      // Step 4: Process each remaining photo
      this._reportProgress('ANALYZING', 'Analyzing photo quality...', onProgress);
      
      for (let i = 0; i < scanResult.photos.length; i++) {
        const photoPath = scanResult.photos[i].filepath || scanResult.photos[i].path;  // Handle both property names
        if (!photoPath) {
          console.warn(`⚠️ Photo ${i} missing filepath, skipping`);
          continue;
        }
        const progress = `Photo ${i + 1}/${scanResult.photos.length}: ${path.basename(photoPath)}`;
        this._reportProgress('ANALYZING', progress, onProgress);

        try {
          await this._processPhoto(
            photoPath,
            rootDirectory,
            badPhotosPath,
            enhancedPhotosPath,
            locationBasePath,
            useAI,
            autoEnhance,
            organizeByLocation,
            aiQualityThreshold,
            onProgress,
            photoPaths
          );
        } catch (error) {
          console.error(`❌ Error processing ${photoPath}: ${error.message}`);
          this.processingStats.errors++;
          this.processedPhotos.errors.push({
            path: photoPath,
            error: error.message
          });
        }
      }

      this.processingStats.endTime = new Date();

      return this._generateReport('SUCCESS', 'Batch processing completed');

    } catch (error) {
      console.error(`\n❌ BATCH PROCESSING FAILED: ${error.message}`);
      console.error('Stack trace:', error.stack);
      this.processingStats.endTime = new Date();
      return this._generateReport('ERROR', error.message);
    }
  }

  /**
   * Process a single photo: assess quality and take action
   */
  async _processPhoto(
    photoPath,
    rootDirectory,
    badPhotosPath,
    enhancedPhotosPath,
    locationBasePath,
    useAI,
    autoEnhance,
    organizeByLocation,
    aiQualityThreshold,
    onProgress,
    allPhotos
  ) {
    // Step 1: Assess quality using multiple methods
    const qualityAssessment = await this._assessPhotoQuality(
      photoPath,
      useAI,
      aiQualityThreshold
    );

    console.log(`\n📸 ${path.basename(photoPath)}`);
    console.log(`   Quality Score: ${qualityAssessment.score.toFixed(2)}/100`);
    console.log(`   Assessment: ${qualityAssessment.isBad ? '❌ BAD' : '✅ GOOD'}`);

    // Determine reason for decision
    let reason = '';
    if (qualityAssessment.isBad) {
      reason = `Photo quality score (${qualityAssessment.score.toFixed(1)}/100) is below threshold (${aiQualityThreshold}).`;
      if (qualityAssessment.issues && qualityAssessment.issues.length > 0) {
        const criticalIssues = qualityAssessment.issues.filter(i => i.severity === 'Critical' || i.severity === 'Severe');
        if (criticalIssues.length > 0) {
          reason += ` Issues: ${criticalIssues.map(i => i.type).join(', ')}`;
        }
      }
    } else {
      reason = `Photo quality score (${qualityAssessment.score.toFixed(1)}/100) meets quality standards. Enhanced and saved.`;
    }

    // Get remaining photos queue
    const currentIndex = allPhotos.indexOf(photoPath);
    const remainingPhotos = currentIndex >= 0 ? allPhotos.slice(currentIndex + 1) : [];
    const processedPhotos = currentIndex >= 0 ? allPhotos.slice(0, currentIndex) : [];

    // Create base64 preview if possible (for small images)
    let previewImage = null;
    try {
      const stats = await fs.stat(photoPath);
      if (stats.size < 5000000) { // Only preview files < 5MB
        const imageData = await fs.readFile(photoPath);
        const ext = path.extname(photoPath).toLowerCase().slice(1);
        const mimeType = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp'
        }[ext] || 'image/jpeg';
        previewImage = `data:${mimeType};base64,${imageData.toString('base64')}`;
      }
    } catch (e) {
      // Preview creation failed, continue without it
    }

    // Send detailed progress update
    if (onProgress) {
      onProgress({
        phase: 'PROCESSING',
        message: `Analyzing ${path.basename(photoPath)}...`,
        currentFile: path.basename(photoPath),
        currentPhotoPreview: previewImage,
        currentAnalysis: {
          score: qualityAssessment.score,
          isBad: qualityAssessment.isBad,
          reason: reason,
          issues: qualityAssessment.issues,
          enhancement: {
            status: 'pending',
            message: 'Awaiting enhancement...'
          }
        },
        processedCount: processedPhotos.length,
        totalPhotos: allPhotos.length,
        queuedPhotos: remainingPhotos.map(p => path.basename(p)),
        processedPhotos: processedPhotos.map(p => path.basename(p))
      });
    }

    if (qualityAssessment.isBad) {
      // Step 2: Move bad photos
      console.log(`   Action: Moving to Bad Photos folder...`);
      await this._moveBadPhoto(photoPath, badPhotosPath);
      this.processingStats.badPhotos++;
      this.processingStats.moved++;
      
      this.processedPhotos.bad.push({
        path: photoPath,
        score: qualityAssessment.score,
        issues: qualityAssessment.issues,
        movedTo: path.join(badPhotosPath, path.basename(photoPath))
      });
    } else {
      // Step 3: Auto-enhance good photos
      let enhancementStatus = 'skipped';
      let enhancementMessage = 'Enhancement disabled';
      let enhancedPath = null;
      let appliedEnhancements = [];
      
      if (autoEnhance) {
        try {
          const result = await this._autoEnhancePhoto(photoPath, enhancedPhotosPath);
          this.processingStats.enhanced++;
          enhancementStatus = 'success';
          enhancementMessage = '✨ Photo enhanced and saved';
          enhancedPath = result.enhancedPath;
          appliedEnhancements = result.appliedEnhancements || [];
          
          console.log(`   ✨ ${enhancementMessage}`);
          if (appliedEnhancements && appliedEnhancements.length > 0) {
            appliedEnhancements.forEach(enhancement => {
              console.log(`      • ${enhancement}`);
            });
          }
        } catch (error) {
          enhancementStatus = 'failed';
          enhancementMessage = `Enhancement failed: ${error.message}`;
          console.warn(`   ⚠️ ${enhancementMessage}`);
        }
        
        // Broadcast enhancement update
        if (onProgress) {
          onProgress({
            phase: 'PROCESSING',
            message: enhancementMessage,
            currentFile: path.basename(photoPath),
            currentPhotoPreview: previewImage,
            currentAnalysis: {
              score: qualityAssessment.score,
              isBad: qualityAssessment.isBad,
              reason: reason,
              issues: qualityAssessment.issues,
              enhancement: {
                status: enhancementStatus,
                message: enhancementMessage,
                enhancedPath: enhancedPath,
                appliedEnhancements: appliedEnhancements
              }
            },
            processedCount: processedPhotos.length,
            totalPhotos: allPhotos.length,
            queuedPhotos: remainingPhotos.map(p => path.basename(p)),
            processedPhotos: processedPhotos.map(p => path.basename(p))
          });
        }
      }

      // Step 4: Organize by location (NEW)
      if (organizeByLocation) {
        console.log(`   Action: Organizing by location...`);
        try {
          await this._organizePhotoByLocation(photoPath, locationBasePath);
          this.processingStats.organizedByLocation++;
        } catch (error) {
          console.warn(`   ⚠️ Location organization skipped: ${error.message}`);
        }
      }

      this.processingStats.goodPhotos++;
      this.processedPhotos.good.push({
        path: photoPath,
        score: qualityAssessment.score,
        enhanced: enhancementStatus === 'success',
        enhancedPath: enhancedPath,
        enhancementStatus: enhancementStatus,
        appliedEnhancements: appliedEnhancements
      });
    }
  }

  /**
   * Assess photo quality using both traditional and AI methods
   */
  async _assessPhotoQuality(photoPath, useAI, aiQualityThreshold) {
    // Method 1: Traditional bad photo detection (blurry, closed eyes, etc.)
    const traditionalDetection = await this.badPhotoDetectionService.analyzePhoto(photoPath);
    const traditionalScore = this._calculateTraditionalScore(traditionalDetection);

    let finalScore = traditionalScore;
    let issues = traditionalDetection.issues || [];

    // Method 2: AI Quality Assessment (if enabled)
    if (useAI && process.env.OPENAI_API_KEY) {
      try {
        const aiQuality = await this.aiVisionService.assessQuality(photoPath);
        const aiScore = parseFloat(aiQuality.qualityScore);
        
        // Combine scores: 60% traditional, 40% AI for balanced assessment
        finalScore = (traditionalScore * 0.6) + (aiScore * 0.4);
        
        console.log(`   Traditional Score: ${traditionalScore.toFixed(2)}, AI Score: ${aiScore.toFixed(2)}, Combined: ${finalScore.toFixed(2)}`);
      } catch (error) {
        console.warn(`   ⚠️ AI assessment skipped: ${error.message}`);
        console.log(`   Using traditional score only: ${finalScore.toFixed(2)}`);
      }
    }

    return {
      score: finalScore,
      isBad: finalScore < aiQualityThreshold,  // ONLY based on final combined score vs threshold
      issues: issues,
      threshold: aiQualityThreshold
    };
  }

  /**
   * Calculate quality score from traditional detection results (0-100)
   */
  _calculateTraditionalScore(detection) {
    let score = 85; // Start with good score

    if (!detection.detections) {
      return score;
    }

    const weights = {
      blur: { weight: 25, factor: 1.0 },
      closedEyes: { weight: 20, factor: 0.9 },
      distorted: { weight: 15, factor: 0.8 },
      accidental: { weight: 15, factor: 0.95 },
      lowResolution: { weight: 15, factor: 0.85 },
      duplicate: { weight: 10, factor: 0.7 }
    };

    // Apply penalties for each detected issue
    Object.entries(detection.detections).forEach(([key, detection_result]) => {
      if (detection_result && detection_result.isBad && weights[key]) {
        const penalty = weights[key].weight * weights[key].factor;
        score -= penalty;
      }
    });

    // Add penalties for issues array
    if (detection.issues && Array.isArray(detection.issues)) {
      detection.issues.forEach(issue => {
        const severityPenalty = {
          'Critical': 25,
          'Severe': 20,
          'Moderate': 10,
          'Minor': 5
        };
        score -= (severityPenalty[issue.severity] || 5);
      });
    }

    return Math.max(0, Math.min(100, score)); // Clamp between 0-100
  }

  /**
   * Move bad photo to designated folder, preserving directory structure
   */
  async _moveBadPhoto(photoPath, badPhotosPath) {
    const filename = path.basename(photoPath);
    const destination = path.join(badPhotosPath, filename);

    // Ensure destination directory exists
    this._ensureDirectoryExists(path.dirname(destination));

    // Handle duplicate filenames
    let finalDestination = destination;
    let counter = 1;
    while (existsSync(finalDestination)) {
      const ext = path.extname(filename);
      const name = path.basename(filename, ext);
      finalDestination = path.join(badPhotosPath, `${name}_${counter}${ext}`);
      counter++;
    }

    await fs.rename(photoPath, finalDestination);
    console.log(`   ✅ Moved to: ${path.relative(path.dirname(badPhotosPath), finalDestination)}`);
  }

  /**
   * Auto-enhance good photo and save to enhanced folder
   */
  async _autoEnhancePhoto(photoPath, enhancedPhotosPath) {
    const filename = path.basename(photoPath);
    const destination = path.join(enhancedPhotosPath, filename);

    // Ensure destination directory exists
    this._ensureDirectoryExists(path.dirname(destination));

    // Enhance the photo (autoEnhance saves the file internally and returns an object)
    const result = await this.autoEnhancementService.autoEnhance(photoPath);

    // The enhanced photo is already saved by autoEnhance, just verify it was created
    if (result.success && result.enhancedPath) {
      // Copy the enhanced photo to our destination folder
      await fs.copyFile(result.enhancedPath, destination);
      
      return {
        success: true,
        originalPath: photoPath,
        enhancedPath: destination,
        photoType: result.photoType,
        appliedEnhancements: result.appliedEnhancements || []
      };
    } else {
      throw new Error('Enhancement service did not produce a valid result');
    }
  }

  /**
   * Organize good photo by location/country
   * Creates folder structure: By_Location/Country/City/
   */
  async _organizePhotoByLocation(photoPath, locationBasePath) {
    try {
      // Extract GPS coordinates from EXIF
      const gpsData = await this._extractGPS(photoPath);
      
      if (!gpsData) {
        console.log(`   ℹ️ No GPS data found - skipping location organization`);
        return;
      }

      const { latitude, longitude } = gpsData;

      // Reverse geocode to get location information
      const location = await this.geocodingService.reverseGeocode(latitude, longitude);
      
      // Create folder structure: Country/City/
      const countryFolder = path.join(locationBasePath, location.country || 'Unknown');
      const cityFolder = path.join(countryFolder, location.city || 'Unknown');
      
      this._ensureDirectoryExists(cityFolder);

      // Copy photo to location folder
      const filename = path.basename(photoPath);
      const destination = path.join(cityFolder, filename);

      // Handle duplicate filenames
      let finalDestination = destination;
      let counter = 1;
      while (existsSync(finalDestination)) {
        const ext = path.extname(filename);
        const name = path.basename(filename, ext);
        finalDestination = path.join(cityFolder, `${name}_${counter}${ext}`);
        counter++;
      }

      // Copy (not move) to location folder to preserve originals
      const fileContent = await fs.readFile(photoPath);
      await fs.writeFile(finalDestination, fileContent);

      console.log(`   🌍 Organized to: ${location.country}/${location.city}`);

      // Track location organization
      const locationKey = `${location.country}/${location.city}`;
      if (!this.processedPhotos.byLocation[locationKey]) {
        this.processedPhotos.byLocation[locationKey] = [];
      }
      this.processedPhotos.byLocation[locationKey].push({
        filename: filename,
        path: finalDestination,
        coordinates: { latitude, longitude }
      });

    } catch (error) {
      console.warn(`   ⚠️ Location organization error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract GPS coordinates from photo EXIF data
   */
  async _extractGPS(photoPath) {
    try {
      const buffer = await fs.readFile(photoPath);
      const parser = new ExifParser(buffer);
      const result = parser.parse();

      if (result.tags && result.tags.GPSLatitude && result.tags.GPSLongitude) {
        return {
          latitude: result.tags.GPSLatitude,
          longitude: result.tags.GPSLongitude
        };
      }

      return null;
    } catch (error) {
      // File might not have EXIF data
      return null;
    }
  }

  /**
   * Ensure directory exists, create if not
   */
  _ensureDirectoryExists(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') {
      console.warn(`⚠️ Invalid directory path: ${dirPath} (type: ${typeof dirPath})`);
      return;
    }
    try {
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      console.error(`❌ Failed to create directory ${dirPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Report progress to callback
   */
  _reportProgress(stage, message, callback) {
    const progressData = {
      stage: stage,
      message: message,
      stats: this.processingStats,
      timestamp: new Date().toISOString()
    };

    console.log(`[${stage}] ${message}`);

    if (callback && typeof callback === 'function') {
      callback(progressData);
    }
  }

  /**
   * Generate comprehensive report
   */
  _generateReport(status, message) {
    const duration = this.processingStats.endTime 
      ? Math.round((this.processingStats.endTime - this.processingStats.startTime) / 1000)
      : 0;

    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 BATCH PROCESSING REPORT');
    console.log(`${'='.repeat(70)}`);
    console.log(`Status: ${status === 'SUCCESS' ? '✅ SUCCESS' : '❌ ' + status}`);
    console.log(`Message: ${message}`);
    console.log(`\n📈 Statistics:`);
    console.log(`   Total Photos Scanned: ${this.processingStats.totalPhotos}`);
    console.log(`   Duplicates Removed: ${this.processingStats.duplicatesRemoved || 0} 🔄`);
    console.log(`   Good Photos: ${this.processingStats.goodPhotos} ✅`);
    console.log(`   Bad Photos: ${this.processingStats.badPhotos} ❌`);
    console.log(`   Photos Moved: ${this.processingStats.moved}`);
    console.log(`   Photos Enhanced: ${this.processingStats.enhanced}`);
    console.log(`   Photos Organized by Location: ${this.processingStats.organizedByLocation} 🌍`);
    console.log(`   Processing Errors: ${this.processingStats.errors}`);
    console.log(`   Duration: ${duration} seconds`);
    console.log(`   Speed: ${duration > 0 ? (this.processingStats.totalPhotos / duration).toFixed(2) : 0} photos/sec`);
    
    // Show location breakdown
    if (Object.keys(this.processedPhotos.byLocation).length > 0) {
      console.log(`\n🌍 Location Breakdown:`);
      Object.entries(this.processedPhotos.byLocation).forEach(([location, photos]) => {
        console.log(`   ${location}: ${photos.length} photo(s)`);
      });
    }
    
    console.log(`${'='.repeat(70)}\n`);

    return {
      status,
      message,
      stats: this.processingStats,
      processed: this.processedPhotos,
      duration: `${duration}s`
    };
  }

  /**
   * Get processing status
   */
  getStatus() {
    return {
      stats: this.processingStats,
      processed: this.processedPhotos
    };
  }

  /**
   * Clear stats and cache
   */
  reset() {
    this.processingStats = {
      totalPhotos: 0,
      goodPhotos: 0,
      badPhotos: 0,
      enhanced: 0,
      moved: 0,
      errors: 0,
      organizedByLocation: 0,
      duplicatesRemoved: 0,
      startTime: null,
      endTime: null
    };

    this.processedPhotos = {
      good: [],
      bad: [],
      byLocation: {},
      errors: []
    };

    // Clear service caches
    this.aiVisionService.clearCache();
    this.badPhotoDetectionService.detectionCache.clear();
  }
}

export default BatchPhotoProcessingService;
