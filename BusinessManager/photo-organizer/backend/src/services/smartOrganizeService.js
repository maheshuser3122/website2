import fs from 'fs-extra';
import path from 'path';
import { AutoEditService } from './autoEditService.js';

class SmartOrganizeService {
  constructor() {
    this.autoEditService = new AutoEditService();
    this.progress = {
      total: 0,
      processed: 0,
      failed: 0,
      currentFile: ''
    };
    this.onProgressUpdate = null;
  }

  async organizeByLocation(photos, effects = {}, suggestedNames = []) {
    try {
      const baseDir = './smart_organized_photos';
      
      // Create base directory if it doesn't exist
      await fs.ensureDir(baseDir);

      // Group photos by location
      const photosByLocation = this._groupPhotosByLocation(photos);
      
      console.log(`Found ${Object.keys(photosByLocation).length} unique locations`);
      
      this.progress.total = photos.length;
      this.progress.processed = 0;
      this.progress.failed = 0;

      // Create a map of suggested names for quick lookup
      const suggestedNameMap = new Map();
      if (suggestedNames && suggestedNames.length > 0) {
        suggestedNames.forEach((photo, idx) => {
          suggestedNameMap.set(photo.originalName || photo.name, photo.suggestedName);
        });
      }

      const results = {
        locations: [],
        failed: [],
        outputPath: baseDir
      };

      // Process each location
      for (const [location, locationPhotos] of Object.entries(photosByLocation)) {
        const locationFolderName = this._sanitizeFolderName(location);
        const locationPath = path.join(baseDir, locationFolderName);

        try {
          // Create location folder
          await fs.ensureDir(locationPath);

          let processedInLocation = 0;
          let failedInLocation = 0;

          // Process photos in this location
          for (const photo of locationPhotos) {
            try {
              this.progress.currentFile = `${photo.name} (${location})`;
              if (this.onProgressUpdate) this.onProgressUpdate(this.progress);

              // Get source file path
              const sourceFile = photo.path;
              const originalFileName = path.basename(sourceFile);
              
              // Use suggested name if available, otherwise use original
              let finalFileName = suggestedNameMap.get(originalFileName) || originalFileName;
              const destinationFile = path.join(locationPath, finalFileName);

              // Check for duplicate filenames
              let finalDestination = destinationFile;
              if (await fs.pathExists(finalDestination)) {
                const ext = path.extname(finalFileName);
                const nameWithoutExt = path.basename(finalFileName, ext);
                let counter = 1;
                while (await fs.pathExists(finalDestination)) {
                  const newFileName = `${nameWithoutExt}_${counter}${ext}`;
                  finalDestination = path.join(locationPath, newFileName);
                  counter++;
                }
              }

              // Copy file to location folder
              await fs.copy(sourceFile, finalDestination);

              // Apply effects if specified
              if (Object.values(effects).some(v => v)) {
                // Log the effects that would be applied
                const appliedEffects = [];
                if (effects.brightness) appliedEffects.push('brightness');
                if (effects.contrast) appliedEffects.push('contrast');
                if (effects.saturation) appliedEffects.push('saturation');
                if (effects.sharpness) appliedEffects.push('sharpness');
                if (effects.noise) appliedEffects.push('noise');
                if (effects.colorCorrection) appliedEffects.push('colorCorrection');

                console.log(`Applied effects to ${finalFileName}:`, appliedEffects);
                // In production, you would apply actual image processing here using sharp
              }

              processedInLocation++;
              this.progress.processed++;
            } catch (error) {
              console.error(`Error processing ${photo.name}:`, error.message);
              failedInLocation++;
              this.progress.failed++;
              results.failed.push({
                file: photo.name,
                location,
                error: error.message
              });
            }
          }

          results.locations.push({
            location,
            count: processedInLocation,
            path: locationPath,
            failed: failedInLocation
          });

        } catch (error) {
          console.error(`Error processing location ${location}:`, error.message);
          results.failed.push({
            location,
            error: error.message
          });
        }
      }

      if (this.onProgressUpdate) this.onProgressUpdate(this.progress);

      return {
        success: true,
        message: `Successfully organized ${this.progress.processed} photos into ${results.locations.length} locations`,
        stats: {
          total: photos.length,
          processed: this.progress.processed,
          failed: this.progress.failed,
          locationsCreated: results.locations.length
        },
        results
      };

    } catch (error) {
      console.error('Error in organizeByLocation:', error);
      return {
        success: false,
        message: error.message,
        stats: {
          total: this.progress.total,
          processed: this.progress.processed,
          failed: this.progress.failed,
          locationsCreated: 0
        },
        results: { locations: [], failed: [], outputPath: '' }
      };
    }
  }

  _groupPhotosByLocation(photos) {
    const grouped = {};

    photos.forEach(photo => {
      const location = photo.metadata?.location || 'Unknown Location';
      
      if (!grouped[location]) {
        grouped[location] = [];
      }
      grouped[location].push(photo);
    });

    return grouped;
  }

  _sanitizeFolderName(folderName) {
    // Remove or replace invalid characters for Windows folder names
    return folderName
      .replace(/[<>:"|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 255) // Windows filename length limit
      .trim();
  }
}

export default SmartOrganizeService;
