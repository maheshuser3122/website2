// Photo Organization Service
// Handles organizing and exporting photos

import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export class OrganizationService {
  constructor() {
    this.progress = { total: 0, processed: 0, failed: 0 };
  }

  async organizePhotos(photos, outputDir, organizationScheme = 'country/city/year') {
    this.progress = { total: photos.length, processed: 0, failed: 0 };

    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });

      const results = {
        organized: [],
        failed: [],
        stats: {}
      };

      for (const photo of photos) {
        try {
          const destPath = this._getOrganizedPath(photo, outputDir, organizationScheme);
          await this._copyFile(photo.filepath, destPath);
          
          results.organized.push({
            source: photo.filepath,
            destination: destPath
          });
          this.progress.processed++;
        } catch (error) {
          console.error(`Failed to organize ${photo.filename}:`, error.message);
          results.failed.push({
            filename: photo.filename,
            error: error.message
          });
          this.progress.failed++;
        }
      }

      results.stats = {
        total: photos.length,
        organized: results.organized.length,
        failed: results.failed.length,
        percentage: Math.round((results.organized.length / photos.length) * 100)
      };

      return results;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stats: this.progress
      };
    }
  }

  _getOrganizedPath(photo, outputDir, scheme) {
    let folderPath = outputDir;

    if (photo.gps && photo.location) {
      const { country, city } = photo.location;
      folderPath = path.join(folderPath, country || 'Unknown');
      
      if (city) {
        folderPath = path.join(folderPath, city);
      }
    }

    if (photo.dateTime) {
      const year = new Date(photo.dateTime).getFullYear();
      folderPath = path.join(folderPath, year.toString());
    }

    const filename = path.basename(photo.filepath);
    return path.join(folderPath, filename);
  }

  async _copyFile(source, destination) {
    // Create destination directory if it doesn't exist
    const dir = path.dirname(destination);
    await fs.mkdir(dir, { recursive: true });

    // Read from source and write to destination
    return new Promise((resolve, reject) => {
      const readStream = createReadStream(source);
      const writeStream = createWriteStream(destination);

      pipeline(readStream, writeStream)
        .then(() => resolve())
        .catch(reject);
    });
  }

  async createPhotoIndex(photos, outputDir) {
    try {
      const index = {
        generated: new Date().toISOString(),
        totalPhotos: photos.length,
        groups: this._groupPhotosByLocation(photos)
      };

      const indexPath = path.join(outputDir, 'index.json');
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

      return {
        success: true,
        indexPath,
        groups: index.groups
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  _groupPhotosByLocation(photos) {
    const groups = {};

    photos.forEach(photo => {
      if (photo.location) {
        const key = `${photo.location.country}/${photo.location.city}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(photo.filename);
      }
    });

    return groups;
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

export default OrganizationService;
