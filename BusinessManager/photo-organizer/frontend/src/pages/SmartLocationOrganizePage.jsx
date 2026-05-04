import { useState } from 'react'
import { Loader, CheckCircle, Globe, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import '../styles/SmartLocationOrganizePage.css'

export default function SmartLocationOrganizePage({ photos }) {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showPhotos, setShowPhotos] = useState(false)
  const [namedPhotos, setNamedPhotos] = useState([])
  const [loadingNames, setLoadingNames] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedEffects, setSelectedEffects] = useState({
    brightness: true,
    contrast: true,
    saturation: true,
    sharpness: true,
    noise: true,
    colorCorrection: true
  })

  const photosWithLocation = photos.filter(p => p.metadata?.location)
  const uniqueLocations = [...new Set(photosWithLocation.map(p => p.metadata?.location))]

  const toggleEffect = (effect) => {
    setSelectedEffects(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }))
  }

  const handleGenerateSmartNames = async () => {
    if (photosWithLocation.length === 0) {
      setError('No photos with location data found')
      return
    }

    setLoadingNames(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/smart-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: photosWithLocation
        })
      })

      const data = await response.json()

      if (data.success) {
        setNamedPhotos(data.photos)
        setShowPhotos(true)
      } else {
        setError(data.error || 'Failed to generate names')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoadingNames(false)
    }
  }

  const handleSmartOrganize = async () => {
    if (photosWithLocation.length === 0) {
      setError('No photos with location data found')
      return
    }

    setProcessing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:5000/api/smart-organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: photosWithLocation,
          effects: selectedEffects,
          suggestedNames: namedPhotos
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Smart organization failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleOpenFolder = async (folderPath) => {
    try {
      await fetch('http://localhost:5000/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: folderPath
        })
      })
    } catch (err) {
      console.error('Error opening folder:', err)
    }
  }

  return (
    <div className="smart-location-page">
      <div className="organize-container">
        <h2>🌍 Smart Location-Based Organization</h2>
        
        {photos.length === 0 ? (
          <div className="info-box">
            <p>No photos scanned yet. Please go to the Scan tab first.</p>
          </div>
        ) : (
          <>
            <div className="location-overview">
              <div className="overview-card">
                <h3>📍 Photos with Location Data</h3>
                <div className="count">{photosWithLocation.length}</div>
                <p>out of {photos.length} total photos</p>
              </div>
              <div className="overview-card">
                <h3>🌍 Unique Locations</h3>
                <div className="count">{uniqueLocations.length}</div>
                <p>different places</p>
              </div>
            </div>

            {photosWithLocation.length > 0 ? (
              <>
                {/* Photo Preview Section */}
                <div className="photo-preview-section">
                  <button 
                    className="toggle-photos-btn"
                    onClick={() => setShowPhotos(!showPhotos)}
                  >
                    {showPhotos ? <EyeOff size={20} /> : <Eye size={20} />}
                    {showPhotos ? 'Hide' : 'View'} Photos ({photosWithLocation.length})
                  </button>

                  {!namedPhotos.length && (
                    <button 
                      className="generate-names-btn"
                      onClick={handleGenerateSmartNames}
                      disabled={loadingNames}
                    >
                      {loadingNames ? (
                        <>
                          <Loader size={16} className="spinner" /> Generating Smart Names...
                        </>
                      ) : (
                        <>
                          💾 Generate Smart Names
                        </>
                      )}
                    </button>
                  )}

                  {showPhotos && (
                    <div className="photo-grid">
                      {(namedPhotos.length > 0 ? namedPhotos : photosWithLocation).map((photo, idx) => (
                        <div 
                          key={idx} 
                          className="photo-card"
                          onClick={() => setSelectedPhoto(namedPhotos.length > 0 ? namedPhotos[idx] : photo)}
                        >
                          <div className="photo-preview">
                            <img 
                              src={`data:image/jpeg;base64,${photo.thumbnail}`} 
                              alt={photo.name}
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Preview%3C/text%3E%3C/svg%3E'
                              }}
                            />
                          </div>
                          <div className="photo-info">
                            <p className="photo-name">{photo.name}</p>
                            {namedPhotos.length > 0 && (
                              <p className="suggested-name">
                                ✏️ {namedPhotos[idx]?.suggestedName || 'N/A'}
                              </p>
                            )}
                            {photo.metadata?.location && (
                              <p className="location-tag">📍 {photo.metadata.location}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Photo Detail Modal */}
                {selectedPhoto && (
                  <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="modal-close"
                        onClick={() => setSelectedPhoto(null)}
                      >
                        ✕
                      </button>
                      <div className="modal-body">
                        <div className="modal-image">
                          <img 
                            src={`data:image/jpeg;base64,${selectedPhoto.thumbnail}`}
                            alt={selectedPhoto.name}
                          />
                        </div>
                        <div className="modal-details">
                          <h3>Photo Details</h3>
                          <div className="detail-section">
                            <h4>📄 File Information</h4>
                            <p><strong>Original Name:</strong> {selectedPhoto.name}</p>
                            {selectedPhoto.suggestedName && (
                              <p><strong>Suggested Name:</strong> <span className="highlight">{selectedPhoto.suggestedName}</span></p>
                            )}
                            <p><strong>Size:</strong> {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>

                          {selectedPhoto.descriptions && selectedPhoto.descriptions.length > 0 && (
                            <div className="detail-section">
                              <h4>📊 Metadata</h4>
                              {selectedPhoto.descriptions.map((desc, idx) => (
                                <p key={idx}>{desc}</p>
                              ))}
                            </div>
                          )}

                          {selectedPhoto.metadata?.location && (
                            <div className="detail-section">
                              <h4>🌍 Location</h4>
                              <p>{selectedPhoto.metadata.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="locations-breakdown">
                  <h3>📂 Folder Structure to be Created</h3>
                  <div className="folder-structure">
                    <div className="root">📁 smart_organized_photos/</div>
                    {uniqueLocations.slice(0, 5).map((location, idx) => (
                      <div key={idx} className="location-folder">
                        <span className="indent">└─ 📁 {location}/</span>
                        <span className="count-badge">
                          {photosWithLocation.filter(p => p.metadata?.location === location).length} photos
                        </span>
                      </div>
                    ))}
                    {uniqueLocations.length > 5 && (
                      <div className="more-locations">
                        └─ ... and {uniqueLocations.length - 5} more locations
                      </div>
                    )}
                  </div>
                </div>

                <div className="effects-section">
                  <h3>🎨 Select Effects to Apply</h3>
                  <div className="effects-grid">
                    <label className="effect-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEffects.brightness}
                        onChange={() => toggleEffect('brightness')}
                      />
                      <span className="label-text">☀️ Auto Brightness</span>
                    </label>
                    <label className="effect-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEffects.contrast}
                        onChange={() => toggleEffect('contrast')}
                      />
                      <span className="label-text">⚡ Enhance Contrast</span>
                    </label>
                    <label className="effect-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEffects.saturation}
                        onChange={() => toggleEffect('saturation')}
                      />
                      <span className="label-text">🎨 Boost Saturation</span>
                    </label>
                    <label className="effect-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEffects.sharpness}
                        onChange={() => toggleEffect('sharpness')}
                      />
                      <span className="label-text">🔍 Sharpening</span>
                    </label>
                    <label className="effect-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEffects.noise}
                        onChange={() => toggleEffect('noise')}
                      />
                      <span className="label-text">🧹 Noise Reduction</span>
                    </label>
                    <label className="effect-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEffects.colorCorrection}
                        onChange={() => toggleEffect('colorCorrection')}
                      />
                      <span className="label-text">🌈 Color Correction</span>
                    </label>
                  </div>
                </div>

                <button
                  className="process-btn"
                  onClick={handleSmartOrganize}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader size={20} className="spinner" /> Processing...
                    </>
                  ) : (
                    <>
                      <Globe size={20} /> Smart Organize & Edit
                    </>
                  )}
                </button>

                {error && <div className="error-box">{error}</div>}

                {result && (
                  <div className="result-box">
                    <h3>✅ Smart Organization Complete!</h3>
                    
                    <div className="result-stats">
                      <div className="stat">
                        <span className="label">Photos Processed:</span>
                        <span className="value">{result.processed || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Locations Created:</span>
                        <span className="value success">{result.locationsCreated || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Failed:</span>
                        <span className="value error">{result.failed || 0}</span>
                      </div>
                    </div>

                    {result.locations && result.locations.length > 0 && (
                      <div className="organized-locations">
                        <h4>📂 Organized Locations:</h4>
                        <div className="location-list">
                          {result.locations.map((loc, idx) => (
                            <div key={idx} className="location-result">
                              <span className="location-name">📍 {loc.location}</span>
                              <span className="photo-count">{loc.count} photos</span>
                              <span 
                                className="path"
                                onClick={() => handleOpenFolder(loc.path)}
                                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0066cc' }}
                                title="Click to open folder"
                              >{loc.path}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.outputPath && (
                      <p 
                        className="output-path"
                        onClick={() => handleOpenFolder('./smart_organized_photos')}
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0066cc' }}
                        title="Click to open folder"
                      >📁 Output: {result.outputPath}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="info-box">
                <p>No photos with location data found.</p>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Photos need GPS metadata to be organized by location.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
