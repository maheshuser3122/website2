import { useState, useEffect } from 'react'
import { Upload, Loader, FolderOpen as FolderOpenIcon } from 'lucide-react'
import FolderBrowser from '../components/FolderBrowser'
import '../styles/ScanPage.css'

export default function ScanPage({ onPhotosScanned, photos }) {
  const [scanning, setScanning] = useState(false)
  const [directory, setDirectory] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null)
  const [showBrowser, setShowBrowser] = useState(false)
  const [injectingGPS, setInjectingGPS] = useState(false)

  useEffect(() => {
    if (!scanning) return

    // Connect to SSE endpoint for real-time progress
    const eventSource = new EventSource('http://localhost:5000/api/progress')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress(data)
      } catch (err) {
        console.error('Failed to parse progress:', err)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      eventSource.close()
    }

    return () => eventSource.close()
  }, [scanning])

  const handleScan = async () => {
    if (!directory.trim()) {
      setError('Please enter a directory path')
      return
    }

    setScanning(true)
    setError('')
    setScanResult(null)
    setProgress(null)

    try {
      const response = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: directory })
      })
      
      const data = await response.json()
      
      if (data.success) {
        onPhotosScanned(data.photos)
        setScanResult(data.stats)
      } else {
        setError(data.error || 'Scan failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setScanning(false)
    }
  }

  const handleFolderSelect = (path) => {
    if (path) {
      setDirectory(path)
    }
    setShowBrowser(false)
  }

  const handleInjectTestGPS = async () => {
    if (photos.length === 0) {
      setError('No photos scanned yet. Scan a directory first.')
      return
    }

    setInjectingGPS(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/test/inject-gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        onPhotosScanned(data.photos)
        setError('')
        alert(`✅ Injected GPS data into ${data.photos.length} photos!\n\nGo to Map & Stats tab to see them on the map.`)
      } else {
        setError(data.error || 'Failed to inject GPS data')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setInjectingGPS(false)
    }
  }

  return (
    <div className="scan-page">
      <div className="scan-container">
        <h2>📁 Scan Directory for Photos</h2>
        
        <div className="input-group">
          <label>Directory Path:</label>
          <div className="input-with-button">
            <input
              type="text"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="e.g., C:/Users/Photos or /home/user/pictures"
              disabled={scanning}
            />
            <button
              className="browse-btn"
              onClick={() => setShowBrowser(true)}
              disabled={scanning}
            >
              <FolderOpenIcon size={20} /> Browse
            </button>
          </div>
        </div>

        <button 
          className="scan-btn"
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? (
            <>
              <Loader size={20} className="spinner" /> Scanning...
            </>
          ) : (
            <>
              <Upload size={20} /> Start Scan
            </>
          )}
        </button>

        {photos.length > 0 && (
          <button 
            className="inject-gps-btn"
            onClick={handleInjectTestGPS}
            disabled={injectingGPS}
            title="Inject Halloween location GPS data for testing"
          >
            {injectingGPS ? (
              <>
                <Loader size={20} className="spinner" /> Injecting GPS...
              </>
            ) : (
              <>
                📍 Inject Test GPS Data
              </>
            )}
          </button>
        )}

        {error && <div className="error-box">{error}</div>}

        {progress && (
          <div className="progress-box">
            <h3>📊 Scanning Progress</h3>
            <div className="progress-grid">
              <div className="progress-stat">
                <span className="label">Total Found</span>
                <span className="value">{progress.total}</span>
              </div>
              <div className="progress-stat">
                <span className="label">Processed</span>
                <span className="value success">{progress.processed}</span>
              </div>
              <div className="progress-stat">
                <span className="label">Failed</span>
                <span className="value error">{progress.failed}</span>
              </div>
            </div>
            {progress.currentFile && (
              <div className="current-file">
                <p className="label">Currently processing:</p>
                <p className="filepath">{progress.currentFile}</p>
              </div>
            )}
            {progress.total > 0 && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {scanResult && (
          <div className="result-box">
            <h3>✅ Scan Complete!</h3>
            <div className="stats">
              <div className="stat">
                <span className="label">Total Photos:</span>
                <span className="value">{scanResult.total}</span>
              </div>
              <div className="stat">
                <span className="label">Processed:</span>
                <span className="value">{scanResult.processed}</span>
              </div>
              <div className="stat">
                <span className="label">Failed:</span>
                <span className="value">{scanResult.failed}</span>
              </div>
            </div>
          </div>
        )}

        {photos.length > 0 && (
          <div className="photos-preview">
            <h3>Scanned Photos ({photos.length})</h3>
            <div className="photos-grid">
              {photos.slice(0, 12).map((photo, idx) => (
                <div key={idx} className="photo-item">
                  <div className="photo-info">
                    <p className="filename">{photo.filename}</p>
                    {photo.metadata?.exif?.DateTime && (
                      <p className="date">{new Date(photo.metadata.exif.DateTime).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showBrowser && <FolderBrowser onSelectFolder={handleFolderSelect} />}
    </div>
  )
}
