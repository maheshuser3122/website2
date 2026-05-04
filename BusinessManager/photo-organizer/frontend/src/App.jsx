import { useState, useEffect } from 'react'
import { FolderOpen, Play, RotateCcw, CheckCircle, AlertCircle, Info, Zap, TestTube, Trash2 } from 'lucide-react'
import './App.css'

function App() {
  const [rootDirectory, setRootDirectory] = useState('C:\\Mcharv Techlabs\\photo-organizer\\sample_photos')
  const [apiKey, setApiKey] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [qualityThreshold, setQualityThreshold] = useState(60)
  const [apiKeyStatus, setApiKeyStatus] = useState(null) // null, 'testing', 'valid', 'invalid'
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle')
  const [previewModal, setPreviewModal] = useState(null) // { originalPath, enhancedPath }

  // Load saved API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key')
    const savedApiKeyStatus = localStorage.getItem('openai_api_key_status')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      if (savedApiKeyStatus === 'valid') {
        setApiKeyStatus('valid')
      }
    }
  }, [])

  // Connect to SSE for progress updates
  // Note: SSE is now connected directly in handleStartProcessing to avoid race conditions
  // This useEffect is kept for legacy/fallback purposes but should not be triggered
  useEffect(() => {
    if (!processing) return

    console.log('⚠️  Setting up SSE connection from useEffect')
    const eventSource = new EventSource('http://localhost:5000/api/progress')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress(data)
      } catch (e) {
        console.error('Error parsing progress data:', e)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE error in useEffect')
      eventSource.close()
    }

    return () => {
      console.log('Cleaning up SSE connection from useEffect')
      eventSource.close()
    }
  }, [processing])

  const handleFolderSelect = async () => {
    // This would open a folder dialog in a real app
    // For now, allow manual input
    const input = prompt('Enter folder path:', rootDirectory)
    if (input) {
      setRootDirectory(input)
    }
  }

  const handleStartProcessing = async () => {
    if (!rootDirectory.trim()) {
      setError('Please enter a folder path')
      return
    }

    if (useAI && !apiKey.trim()) {
      setError('Please enter your OpenAI API key to use AI analysis')
      return
    }

    setProgress(null)
    setResult(null)
    setError(null)
    setStatus('processing')

    // Establish SSE connection BEFORE starting processing
    const eventSource = new EventSource('http://localhost:5000/api/progress')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress(data)
        console.log('📡 Progress update received:', data)
      } catch (e) {
        console.error('Error parsing progress data:', e)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE Connection error:', error)
      eventSource.close()
    }

    setProcessing(true)

    try {
      const response = await fetch('http://localhost:5000/api/batch/process-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootDirectory,
          useAI,
          apiKey: useAI ? apiKey : undefined,
          aiQualityThreshold: qualityThreshold
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Processing failed')
        setStatus('error')
      } else {
        setResult(data)
        setStatus('completed')
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server')
      setStatus('error')
    } finally {
      setProcessing(false)
      eventSource.close()
    }
  }

  const handleReset = async () => {
    try {
      await fetch('http://localhost:5000/api/batch/reset', {
        method: 'POST'
      })
      setProgress(null)
      setResult(null)
      setError(null)
      setStatus('idle')
    } catch (err) {
      setError('Failed to reset: ' + err.message)
    }
  }

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key first')
      return
    }

    setApiKeyStatus('testing')
    setError(null)

    try {
      const response = await fetch('http://localhost:5000/api/test-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setApiKeyStatus('valid')
        // Save API key to localStorage once verified
        localStorage.setItem('openai_api_key', apiKey)
        localStorage.setItem('openai_api_key_status', 'valid')
      } else {
        setApiKeyStatus('invalid')
        setError(data.error || 'API key is invalid')
      }
    } catch (err) {
      setApiKeyStatus('invalid')
      let errorMsg = err.message
      if (err.message.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to backend server. Make sure the backend is running on http://localhost:5000'
      }
      setError(errorMsg)
    }
  }

  const handleClearApiKey = () => {
    setApiKey('')
    setApiKeyStatus(null)
    localStorage.removeItem('openai_api_key')
    localStorage.removeItem('openai_api_key_status')
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon success" />
      case 'error':
        return <AlertCircle className="status-icon error" />
      case 'processing':
        return <div className="spinner"></div>
      default:
        return <Info className="status-icon info" />
    }
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-content">
          <h1>🖼️ Batch Photo Processor</h1>
          <p>Process all photos in a folder with OpenAI Vision AI</p>
        </div>
      </div>

      <div className="app-container">
        <div className="input-panel">
          <h2>Configuration</h2>

          <div className="input-section">
            <label>Folder Path</label>
            <div className="input-group">
              <input
                type="text"
                className="text-input"
                value={rootDirectory}
                onChange={(e) => setRootDirectory(e.target.value)}
                placeholder="Enter folder path"
              />
              <button className="btn btn-secondary btn-small" onClick={handleFolderSelect}>
                <FolderOpen size={16} />
              </button>
            </div>
          </div>

          <div className="input-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
              />
              <span>Enable OpenAI Vision Analysis</span>
            </label>
            <p className="help-text">
              {useAI
                ? 'Will analyze photos using OpenAI GPT-4 Vision API'
                : 'Will use traditional analysis methods'}
            </p>
          </div>

          {useAI && (
            <div className="input-section api-key-section">
              <div className="section-header">
                <div className="header-title">
                  <Zap size={18} className="icon" />
                  <label>OpenAI API Configuration</label>
                </div>
                {apiKeyStatus === 'valid' && (
                  <span className="status-badge valid">
                    <CheckCircle size={14} /> Valid
                  </span>
                )}
                {apiKeyStatus === 'invalid' && (
                  <span className="status-badge invalid">
                    <AlertCircle size={14} /> Invalid
                  </span>
                )}
              </div>

              <div className="api-input-group">
                <input
                  type="password"
                  className={`text-input ${apiKeyStatus ? `api-key-${apiKeyStatus}` : ''}`}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setApiKeyStatus(null)
                  }}
                  placeholder="sk-..."
                />
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleTestApiKey}
                  disabled={!apiKey.trim() || apiKeyStatus === 'testing'}
                  title="Test if API key is valid"
                >
                  {apiKeyStatus === 'testing' ? (
                    <>
                      <div className="spinner-small"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube size={16} />
                      Test
                    </>
                  )}
                </button>
                {apiKeyStatus === 'valid' && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={handleClearApiKey}
                    title="Clear saved API key"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <p className="help-text">
                Get your free API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
              </p>

              <div className="ai-features">
                <p className="feature-title">🤖 AI Analysis Features:</p>
                <ul className="feature-list">
                  <li>Quality assessment using GPT-4 Vision</li>
                  <li>Automatic photo enhancement</li>
                  <li>Bad photo detection & sorting</li>
                  <li>Advanced composition analysis</li>
                </ul>
              </div>
            </div>
          )}

          <div className="input-section">
            <label>Quality Score Threshold to Move as Bad Photos</label>
            <div className="threshold-control">
              <input
                type="range"
                min="0"
                max="100"
                value={qualityThreshold}
                onChange={(e) => setQualityThreshold(Number(e.target.value))}
                className="slider"
              />
              <div className="threshold-value">
                <span className="score-display">{qualityThreshold}</span>
                <span className="score-label">/ 100</span>
              </div>
            </div>
            <p className="help-text">
              Photos with quality score below this threshold will be moved to Bad Photos folder.
              <br/>
              <strong>Current:</strong> {qualityThreshold}/100 - 
              {qualityThreshold <= 30 ? ' Very strict (more photos marked as bad)' :
               qualityThreshold <= 50 ? ' Strict (many photos marked as bad)' :
               qualityThreshold <= 70 ? ' Moderate (balanced filtering)' :
               ' Lenient (only worst photos marked as bad)'}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="button-group">
            <button
              className="btn btn-primary btn-large"
              onClick={handleStartProcessing}
              disabled={processing}
            >
              <Play size={18} />
              {processing ? 'Processing...' : 'Start Processing'}
            </button>
            {(progress || result) && (
              <button
                className="btn btn-secondary btn-large"
                onClick={handleReset}
                disabled={processing}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="results-panel">
          <h2>Status & Results</h2>

          {!progress && !result && status === 'idle' && (
            <div className="empty-state">
              <Info size={48} />
              <p>Select a folder and click "Start Processing" to begin</p>
            </div>
          )}

          {progress && (
            <div className="progress-container">
              <div className="status-header">
                {getStatusIcon()}
                <div className="status-text">
                  <h3>{progress.phase || 'Processing'}</h3>
                  <p>{progress.message || 'Running...'}</p>
                </div>
              </div>

              {/* Current Photo Analysis */}
              {progress.currentFile && (
                <div className="current-photo-section">
                  <h4>📸 Analyzing Now</h4>
                  
                  {progress.currentPhotoPreview && (
                    <div className="photo-preview">
                      <img src={progress.currentPhotoPreview} alt="Current photo" />
                    </div>
                  )}

                  <div className="photo-info">
                    <p className="photo-name">{progress.currentFile}</p>
                    
                    {progress.currentAnalysis && (
                      <div className="analysis-details">
                        <div className="analysis-row">
                          <span className="label">Quality Score:</span>
                          <span className="score">{progress.currentAnalysis.score?.toFixed(1)}/100</span>
                        </div>

                        <div className="analysis-row">
                          <span className="label">Decision:</span>
                          <span className={`decision ${progress.currentAnalysis.isBad ? 'bad' : 'good'}`}>
                            {progress.currentAnalysis.isBad ? '❌ Bad Photo' : '✅ Good Photo'}
                          </span>
                        </div>

                        <div className="analysis-row full-width">
                          <span className="label">Reason:</span>
                          <p className="reason">{progress.currentAnalysis.reason || 'Analyzing...'}</p>
                        </div>

                        {progress.currentAnalysis.issues && progress.currentAnalysis.issues.length > 0 && (
                          <div className="analysis-row full-width">
                            <span className="label">Issues Found:</span>
                            <ul className="issues-list">
                              {progress.currentAnalysis.issues.map((issue, idx) => (
                                <li key={idx} className={`issue-${issue.severity?.toLowerCase() || 'info'}`}>
                                  {issue.type}: {issue.description}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {progress.currentAnalysis.enhancement && (
                          <div className="analysis-row full-width">
                            <span className="label">Enhancement:</span>
                            <div className={`enhancement-status ${progress.currentAnalysis.enhancement.status}`}>
                              {progress.currentAnalysis.enhancement.status === 'success' && '✨ '}
                              {progress.currentAnalysis.enhancement.status === 'failed' && '❌ '}
                              {progress.currentAnalysis.enhancement.status === 'skipped' && '⊘ '}
                              {progress.currentAnalysis.enhancement.status === 'pending' && '⏳ '}
                              {progress.currentAnalysis.enhancement.message}
                            </div>
                            
                            {progress.currentAnalysis.enhancement.appliedEnhancements && 
                             progress.currentAnalysis.enhancement.appliedEnhancements.length > 0 && (
                              <div className="enhancements-applied">
                                <p className="enhancements-title">Applied Enhancements:</p>
                                <ul className="enhancements-list">
                                  {progress.currentAnalysis.enhancement.appliedEnhancements.map((enhancement, idx) => (
                                    <li key={idx}>• {enhancement}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {progress.totalPhotos && (
                <>
                  <div className="progress-stats">
                    <div className="stat">
                      <span className="stat-label">Total:</span>
                      <span className="stat-value">{progress.totalPhotos}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Processed:</span>
                      <span className="stat-value">{progress.processedCount || 0}</span>
                    </div>
                    {progress.skipped && (
                      <div className="stat">
                        <span className="stat-label">Skipped:</span>
                        <span className="stat-value">{progress.skipped}</span>
                      </div>
                    )}
                  </div>

                  {progress.totalPhotos > 0 && (
                    <>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${((progress.processedCount || 0) / progress.totalPhotos) * 100}%`
                          }}
                        ></div>
                      </div>
                      <p className="progress-percentage">
                        {Math.round(((progress.processedCount || 0) / progress.totalPhotos) * 100)}%
                      </p>
                    </>
                  )}

                  {/* Photo Queues */}
                  <div className="queues-section">
                    {progress.queuedPhotos && progress.queuedPhotos.length > 0 && (
                      <div className="queue-panel">
                        <h4>⏳ Queue ({progress.queuedPhotos.length})</h4>
                        <div className="queue-list">
                          {progress.queuedPhotos.slice(0, 5).map((photo, idx) => (
                            <div key={idx} className="queue-item">
                              <span className="queue-number">{idx + 1}</span>
                              <span className="queue-file">{photo}</span>
                            </div>
                          ))}
                          {progress.queuedPhotos.length > 5 && (
                            <div className="queue-more">+{progress.queuedPhotos.length - 5} more</div>
                          )}
                        </div>
                      </div>
                    )}

                    {progress.processedPhotos && progress.processedPhotos.length > 0 && (
                      <div className="queue-panel">
                        <h4>✅ Processed ({progress.processedPhotos.length})</h4>
                        <div className="queue-list">
                          {progress.processedPhotos.slice(-5).map((photo, idx) => (
                            <div key={idx} className="queue-item processed">
                              <span className="queue-checkmark">✓</span>
                              <span className="queue-file">{photo}</span>
                            </div>
                          ))}
                          {progress.processedPhotos.length > 5 && (
                            <div className="queue-more">+{progress.processedPhotos.length - 5} earlier</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {progress.currentFile && (
                <div className="current-file">
                  <p><strong>Current:</strong> {progress.currentFile}</p>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="result-container">
              <div className="status-header">
                {getStatusIcon()}
                <div className="status-text">
                  <h3>Processing Complete</h3>
                  <p>{result.message || 'Batch processing finished'}</p>
                </div>
              </div>

              {result.result && result.result.stats && (
                <div className="result-stats">
                  <div className="stat-card">
                    <span className="stat-label">Total Photos</span>
                    <span className="stat-value">{result.result.stats.totalPhotos || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Good Photos</span>
                    <span className="stat-value good">{result.result.stats.goodPhotos || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Bad Photos</span>
                    <span className="stat-value bad">{result.result.stats.badPhotos || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Photos Enhanced</span>
                    <span className="stat-value">{result.result.stats.enhanced || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Duplicates Removed</span>
                    <span className="stat-value">{result.result.stats.duplicatesRemoved || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Photos Moved</span>
                    <span className="stat-value">{result.result.stats.moved || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Organized by Location</span>
                    <span className="stat-value">{result.result.stats.organizedByLocation || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Processing Errors</span>
                    <span className="stat-value error">{result.result.stats.errors || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">{result.result.duration || '0s'}</span>
                  </div>
                </div>
              )}

              {result.result && result.result.processed && result.result.processed.good && result.result.processed.good.length > 0 && (
                <div className="result-details">
                  <h4>✅ Good Photos ({result.result.processed.good.length})</h4>
                  <ul className="processed-list">
                    {result.result.processed.good.slice(0, 5).map((photo, idx) => (
                      <li key={idx} 
                          className={photo.enhanced ? 'clickable' : ''} 
                          onClick={() => photo.enhanced && photo.enhancedPath && setPreviewModal({ 
                            originalPath: photo.path, 
                            enhancedPath: photo.enhancedPath,
                            appliedEnhancements: photo.appliedEnhancements || []
                          })}>
                        <span className="file-name">{photo.path.split('\\').pop()}</span>
                        <span className="score">{photo.score?.toFixed(1)}/100</span>
                        {photo.enhanced && <span className="badge" title="Click to compare original and enhanced">✨ Enhanced</span>}
                      </li>
                    ))}
                    {result.result.processed.good.length > 5 && (
                      <li className="more-items">... and {result.result.processed.good.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {result.result && result.result.processed && result.result.processed.bad && result.result.processed.bad.length > 0 && (
                <div className="result-details">
                  <h4>❌ Bad Photos ({result.result.processed.bad.length})</h4>
                  <ul className="processed-list">
                    {result.result.processed.bad.slice(0, 5).map((photo, idx) => (
                      <li key={idx}>
                        <span className="file-name">{photo.path.split('\\').pop()}</span>
                        <span className="score">{photo.score?.toFixed(1)}/100</span>
                      </li>
                    ))}
                    {result.result.processed.bad.length > 5 && (
                      <li className="more-items">... and {result.result.processed.bad.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {status === 'error' && error && (
            <div className="error-container">
              <AlertCircle size={32} />
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Before/After Preview Modal */}
      {previewModal && (
        <div className="modal-overlay" onClick={() => setPreviewModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📸 Before & After Comparison</h3>
              <button className="close-btn" onClick={() => setPreviewModal(null)}>✕</button>
            </div>
            
            <div className="comparison-container">
              <div className="comparison-panel">
                <h4>Original</h4>
                <div className="preview-image">
                  <img 
                    src={`http://localhost:5000/api/image?path=${encodeURIComponent(previewModal.originalPath)}`} 
                    alt="Original" 
                    onError={(e) => {
                      e.target.parentElement.innerHTML = '<p style="color: #999; text-align: center;">Could not load original image</p>';
                    }} 
                  />
                </div>
              </div>
              
              <div className="comparison-panel">
                <h4>Enhanced ✨</h4>
                <div className="preview-image">
                  <img 
                    src={`http://localhost:5000/api/image?path=${encodeURIComponent(previewModal.enhancedPath)}`} 
                    alt="Enhanced" 
                    onError={(e) => {
                      e.target.parentElement.innerHTML = '<p style="color: #999; text-align: center;">Could not load enhanced image</p>';
                    }} 
                  />
                </div>
              </div>
            </div>

            {previewModal.appliedEnhancements && previewModal.appliedEnhancements.length > 0 && (
              <div className="modal-enhancements">
                <h4>✨ Applied Enhancements:</h4>
                <ul className="modal-enhancements-list">
                  {previewModal.appliedEnhancements.map((enhancement, idx) => (
                    <li key={idx}>{enhancement}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="modal-note">
              ✨ Side-by-side comparison of the original and enhanced versions. The enhanced version has been saved to the Enhanced_Photos folder.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App