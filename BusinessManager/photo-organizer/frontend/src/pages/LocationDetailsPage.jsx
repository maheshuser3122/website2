import { useState } from 'react'
import { MapPin, Camera, Clock, Info } from 'lucide-react'
import '../styles/LocationDetailsPage.css'

export default function LocationDetailsPage({ photos }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [filterByLocation, setFilterByLocation] = useState('all')

  const photosWithLocation = photos.filter(p => p.metadata?.location)
  const photosWithGPS = photos.filter(p => p.metadata?.gps?.lat && p.metadata?.gps?.lon)
  
  const uniqueLocations = [...new Set(
    photosWithLocation.map(p => p.metadata?.location).filter(Boolean)
  )]

  const getPhotosInLocation = (location) => {
    return photos.filter(p => p.metadata?.location === location)
  }

  return (
    <div className="location-details-page">
      <div className="details-container">
        <h2>📍 Location Information</h2>

        <div className="location-stats">
          <div className="stat-card">
            <MapPin size={24} />
            <h3>Photos with GPS</h3>
            <p className="count">{photosWithGPS.length}</p>
          </div>
          <div className="stat-card">
            <Info size={24} />
            <h3>Locations Found</h3>
            <p className="count">{uniqueLocations.length}</p>
          </div>
          <div className="stat-card">
            <Camera size={24} />
            <h3>Total Photos</h3>
            <p className="count">{photos.length}</p>
          </div>
        </div>

        {photosWithLocation.length === 0 ? (
          <div className="info-box">
            <p>📍 No location data found in photos.</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              Photos need GPS data in their EXIF metadata to show location information.
            </p>
          </div>
        ) : (
          <>
            <div className="locations-section">
              <h3>🌍 Locations Found</h3>
              <div className="locations-list">
                {uniqueLocations.map((location, idx) => {
                  const count = getPhotosInLocation(location).length
                  return (
                    <div
                      key={idx}
                      className="location-item"
                      onClick={() => setFilterByLocation(location)}
                    >
                      <div className="location-info">
                        <h4>{location}</h4>
                        <p>{count} photo{count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="arrow">→</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="photos-by-location">
              <h3>📸 Photos by Location</h3>
              {filterByLocation !== 'all' ? (
                <>
                  <button 
                    className="back-btn"
                    onClick={() => setFilterByLocation('all')}
                  >
                    ← Back to all locations
                  </button>
                  <div className="location-header">
                    <h4>{filterByLocation}</h4>
                  </div>
                </>
              ) : null}

              <div className="photos-grid">
                {(filterByLocation === 'all' 
                  ? photosWithLocation 
                  : getPhotosInLocation(filterByLocation)
                ).map((photo, idx) => (
                  <div
                    key={idx}
                    className="photo-card"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="photo-preview">
                      <span className="file-icon">🖼️</span>
                      <span className="filename">{photo.filename}</span>
                    </div>
                    <div className="photo-meta">
                      {photo.metadata?.location && (
                        <p className="location">
                          <MapPin size={14} /> {photo.metadata.location}
                        </p>
                      )}
                      {photo.metadata?.exif?.DateTime && (
                        <p className="date">
                          <Clock size={14} /> {new Date(photo.metadata.exif.DateTime).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedPhoto && (
          <div className="photo-detail-modal">
            <div className="modal-content">
              <button 
                className="close-btn"
                onClick={() => setSelectedPhoto(null)}
              >
                ✕
              </button>
              
              <h3>{selectedPhoto.filename}</h3>

              <div className="detail-section">
                <h4>📍 Location</h4>
                {selectedPhoto.metadata?.location ? (
                  <p className="detail-value">{selectedPhoto.metadata.location}</p>
                ) : (
                  <p className="detail-value">Not available</p>
                )}
              </div>

              {selectedPhoto.metadata?.gps && (
                <div className="detail-section">
                  <h4>🗺️ GPS Coordinates</h4>
                  <p className="detail-value">
                    Lat: {selectedPhoto.metadata.gps.lat?.toFixed(6)}<br/>
                    Lon: {selectedPhoto.metadata.gps.lon?.toFixed(6)}
                  </p>
                </div>
              )}

              <div className="detail-section">
                <h4>📷 Camera Information</h4>
                {selectedPhoto.metadata?.exif ? (
                  <div className="exif-data">
                    {selectedPhoto.metadata.exif.Model && (
                      <p><span>Camera:</span> {selectedPhoto.metadata.exif.Model}</p>
                    )}
                    {selectedPhoto.metadata.exif.DateTime && (
                      <p><span>Date/Time:</span> {new Date(selectedPhoto.metadata.exif.DateTime).toLocaleString()}</p>
                    )}
                    {selectedPhoto.metadata.exif.FNumber && (
                      <p><span>Aperture:</span> f/{selectedPhoto.metadata.exif.FNumber}</p>
                    )}
                    {selectedPhoto.metadata.exif.ExposureTime && (
                      <p><span>Shutter Speed:</span> {selectedPhoto.metadata.exif.ExposureTime}s</p>
                    )}
                    {selectedPhoto.metadata.exif.ISOSpeedRatings && (
                      <p><span>ISO:</span> {selectedPhoto.metadata.exif.ISOSpeedRatings}</p>
                    )}
                    {selectedPhoto.metadata.exif.FocalLength && (
                      <p><span>Focal Length:</span> {selectedPhoto.metadata.exif.FocalLength}mm</p>
                    )}
                  </div>
                ) : (
                  <p className="detail-value">No EXIF data available</p>
                )}
              </div>

              <div className="detail-section">
                <h4>📄 File Information</h4>
                <div className="exif-data">
                  <p><span>Path:</span> {selectedPhoto.filepath}</p>
                  <p><span>Size:</span> {(selectedPhoto.filesize / 1024 / 1024).toFixed(2)} MB</p>
                  <p><span>Modified:</span> {new Date(selectedPhoto.modified).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
