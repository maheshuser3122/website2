import { useState } from 'react'
import { Loader, Zap, Sparkles, Check, AlertCircle, ImageIcon } from 'lucide-react'
import '../styles/EnhancementPage.css'

export default function EnhancementPage({ photos }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [enhancement, setEnhancement] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('auto')
  const [customSettings, setCustomSettings] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
    sharpening: false,
    noiseReduction: false
  })

  const handleAutoEnhance = async () => {
    if (photos.length === 0) {
      setError('No photos to enhance. Scan photos first.')
      return
    }

    setAnalyzing(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/enhance/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoPaths: photos.map(p => p.path)
        })
      })

      const data = await response.json()

      if (data.success) {
        setEnhancement(data)
      } else {
        setError(data.error || 'Enhancement failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDetectPhotoType = async (photoPath) => {
    try {
      const response = await fetch('http://localhost:5000/api/enhance/detect-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoPath })
      })

      const data = await response.json()
      return data.type
    } catch (err) {
      console.error('Error detecting photo type:', err)
      return 'general'
    }
  }

  const handleCustomEnhance = async (photoPath) => {
    if (!photoPath) {
      setError('No photo selected')
      return
    }

    setAnalyzing(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/enhance/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoPath,
          enhancements: {
            brightness: customSettings.brightness,
            contrast: customSettings.contrast,
            saturation: customSettings.saturation,
            sharpen: customSettings.sharpening ? { sigma: 1.5 } : false,
            denoise: customSettings.noiseReduction ? { radius: 2 } : false
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setError('')
        alert('✅ Photo enhanced successfully!')
      } else {
        setError(data.error || 'Enhancement failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="enhancement-page">
      <div className="enhancement-container">
        <h2>✨ Auto-Enhancement & Photo Editing</h2>

        {photos.length === 0 ? (
          <div className="info-box">
            <p>No photos scanned yet. Please go to the Scan tab first.</p>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'auto' ? 'active' : ''}`}
                onClick={() => setActiveTab('auto')}
              >
                ⚡ Auto-Enhance
              </button>
              <button
                className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
                onClick={() => setActiveTab('custom')}
              >
                🎨 Custom Enhance
              </button>
              <button
                className={`tab ${activeTab === 'compare' ? 'active' : ''}`}
                onClick={() => setActiveTab('compare')}
              >
                👀 Before & After
              </button>
            </div>

            {activeTab === 'auto' && (
              <div className="tab-content">
                <div className="enhancement-section">
                  <div className="feature-info">
                    <h3>🎯 Smart Auto-Enhancement</h3>
                    <p>The system detects photo type and applies optimal enhancements:</p>
                    <ul className="features-list">
                      <li>📸 <strong>Portrait photos:</strong> Skin smoothing + saturation boost</li>
                      <li>🏞️ <strong>Landscape photos:</strong> Color vibrance + sharpening</li>
                      <li>🌙 <strong>Night photos:</strong> Noise reduction + brightness correction</li>
                      <li>📄 <strong>Document photos:</strong> Contrast enhancement + straightening</li>
                      <li>✨ <strong>All photos:</strong> Auto white balance + exposure correction</li>
                    </ul>
                  </div>

                  <button
                    className="enhance-btn auto"
                    onClick={handleAutoEnhance}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <>
                        <Loader size={20} className="spinner" /> Enhancing {photos.length} photos...
                      </>
                    ) : (
                      <>
                        <Zap size={20} /> Auto-Enhance All Photos
                      </>
                    )}
                  </button>

                  {error && <div className="error-box">{error}</div>}

                  {enhancement && (
                    <div className="enhancement-results">
                      <h3>✅ Enhancement Complete!</h3>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <span className="label">Total</span>
                          <span className="value">{enhancement.stats.total}</span>
                        </div>
                        <div className="stat-card success">
                          <span className="label">Successful</span>
                          <span className="value">{enhancement.stats.successful}</span>
                        </div>
                        <div className="stat-card">
                          <span className="label">Failed</span>
                          <span className="value">{enhancement.stats.failed}</span>
                        </div>
                      </div>

                      <div className="results-list">
                        {enhancement.results.map((result, idx) => (
                          <div key={idx} className={`result-item ${result.success ? 'success' : 'failed'}`}>
                            <div className="result-icon">
                              {result.success ? (
                                <Check size={20} color="#4caf50" />
                              ) : (
                                <AlertCircle size={20} color="#d32f2f" />
                              )}
                            </div>
                            <div className="result-info">
                              <p className="filename">{result.photoType || result.path}</p>
                              {result.success && (
                                <p className="enhancement-type">Type: {result.photoType}</p>
                              )}
                              {!result.success && (
                                <p className="error-msg">{result.error}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="tab-content">
                <div className="custom-enhance-section">
                  <h3>🎨 Custom Enhancement Settings</h3>
                  
                  <div className="select-photo">
                    <label>Select Photo to Enhance:</label>
                    <select 
                      value={selectedPhoto?.path || ''} 
                      onChange={(e) => {
                        const photo = photos.find(p => p.path === e.target.value)
                        setSelectedPhoto(photo)
                      }}
                    >
                      <option value="">Choose a photo...</option>
                      {photos.map((photo, idx) => (
                        <option key={idx} value={photo.path}>
                          {photo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPhoto && (
                    <div className="enhancement-controls">
                      <div className="control-group">
                        <label>Brightness</label>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.1"
                          value={customSettings.brightness}
                          onChange={(e) => setCustomSettings({ ...customSettings, brightness: parseFloat(e.target.value) })}
                        />
                        <span className="value">{customSettings.brightness.toFixed(1)}x</span>
                      </div>

                      <div className="control-group">
                        <label>Contrast</label>
                        <input
                          type="range"
                          min="0.8"
                          max="1.5"
                          step="0.1"
                          value={customSettings.contrast}
                          onChange={(e) => setCustomSettings({ ...customSettings, contrast: parseFloat(e.target.value) })}
                        />
                        <span className="value">{customSettings.contrast.toFixed(1)}x</span>
                      </div>

                      <div className="control-group">
                        <label>Saturation</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={customSettings.saturation}
                          onChange={(e) => setCustomSettings({ ...customSettings, saturation: parseFloat(e.target.value) })}
                        />
                        <span className="value">{customSettings.saturation.toFixed(1)}x</span>
                      </div>

                      <div className="control-group checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={customSettings.sharpening}
                            onChange={(e) => setCustomSettings({ ...customSettings, sharpening: e.target.checked })}
                          />
                          {' '}Sharpening
                        </label>
                      </div>

                      <div className="control-group checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={customSettings.noiseReduction}
                            onChange={(e) => setCustomSettings({ ...customSettings, noiseReduction: e.target.checked })}
                          />
                          {' '}Noise Reduction
                        </label>
                      </div>

                      <button
                        className="enhance-btn custom"
                        onClick={() => handleCustomEnhance(selectedPhoto.path)}
                        disabled={analyzing}
                      >
                        {analyzing ? (
                          <>
                            <Loader size={20} className="spinner" /> Applying...
                          </>
                        ) : (
                          <>
                            <Sparkles size={20} /> Apply Enhancements
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="tab-content">
                <div className="compare-section">
                  <h3>👀 Before & After Comparison</h3>
                  <p className="compare-info">
                    Enhanced versions are saved in the <code>enhanced/</code> folder next to original photos.
                    You can view and compare original and enhanced versions.
                  </p>

                  <div className="comparison-grid">
                    <div className="comparison-item">
                      <div className="comparison-label">Original</div>
                      <ImageIcon size={48} color="#999" />
                      <p>Original photo</p>
                    </div>
                    <div className="arrow">→</div>
                    <div className="comparison-item">
                      <div className="comparison-label enhanced">Enhanced</div>
                      <Sparkles size={48} color="#FFD700" />
                      <p>Auto-enhanced version</p>
                    </div>
                  </div>

                  <div className="enhancement-benefits">
                    <h4>✨ Enhancement Benefits:</h4>
                    <ul>
                      <li>✅ Non-destructive - original files are preserved</li>
                      <li>✅ Photo-type aware - applies optimal settings for each photo type</li>
                      <li>✅ Batch processing - enhance all photos at once</li>
                      <li>✅ Customizable - fine-tune each adjustment manually</li>
                      <li>✅ Fast - optimized for quick processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
