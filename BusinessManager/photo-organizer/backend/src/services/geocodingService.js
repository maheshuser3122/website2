// Reverse Geocoding Service
// Converts GPS coordinates to human-readable locations

export class GeocodingService {
  constructor() {
    this.cache = new Map();
    this.apiBaseUrl = 'https://nominatim.openstreetmap.org';
  }

  async reverseGeocode(latitude, longitude) {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PhotoOrganizer/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      const location = this._parseLocation(data);
      
      // Cache the result
      this.cache.set(cacheKey, location);
      
      return location;
    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        country: 'Unknown',
        city: 'Unknown',
        address: 'Unknown',
        latitude,
        longitude
      };
    }
  }

  _parseLocation(data) {
    const address = data.address || {};
    return {
      country: address.country || 'Unknown',
      countryCode: address.country_code ? address.country_code.toUpperCase() : null,
      state: address.state || null,
      city: address.city || address.town || address.village || 'Unknown',
      address: data.display_name || 'Unknown',
      latitude: data.lat,
      longitude: data.lon,
      placeId: data.place_id
    };
  }

  // Batch geocode multiple coordinates
  async batchGeocode(coordinates) {
    return Promise.all(
      coordinates.map(coord => 
        this.reverseGeocode(coord.latitude, coord.longitude)
      )
    );
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export default GeocodingService;
