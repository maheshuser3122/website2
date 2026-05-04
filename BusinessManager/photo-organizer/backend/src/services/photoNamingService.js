class PhotoNamingService {
  /**
   * Generate intelligent names for photos based on metadata
   * Format: [Location]_[Date]_[Time]_[Camera]_[Index]
   */
  generateSmartName(photo, index = 0) {
    const parts = [];

    // Location part
    if (photo.metadata?.location) {
      const locationParts = photo.metadata.location.split(',');
      const city = locationParts[0]?.trim() || 'Unknown';
      parts.push(this._sanitizeName(city));
    }

    // Date part (YYYYMMDD format)
    if (photo.metadata?.dateTime) {
      const date = new Date(photo.metadata.dateTime);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        parts.push(`${year}${month}${day}`);

        // Time part (HHMMSS format)
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        parts.push(`${hours}${minutes}${seconds}`);
      }
    }

    // Camera model part
    if (photo.metadata?.exif?.Model) {
      const cameraModel = photo.metadata.exif.Model
        .replace(/Canon\s+/i, '')
        .replace(/\s+/g, '')
        .substring(0, 10);
      parts.push(cameraModel);
    }

    // Index for uniqueness
    if (index > 0) {
      parts.push(String(index).padStart(3, '0'));
    }

    return parts.length > 0 ? parts.join('_') : `Photo_${Date.now()}`;
  }

  /**
   * Generate a description for the photo based on metadata
   */
  generateDescription(photo) {
    const descriptions = [];

    // Location description
    if (photo.metadata?.location) {
      descriptions.push(`📍 Location: ${photo.metadata.location}`);
    }

    // Date/Time description
    if (photo.metadata?.dateTime) {
      const date = new Date(photo.metadata.dateTime);
      if (!isNaN(date.getTime())) {
        descriptions.push(`📅 Date: ${date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`);
        descriptions.push(`🕐 Time: ${date.toLocaleTimeString('en-US')}`);
      }
    }

    // Camera description
    if (photo.metadata?.exif?.Model) {
      descriptions.push(`📷 Camera: ${photo.metadata.exif.Model}`);
    }

    // GPS coordinates
    if (photo.metadata?.exif?.GPSLatitude && photo.metadata?.exif?.GPSLongitude) {
      descriptions.push(`🗺️ GPS: ${photo.metadata.exif.GPSLatitude}, ${photo.metadata.exif.GPSLongitude}`);
    }

    // Exposure settings
    const exposure = [];
    if (photo.metadata?.exif?.ExposureTime) {
      exposure.push(`1/${photo.metadata.exif.ExposureTime}s`);
    }
    if (photo.metadata?.exif?.FNumber) {
      exposure.push(`f/${photo.metadata.exif.FNumber}`);
    }
    if (photo.metadata?.exif?.ISOSpeedRatings) {
      exposure.push(`ISO ${photo.metadata.exif.ISOSpeedRatings}`);
    }
    if (exposure.length > 0) {
      descriptions.push(`⚙️ Settings: ${exposure.join(', ')}`);
    }

    return descriptions;
  }

  /**
   * Generate names for multiple photos with duplicate handling
   */
  generateNamesForPhotos(photos) {
    const namedPhotos = [];
    const nameMap = new Map();

    photos.forEach((photo, idx) => {
      let baseName = this.generateSmartName(photo);
      let finalName = baseName;
      let counter = 1;

      // Handle duplicates
      while (nameMap.has(finalName)) {
        finalName = `${baseName}_${counter}`;
        counter++;
      }

      nameMap.set(finalName, true);
      const ext = photo.name.split('.').pop();

      namedPhotos.push({
        ...photo,
        suggestedName: `${finalName}.${ext}`,
        originalName: photo.name,
        descriptions: this.generateDescription(photo),
        index: idx
      });
    });

    return namedPhotos;
  }

  _sanitizeName(name) {
    return name
      .replace(/[<>:"|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
      .trim();
  }
}

export default PhotoNamingService;
