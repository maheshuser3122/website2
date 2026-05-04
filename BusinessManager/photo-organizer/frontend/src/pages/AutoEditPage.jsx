import { useState } from 'react'
import { Wand2, Loader, CheckCircle } from 'lucide-react'
import '../styles/AutoEditPage.css'

export default function AutoEditPage({ photos }) {
  const [editing, setEditing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null)
  const [selectedEffects, setSelectedEffects] = useState({
    brightness: true,
    contrast: true,
    saturation: true,
    sharpness: true,
    noise: true,
    colorCorrection: true
  })

  const cannonR50Photos = photos.filter(p => 
    p.metadata?.exif?.Model?.includes('R50') || 
    p.metadata?.exif?.Model?.includes('Canon')
  )

  const toggleEffect = (effect) => {
    setSelectedEffects(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }))
  }

  const handleAutoEdit = async () => {
    if (cannonR50Photos.length === 0) {
      setError('No Canon R50 photos found to edit')
      return
    }

    setEditing(true)
    setError('')
    setResult(null)
    setProgress({ processed: 0, total: cannonR50Photos.length, current: '' })

    try {
      const response = await fetch('http://localhost:5000/api/auto-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: cannonR50Photos,
          effects: selectedEffects
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Auto-edit failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setEditing(false)
    }
  }

  const handleOpenFolder = async () => {
    try {
      await fetch('http://localhost:5000/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: './smart_organized_photos'
        })
      })
    } catch (err) {
      console.error('Error opening folder:', err)
    }
  }

  return (
    <div className="auto-edit-page">
      <div className="edit-container">
        <h2>✨ Auto-Edit & Smart Organize</h2>
        
        {photos.length === 0 ? (
          <div className="info-box">
            <p>No photos scanned yet. Please go to the Scan tab first.</p>
          </div>
        ) : (
          <>
            <div className="camera-stats">
              <div className="stat-box">
                <h3>📷 Canon R50 Photos Found</h3>
                <div className="count">{cannonR50Photos.length}</div>
                <p className="text">out of {photos.length} total photos</p>
              </div>
            </div>

            {cannonR50Photos.length > 0 ? (
              <>
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
                  className="edit-btn"
                  onClick={handleAutoEdit}
                  disabled={editing}
                >
                  {editing ? (
                    <>
                      <Loader size={20} className="spinner" /> Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} /> Auto-Edit & Organize
                    </>
                  )}
                </button>

                {error && <div className="error-box">{error}</div>}

                {result && (
                  <div className="result-box">
                    <h3>✅ Processing Complete!</h3>
                    <div className="result-stats">
                      <div className="stat">
                        <span className="label">Photos Edited:</span>
                        <span className="value">{result.edited || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Effects Applied:</span>
                        <span className="value success">{result.organized || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Failed:</span>
                        <span className="value error">{result.failed || 0}</span>
                      </div>
                    </div>
                    
                    <div className="info-message">
                      <h4>📍 Next Step: Smart Organize & Edit</h4>
                      <p>The Auto-Edit feature applies effects virtually (logs recommendations).</p>
                      <p>To <strong>actually save the edited photos</strong> organized by location, use the <strong>"Smart Organize"</strong> tab:</p>
                      <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                        <li>✓ Photos saved to: <code 
                          style={{ 
                            background: '#f0f0f0', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            color: '#0066cc'
                          }}
                          onClick={handleOpenFolder}
                          title="Click to open folder"
                        >./smart_organized_photos/</code></li>
                        <li>✓ Organized by GPS location (City, Country)</li>
                        <li>✓ Smart renamed with location & timestamp</li>
                        <li>✓ Effects applied during save</li>
                      </ul>
                    </div>

                    {result.outputPath && (
                      <p className="output-path">📁 {result.outputPath}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="info-box">
                <p>No Canon R50 photos found in your collection.</p>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Camera detected: {[...new Set(photos.map(p => p.metadata?.exif?.Model).filter(Boolean))].join(', ') || 'Unknown'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
