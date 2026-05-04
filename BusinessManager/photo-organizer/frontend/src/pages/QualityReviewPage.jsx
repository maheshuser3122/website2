import { useState } from 'react'
import { Loader, Trash2, Eye, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import '../styles/QualityReviewPage.css'

export default function QualityReviewPage({ photos }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [actionsPending, setActionsPending] = useState({})
  const [actioning, setActioning] = useState(false)
  const [result, setResult] = useState(null)

  const handleAnalyzeQuality = async () => {
    if (photos.length === 0) {
      setError('No photos to analyze')
      return
    }

    setAnalyzing(true)
    setError('')
    setAnalysis(null)
    setResult(null)

    try {
      const response = await fetch('http://localhost:5000/api/analyze-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos })
      })

      const data = await response.json()

      if (data.success) {
        setAnalysis(data)
        setSelectedTab('overview')
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleAction = (filepath, action) => {
    setActionsPending(prev => {
      const current = prev[filepath]
      return {
        ...prev,
        [filepath]: current === action ? null : action
      }
    })
  }

  const handleApplyActions = async () => {
    const actions = Object.entries(actionsPending)
      .filter(([_, action]) => action === 'delete')
      .reduce((acc, [path, action]) => {
        acc[path] = action
        return acc
      }, {})

    if (Object.keys(actions).length === 0) {
      setError('No delete actions selected')
      return
    }

    setActioning(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/quality-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        setActionsPending({})
        setTimeout(() => {
          handleAnalyzeQuality()
        }, 1000)
      } else {
        setError(data.error || 'Action failed')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setActioning(false)
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

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50'
    if (score >= 60) return '#ff9800'
    return '#d32f2f'
  }

  return (
    <div className="quality-review-page">
      <div className="review-container">
        <h2>🔍 Quality Review & Cleanup</h2>

        {photos.length === 0 ? (
          <div className="info-box">
            <p>No photos scanned yet. Please go to the Scan tab first.</p>
          </div>
        ) : (
          <>
            {!analysis ? (
              <div className="analysis-section">
                <p className="description">
                  Analyze your photos to detect quality issues, blurry images, accidental shots, and duplicates.
                </p>
                <button
                  className="analyze-btn"
                  onClick={handleAnalyzeQuality}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader size={20} className="spinner" /> Analyzing {photos.length} photos...
                    </>
                  ) : (
                    <>
                      <Zap size={20} /> Start Quality Analysis
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card total">
                    <div className="stat-number">{analysis.stats.total}</div>
                    <div className="stat-label">Total Photos</div>
                  </div>
                  <div className="stat-card good">
                    <div className="stat-number">{analysis.stats.good}</div>
                    <div className="stat-label">Good Quality</div>
                  </div>
                  <div className="stat-card flagged">
                    <div className="stat-number">{analysis.stats.flagged}</div>
                    <div className="stat-label">Issues Detected</div>
                  </div>
                  <div className="stat-card review">
                    <div className="stat-number">{analysis.stats.toReview}</div>
                    <div className="stat-label">Review</div>
                  </div>
                  <div className="stat-card delete">
                    <div className="stat-number">{analysis.stats.toDelete}</div>
                    <div className="stat-label">Recommend Delete</div>
                  </div>
                  <div className="stat-card duplicates">
                    <div className="stat-number">{analysis.stats.duplicates}</div>
                    <div className="stat-label">Duplicate Sets</div>
                  </div>
                </div>

                <div className="tabs">
                  <button
                    className={`tab ${selectedTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('overview')}
                  >
                    📊 Overview
                  </button>
                  <button
                    className={`tab ${selectedTab === 'good' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('good')}
                  >
                    ✅ Good ({analysis.stats.good})
                  </button>
                  <button
                    className={`tab ${selectedTab === 'flagged' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('flagged')}
                  >
                    ⚠️ Issues ({analysis.stats.flagged})
                  </button>
                  <button
                    className={`tab ${selectedTab === 'duplicates' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('duplicates')}
                  >
                    🔄 Duplicates ({analysis.stats.duplicates})
                  </button>
                </div>

                {selectedTab === 'overview' && (
                  <div className="tab-content">
                    <div className="issue-summary">
                      <h3>🔍 Quality Issues Found:</h3>
                      {analysis.summary.flagged.length > 0 ? (
                        <div className="issues-list">
                          {analysis.summary.flagged.map((photo, idx) => (
                            <div key={idx} className="issue-item">
                              <div className="issue-file">
                                <span className="filename">{photo.filename}</span>
                                <span className="score-badge" style={{ backgroundColor: getScoreColor(photo.score) }}>
                                  {photo.score}%
                                </span>
                              </div>
                              <div className="issue-types">
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
                              <div className="issue-recommendation">
                                <span 
                                  className={`recommendation ${photo.recommendation.action}`}
                                  title={photo.recommendation.reason}
                                >
                                  {photo.recommendation.action === 'delete' && '🗑️ Delete'}
                                  {photo.recommendation.action === 'review' && '👀 Review'}
                                  {photo.recommendation.action === 'keep' && '✅ Keep'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-issues">✅ No quality issues detected!</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'good' && (
                  <div className="tab-content">
                    <div className="photos-grid">
                      {analysis.analysis
                        .filter(p => !p.quality.flagged)
                        .map((photo, idx) => (
                          <div key={idx} className="photo-card good">
                            <div className="photo-thumbnail">
                              <CheckCircle className="quality-icon" size={32} color="green" />
                              <span className="score">{photo.quality.score}%</span>
                            </div>
                            <div className="photo-info">
                              <p className="filename">{photo.filename}</p>
                              <p className="size">{(photo.quality.metadata.size / 1024 / 1024).toFixed(1)}MB</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {selectedTab === 'flagged' && (
                  <div className="tab-content">
                    <div className="action-controls">
                      <p>Select photos to delete, then apply actions:</p>
                      <div className="action-buttons">
                        <button
                          className="delete-btn"
                          onClick={handleApplyActions}
                          disabled={actioning || Object.values(actionsPending).every(a => a !== 'delete')}
                        >
                          {actioning ? (
                            <>
                              <Loader size={16} className="spinner" /> Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} /> Delete Selected ({Object.values(actionsPending).filter(a => a === 'delete').length})
                            </>
                          )}
                        </button>
                        <button className="clear-btn" onClick={() => setActionsPending({})}>
                          Clear Selection
                        </button>
                      </div>
                    </div>

                    <div className="photos-grid">
                      {analysis.analysis
                        .filter(p => p.quality.flagged)
                        .map((photo, idx) => (
                          <div key={idx} className="photo-card flagged">
                            <div className="photo-thumbnail" onClick={() => setSelectedPhoto(photo)}>
                              <AlertCircle className="quality-icon" size={32} color="red" />
                              <span className="score">{photo.quality.score}%</span>
                            </div>
                            <div className="photo-info">
                              <p className="filename">{photo.filename}</p>
                              <p className="issues-count">{photo.quality.issues.length} issues</p>
                            </div>
                            <div className="photo-actions">
                              <button
                                className={`action-btn ${actionsPending[photo.filepath] === 'delete' ? 'selected' : ''}`}
                                onClick={() => toggleAction(photo.filepath, 'delete')}
                                title="Mark for deletion"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                className="action-btn view"
                                onClick={() => setSelectedPhoto(photo)}
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {selectedTab === 'duplicates' && (
                  <div className="tab-content">
                    {analysis.duplicates.length > 0 ? (
                      <div className="duplicates-list">
                        {analysis.duplicates.map((group, idx) => (
                          <div key={idx} className="duplicate-group">
                            <h4>📦 Duplicate Set {idx + 1} ({group.length} images)</h4>
                            <div className="duplicate-items">
                              {group.map((photo, i) => (
                                <div key={i} className="duplicate-item">
                                  <div className="item-rank">
                                    {i === 0 ? '⭐ Keep' : '🗑️ Delete'}
                                  </div>
                                  <div className="item-info">
                                    <p className="filename">{photo.filename}</p>
                                    <p className="metadata">
                                      {photo.quality.metadata.width}x{photo.quality.metadata.height} • {(photo.quality.metadata.size / 1024 / 1024).toFixed(1)}MB
                                    </p>
                                  </div>
                                  {i > 0 && (
                                    <button
                                      className={`action-btn ${actionsPending[photo.filepath] === 'delete' ? 'selected' : ''}`}
                                      onClick={() => toggleAction(photo.filepath, 'delete')}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-duplicates">✅ No duplicates detected!</p>
                    )}
                  </div>
                )}

                {error && <div className="error-box">{error}</div>}

                {result && (
                  <div className="result-box">
                    <h3>✅ Action Complete!</h3>
                    <div className="result-stats">
                      <div className="stat">
                        <span className="label">Deleted:</span>
                        <span className="value">{result.stats.deleted}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Kept:</span>
                        <span className="value success">{result.stats.kept}</span>
                      </div>
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

            {selectedPhoto && (
              <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setSelectedPhoto(null)}>
                    ✕
                  </button>
                  <div className="modal-body">
                    <div className="modal-info">
                      <h3>Quality Analysis Details</h3>
                      <div className="detail-section">
                        <h4>📄 File Information</h4>
                        <p><strong>Filename:</strong> {selectedPhoto.filename}</p>
                        <p><strong>Quality Score:</strong> <span style={{ color: getScoreColor(selectedPhoto.quality.score), fontWeight: 'bold' }}>{selectedPhoto.quality.score}%</span></p>
                        <p><strong>Dimensions:</strong> {selectedPhoto.quality.metadata.width}x{selectedPhoto.quality.metadata.height}</p>
                        <p><strong>File Size:</strong> {(selectedPhoto.quality.metadata.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Entropy:</strong> {selectedPhoto.quality.metadata.entropy}</p>
                      </div>

                      {selectedPhoto.quality.issues.length > 0 && (
                        <div className="detail-section">
                          <h4>⚠️ Issues Detected:</h4>
                          <div className="issues-detail">
                            {selectedPhoto.quality.issues.map((issue, idx) => (
                              <div key={idx} className="issue-detail">
                                <span className="issue-severity" style={{ backgroundColor: getSeverityColor(issue.severity) }}>
                                  {issue.severity.toUpperCase()}
                                </span>
                                <span className="issue-type">{issue.type}</span>
                                <p className="issue-message">{issue.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedPhoto.recommendation && (
                        <div className="detail-section">
                          <h4>💡 Recommendation:</h4>
                          <p className={`recommendation-text ${selectedPhoto.recommendation.action}`}>
                            <strong>{selectedPhoto.recommendation.action.toUpperCase()}:</strong> {selectedPhoto.recommendation.reason}
                          </p>
                        </div>
                      )}

                      <div className="modal-actions">
                        <button
                          className={`action-btn delete ${actionsPending[selectedPhoto.filepath] === 'delete' ? 'selected' : ''}`}
                          onClick={() => {
                            toggleAction(selectedPhoto.filepath, 'delete')
                          }}
                        >
                          <Trash2 size={16} /> {actionsPending[selectedPhoto.filepath] === 'delete' ? 'Marked for Delete' : 'Mark for Delete'}
                        </button>
                        <button className="action-btn cancel" onClick={() => setSelectedPhoto(null)}>
                          Close
                        </button>
                      </div>
                    </div>
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
