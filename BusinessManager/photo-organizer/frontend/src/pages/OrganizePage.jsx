import { useState } from 'react'
import { FolderOutput, Loader, FolderOpen as FolderOpenIcon } from 'lucide-react'
import FolderBrowser from '../components/FolderBrowser'
import '../styles/OrganizePage.css'

export default function OrganizePage({ photos, scheme, onSchemeChange }) {
  const [organizing, setOrganizing] = useState(false)
  const [outputDir, setOutputDir] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showBrowser, setShowBrowser] = useState(false)

  const schemes = [
    { value: 'country/city/year', label: 'Country > City > Year' },
    { value: 'year/month/day', label: 'Year > Month > Day' },
    { value: 'country/year/month', label: 'Country > Year > Month' },
    { value: 'year/camera', label: 'Year > Camera Model' }
  ]

  const handleOrganize = async () => {
    if (!outputDir.trim()) {
      setError('Please enter an output directory')
      return
    }

    if (photos.length === 0) {
      setError('No photos to organize. Please scan a directory first.')
      return
    }

    setOrganizing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:5000/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputPath: outputDir,
          scheme: scheme
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.stats)
      } else {
        setError(data.error || 'Organization failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setOrganizing(false)
    }
  }

  const handleFolderSelect = (path) => {
    if (path) {
      setOutputDir(path)
    }
    setShowBrowser(false)
  }

  return (
    <div className="organize-page">
      <div className="organize-container">
        <h2>🗂️ Organize Photos</h2>

        {photos.length === 0 ? (
          <div className="info-box">
            <p>No photos scanned yet. Please go to the Scan tab first.</p>
          </div>
        ) : (
          <>
            <div className="scheme-selector">
              <label>Organization Scheme:</label>
              <select 
                value={scheme}
                onChange={(e) => onSchemeChange(e.target.value)}
                disabled={organizing}
              >
                {schemes.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Output Directory:</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="e.g., D:/OrganizedPhotos"
                  disabled={organizing}
                />
                <button
                  className="browse-btn"
                  onClick={() => setShowBrowser(true)}
                  disabled={organizing}
                >
                  <FolderOpenIcon size={20} /> Browse
                </button>
              </div>
            </div>

            <div className="preview-box">
              <h3>Organization Preview:</h3>
              <p className="preview-text">Photos will be organized as: <code>{scheme}</code></p>
              <p className="example">Example: {scheme.split('/').slice(0, 2).join(' > ')}/*</p>
            </div>

            <button 
              className="organize-btn"
              onClick={handleOrganize}
              disabled={organizing}
            >
              {organizing ? (
                <>
                  <Loader size={20} className="spinner" /> Organizing...
                </>
              ) : (
                <>
                  <FolderOutput size={20} /> Start Organization
                </>
              )}
            </button>

            {error && <div className="error-box">{error}</div>}

            {result && (
              <div className="result-box">
                <h3>✅ Organization Complete!</h3>
                <div className="stats">
                  <div className="stat">
                    <span className="label">Total Photos:</span>
                    <span className="value">{result.total}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Organized:</span>
                    <span className="value success">{result.organized}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Failed:</span>
                    <span className="value error">{result.failed}</span>
                  </div>
                </div>
                <p className="output-path">Output: {outputDir}</p>
              </div>
            )}

            <div className="info-summary">
              <p>Total photos to organize: <strong>{photos.length}</strong></p>
            </div>
          </>
        )}
      </div>

      {showBrowser && <FolderBrowser onSelectFolder={handleFolderSelect} />}
    </div>
  )
}
