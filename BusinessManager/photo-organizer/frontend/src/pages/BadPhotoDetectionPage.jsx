import { useState } from 'react'
import { Loader, Trash2, AlertCircle, CheckCircle, Eye, Zap } from 'lucide-react'
import '../styles/BadPhotoDetectionPage.css'

export default function BadPhotoDetectionPage({ photos }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [mode, setMode] = useState('review')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [cleaning, setCleaning] = useState(false)
  const [result, setResult] = useState(null)

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      setError('No photos to analyze. Scan photos first.')
      return
    }

    setAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('http://localhost:5000/api/bad-photos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoPaths: photos.map(p => p.path)
        })
      })

      const data = await response.json()

      if (data.success) {
        setAnalysis(data)
        setActiveTab('overview')
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCleanup = async () => {
    if (!analysis) {
      setError('No analysis results. Analyze first.')
      return
    }

    setCleaning(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/bad-photos/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoPaths: photos.map(p => p.path),
          mode
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Cleanup failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setCleaning(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#d32f2f'
      case 'medium': return '#f57c00'
      case 'low': return '#fbc02d'
      default: return '#757575'
    }
  }

  return (
    <div className="bad-photo-detection-page">
      <div className="detection-container">
        <h2>🧹 Bad Photo Detection & Cleanup</h2>

        {photos.length === 0 ? (
          <div className="info-box">
            <p>No photos scanned yet. Please go to the Scan tab first.</p>
          </div>
        ) : (
          <>
            {!analysis ? (
              <div className="analysis-section">
                <div className="detection-info">
                  <h3>🔍 What Gets Detected:</h3>
                  <div className="detection-types">
                    <div className="detection-item">
                      <span className="icon">1️⃣</span>
                      <div>
                        <strong>Blurry Photos</strong>
                        <p>Out-of-focus using Laplacian variance</p>
                      </div>
                    </div>
                    <div className="detection-item">
                      <span className="icon">2️⃣</span>
                      <div>
                        <strong>Closed Eyes</strong>
                        <p>Blinking or closed eyes detection</p>
                      </div>
                    </div>
                    <div className="detection-item">
                      <span className="icon">3️⃣</span>
                      <div>
                        <strong>Distorted Faces</strong>
                        <p>Facial blocking or weird expressions</p>
                      </div>
                    </div>
                    <div className="detection-item">
                      <span className="icon">4️⃣</span>
                      <div>
                        <strong>Accidental Photos</strong>
                        <p>Pocket/floor/bag shots and dark images</p>
                      </div>
                    </div>
                    <div className="detection-item">
                      <span className="icon">5️⃣</span>
                      <div>
                        <strong>Low Resolution</strong>
                        <p>Heavily cropped or pixelated images</p>
                      </div>
                    </div>
                    <div className="detection-item">
                      <span className="icon">6️⃣</span>
                      <div>
                        <strong>Duplicates</strong>
                        <p>Identical or near-identical photos</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="analyze-btn"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader size={20} className="spinner" /> Analyzing {photos.length} photos...
                    </>
                  ) : (
                    <>
                      <Zap size={20} /> Start Bad Photo Detection
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card total">
                    <div className="stat-number">{analysis.summary.total}</div>
                    <div className="stat-label">Total Photos</div>
                  </div>
                  <div className="stat-card good">
                    <div className="stat-number">{analysis.summary.good}</div>
                    <div className="stat-label">Good Quality</div>
                  </div>
                  <div className="stat-card review">
                    <div className="stat-number">{analysis.summary.needsReview}</div>
                    <div className="stat-label">Needs Review</div>
                  </div>
                  <div className="stat-card delete">
                    <div className="stat-number">{analysis.summary.autoDelete}</div>
                    <div className="stat-label">Auto-Delete Candidates</div>
                  </div>
                </div>

                <div className="tabs">
                  <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    📊 Overview
                  </button>
                  <button
                    className={`tab ${activeTab === 'bad' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bad')}
                  >
                    ⚠️ Bad Photos ({analysis.summary.autoDelete + analysis.summary.needsReview})
                  </button>
                  <button
                    className={`tab ${activeTab === 'good' ? 'active' : ''}`}
                    onClick={() => setActiveTab('good')}
                  >
                    ✅ Good Photos ({analysis.summary.good})
                  </button>
                </div>

                {activeTab === 'overview' && (
                  <div className="tab-content">
                    <div className="issue-summary">
                      <h3>🔍 Issues Found:</h3>
                      {Object.keys(analysis.summary.byIssueType).length > 0 ? (
                        <div className="issues-breakdown">
                          {Object.entries(analysis.summary.byIssueType).map(([type, count]) => (
                            <div key={type} className="issue-stat">
                              <span className="type">{type}</span>
                              <span className="count">{count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-issues">✅ No quality issues detected!</p>
                      )}
                    </div>

                    <div className="cleanup-section">
                      <h3>🧹 Cleanup Mode</h3>
                      <div className="mode-selector">
                        <label className="mode-option">
                          <input
                            type="radio"
                            name="mode"
                            value="review"
                            checked={mode === 'review'}
                            onChange={(e) => setMode(e.target.value)}
                          />
                          <span className="label-content">
                            <strong>Review Mode</strong> (Recommended)
                            <p>Move bad photos to Review/Bad Photos folder - you can restore them</p>
                          </span>
                        </label>
                        <label className="mode-option">
                          <input
                            type="radio"
                            name="mode"
                            value="auto-delete"
                            checked={mode === 'auto-delete'}
                            onChange={(e) => setMode(e.target.value)}
                          />
                          <span className="label-content">
                            <strong>⚠️ Auto-Delete Mode</strong> (Use with caution!)
                            <p>Permanently delete bad photos - cannot be restored</p>
                          </span>
                        </label>
                      </div>

                      <button
                        className={`cleanup-btn ${mode === 'auto-delete' ? 'danger' : 'safe'}`}
                        onClick={handleCleanup}
                        disabled={cleaning}
                      >
                        {cleaning ? (
                          <>
                            <Loader size={20} className="spinner" /> Processing...
                          </>
                        ) : (
                          <>
                            <Trash2 size={20} /> 
                            {mode === 'review' ? 'Move Bad Photos to Review' : 'Auto-Delete Bad Photos'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'bad' && (
                  <div className="tab-content">
                    <div className="photos-list">
                      {analysis.results
                        .filter(r => r.issues && r.issues.length > 0)
                        .map((photo, idx) => (
                          <div key={idx} className="photo-result bad">
                            <div className="photo-header">
                              <AlertCircle size={24} color="#d32f2f" />
                              <div className="photo-info">
                                <p className="filename">{photo.filename}</p>
                                <span className="recommendation">
                                  {photo.recommendation.action.toUpperCase()}: {photo.recommendation.reason}
                                </span>
                              </div>
                            </div>
                            <div className="issues-tags">
                              {photo.issues.map((issue, i) => (
                                <span
                                  key={i}
                                  className="issue-tag"
                                  style={{ borderColor: getSeverityColor(issue.severity) }}
                                >
                                  {issue.type}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {activeTab === 'good' && (
                  <div className="tab-content">
                    <div className="photos-list">
                      {analysis.results
                        .filter(r => !r.issues || r.issues.length === 0)
                        .map((photo, idx) => (
                          <div key={idx} className="photo-result good">
                            <div className="photo-header">
                              <CheckCircle size={24} color="#4caf50" />
                              <div className="photo-info">
                                <p className="filename">{photo.filename}</p>
                                <span className="status">Good Quality</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {error && <div className="error-box">{error}</div>}

                {result && (
                  <div className="result-box">
                    <h3>✅ {mode === 'review' ? 'Review Cleanup Complete!' : 'Auto-Delete Complete!'}</h3>
                    <div className="result-stats">
                      {mode === 'review' ? (
                        <>
                          <div className="stat">
                            <span className="label">Moved to Review:</span>
                            <span className="value">{result.stats.moved}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Kept in place:</span>
                            <span className="value success">{result.stats.skipped}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Review Folder:</span>
                            <span className="value" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                              {result.reviewFolder}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="stat">
                            <span className="label">Deleted:</span>
                            <span className="value">{result.stats.deleted}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Kept:</span>
                            <span className="value success">{result.stats.kept}</span>
                          </div>
                        </>
                      )}
                      {result.stats.errors > 0 && (
                        <div className="stat">
                          <span className="label">Errors:</span>
                          <span className="value error">{result.stats.errors}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
