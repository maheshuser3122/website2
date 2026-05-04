import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ExifParser from 'exif-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supported image formats
// Common formats: JPG, PNG, GIF, BMP, WebP, TIFF
// RAW formats: RAW, CR2 (Canon), NEF (Nikon), DNG (Adobe), ARW (Sony), ORF (Olympus)
// Mobile formats: HEIC (iPhone), HEIF (iPhone), XCF (Gimp)
const IMAGE_EXTENSIONS = [
  // Common formats
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif',
  // RAW formats (DSLR/Mirrorless)
  '.raw', '.cr2', '.nef', '.dng', '.arw', '.orf', '.rw2', '.x3f',
  // Mobile formats
  '.heic', '.heif',
  // Video formats (often contain thumbnails)
  '.mp4', '.mov', '.mkv', '.avi', '.webm'
];

export class ScannerService {
  constructor() {
    this.scannedPhotos = [];
    this.progress = {
      total: 0,
      processed: 0,
      failed: 0,
      currentFile: ''
    };
    this.onProgressUpdate = null;
  }

  // Recursively scan directory for image files
  async scanDirectory(dirPath) {
    this.scannedPhotos = [];
    this.progress = { total: 0, processed: 0, failed: 0, currentFile: '' };

    try {
      console.log(`[Scanner] Starting scan of: ${dirPath}`);
      await this._recursiveScan(dirPath);
      console.log(`[Scanner] Completed scan. Found ${this.scannedPhotos.length} photos`);
      return {
        success: true,
        photos: this.scannedPhotos,
        stats: {
          total: this.scannedPhotos.length,
          processed: this.progress.processed,
          failed: this.progress.failed
        }
      };
    } catch (error) {
      console.error(`[Scanner] Scan error:`, error);
      return {
        success: false,
        error: error.message,
        photos: this.scannedPhotos,
        stats: this.progress
      };
    }
  }

  async _recursiveScan(dirPath) {
    try {
      console.log(`[Scanner] Scanning directory: ${dirPath}`);
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      console.log(`[Scanner] Found ${entries.length} entries in ${dirPath}`);
      
      const imageFiles = entries.filter(e => this._isImageFile(e.name));
      console.log(`[Scanner] Found ${imageFiles.length} image files in ${dirPath}`);
      this.progress.total += imageFiles.length;
      
      if (this.onProgressUpdate) {
        this.onProgressUpdate({ ...this.progress, status: 'scanning' });
      }

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this._recursiveScan(fullPath);
        } else if (this._isImageFile(entry.name)) {
          this.progress.currentFile = fullPath;
          console.log(`[Scanner] Processing image: ${fullPath}`);
          
          if (this.onProgressUpdate) {
            this.onProgressUpdate({ ...this.progress, status: 'scanning' });
          }
          
          try {
            const photoData = await this._extractPhotoMetadata(fullPath);
            this.scannedPhotos.push(photoData);
            this.progress.processed++;
            
            if (this.onProgressUpdate) {
              this.onProgressUpdate({ ...this.progress, status: 'scanning' });
            }
          } catch (error) {
            console.error(`Failed to process ${fullPath}:`, error.message);
            this.progress.failed++;
            
            if (this.onProgressUpdate) {
              this.onProgressUpdate({ ...this.progress, status: 'scanning' });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  _isImageFile(filename) {
    return IMAGE_EXTENSIONS.includes(path.extname(filename).toLowerCase());
  }

  async _extractPhotoMetadata(filePath) {
    try {
      const stats = await fs.stat(filePath);
      let exifData = { gps: null, dateTime: null, camera: null };

      // Try to extract EXIF data
      try {
        const buffer = await fs.readFile(filePath);
        const parser = new ExifParser.create(buffer);
        const result = parser.parse();
        exifData = this._parseExifData(result.tags);
      } catch (error) {
        // Continue without EXIF data if extraction fails
        console.warn(`No EXIF data for ${filePath}`);
      }

      return {
        id: this._generateId(),
        filename: path.basename(filePath),
        filepath: filePath,
        filesize: stats.size,
        modified: stats.mtime,
        ...exifData
      };
    } catch (error) {
      throw error;
    }
  }

  _parseExifData(tags) {
    const data = {
      gps: null,
      dateTime: null,
      camera: null
    };

    // Try multiple GPS tag names (different cameras use different formats)
    // Standard EXIF tags: GPSLatitude, GPSLongitude
    // Some cameras: GPSInfo, GPSCoordinates
    if (tags.GPSLatitude && tags.GPSLongitude) {
      const lat = this._parseGPSCoordinate(tags.GPSLatitude, tags.GPSLatitudeRef);
      const lon = this._parseGPSCoordinate(tags.GPSLongitude, tags.GPSLongitudeRef);
      
      if (lat !== null && lon !== null) {
        data.gps = {
          latitude: lat,
          longitude: lon,
          altitude: tags.GPSAltitude || null
        };
      }
    }

    // Fallback: check for alternative GPS tag formats
    if (!data.gps && tags.GPSInfo) {
      try {
        if (typeof tags.GPSInfo === 'object') {
          const lat = tags.GPSInfo.latitude || tags.GPSInfo.Latitude;
          const lon = tags.GPSInfo.longitude || tags.GPSInfo.Longitude;
          if (lat && lon) {
            data.gps = {
              latitude: lat,
              longitude: lon,
              altitude: tags.GPSInfo.altitude || null
            };
          }
        }
      } catch (e) {
        // Continue if parsing fails
      }
    }

    if (tags.DateTime || tags.DateTimeOriginal || tags.DateTimeDigitized) {
      const dateStr = tags.DateTime || tags.DateTimeOriginal || tags.DateTimeDigitized;
      try {
        data.dateTime = new Date(dateStr);
      } catch (e) {
        console.warn(`Could not parse date: ${dateStr}`);
      }
    }

    if (tags.Model || tags.model) {
      data.camera = {
        model: tags.Model || tags.model,
        make: tags.Make || tags.make || null,
        lensModel: tags.LensModel || tags.lensModel || null
      };
    }

    return data;
  }

  // Helper to parse GPS coordinate from various formats
  _parseGPSCoordinate(coordinate, ref) {
    if (!coordinate) return null;
    
    let value = coordinate;
    
    // Handle array format [degrees, minutes, seconds]
    if (Array.isArray(coordinate) && coordinate.length >= 2) {
      value = coordinate[0] + (coordinate[1] || 0) / 60 + (coordinate[2] || 0) / 3600;
    }
    
    // Apply reference direction (S/W are negative)
    if (ref && (ref === 'S' || ref === 'W')) {
      value = -Math.abs(value);
    }
    
    return typeof value === 'number' ? value : parseFloat(value);
  }

  _generateId() {
    return 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getProgress() {
    return {
      ...this.progress,
      percentage: this.progress.total > 0 
        ? Math.round((this.progress.processed / this.progress.total) * 100)
        : 0
    };
  }
}

export default ScannerService;
