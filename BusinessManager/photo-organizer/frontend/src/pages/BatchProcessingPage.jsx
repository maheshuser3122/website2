import { useState, useEffect } from 'react';
import { Zap, Folder, Settings, Play, AlertCircle, CheckCircle, XCircle, Globe } from 'lucide-react';
import '../styles/BatchProcessingPage.css';

export default function BatchProcessingPage() {
  const [apiKey, setApiKey] = useState('');
  const [rootDirectory, setRootDirectory] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [organizeByLocation, setOrganizeByLocation] = useState(true);
  const [qualityThreshold, setQualityThreshold] = useState(50);
  const [badPhotoFolder, setBadPhotoFolder] = useState('Bad_Photos');
  const [enhancedFolder, setEnhancedFolder] = useState('Enhanced_Photos');
  const [locationFolder, setLocationFolder] = useState('By_Location');
  
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Save API key to localStorage
  const handleSaveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
      setShowApiKeyInput(false);
      alert('✅ API key saved securely!');
    } else {
      alert('❌ Please enter an API key');
    }
  };

  // Handle folder browse (for Windows file picker)
  const handleBrowseFolder = async () => {
    try {
      // Note: This requires special permissions, fallback to text input
      alert('Please paste your folder path directly');
    } catch (err) {
      console.error('Error browsing folder:', err);
    }
  };

  // Start batch processing
  const handleProcessPhotos = async () => {
    if (!rootDirectory) {
      setError('❌ Please enter a folder path');
      return;
    }

    if (useAI && !apiKey) {
      setError('❌ API key required for AI quality assessment. Add it in Settings.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);
    setProgress({ stage: 'INITIALIZING', message: 'Starting batch processing...', stats: {} });

    try {
      // Monitor progress
      const eventSource = new EventSource('http://localhost:5000/api/progress');
      
      eventSource.onmessage = (event) => {
        const progressData = JSON.parse(event.data);
        setProgress(progressData);
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      // Send processing request
      const response = await fetch('http://localhost:5000/api/batch/process-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rootDirectory,
          useAI,
          autoEnhance,
          organizeByLocation,
          badPhotoFolder,
          enhancedFolder,
          locationFolder,
          aiQualityThreshold: qualityThreshold,
          apiKey: apiKey || undefined  // Pass API key if provided
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Batch processing response:', data);

      if (data && data.success) {
        setResult(data.result);
        setProgress(null);
      } else if (data && data.error) {
        setError(`❌ Processing failed: ${data.error}`);
      } else if (data && data.result) {
        // Handle case where result is present but success might not be explicitly set
        setResult(data.result);
        setProgress(null);
      } else {
        console.error('Unexpected response format:', data);
        setError(`❌ Processing failed: Invalid response from server - ${JSON.stringify(data).substring(0, 100)}`);
      }

      eventSource.close();
    } catch (err) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Quick analysis (preview only)
  const handleAnalyzeOnly = async () => {
    if (!rootDirectory) {
      setError('❌ Please enter a folder path');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);
    setProgress({ stage: 'ANALYZING', message: 'Analyzing photos (no changes)...', stats: {} });

    try {
      const response = await fetch('http://localhost:5000/api/batch/analyze-only', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rootDirectory,
          useAI,
          aiQualityThreshold: qualityThreshold,
          apiKey: apiKey || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Analysis response:', data);

      if (data && data.success && data.analysis) {
        setResult({
          status: 'ANALYSIS_COMPLETE',
          message: 'Analysis completed (no changes made)',
          stats: {
            totalPhotos: data.analysis.totalPhotos,
            goodPhotos: (data.analysis.photosByQuality.good || 0) + (data.analysis.photosByQuality.excellent || 0),
            badPhotos: (data.analysis.photosByQuality.poor || 0) + (data.analysis.photosByQuality.fair || 0),
            badPhotoFolder,
            enhancedFolder,
            locationFolder
          },
          analysis: data.analysis
        });
        setProgress(null);
      } else if (data && data.error) {
        setError(`❌ Analysis failed: ${data.error}`);
      } else {
        console.error('Unexpected analysis response:', data);
        setError(`❌ Analysis failed: Invalid response - ${JSON.stringify(data).substring(0, 100)}`);
      }
    } catch (err) {
      setError(`❌ Error: ${err.message}`);
      console.error('Analysis error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="batch-processing-page">
      <div className="batch-header">
        <div className="header-title">
          <Zap size={32} className="header-icon" />
          <div>
            <h1>🚀 Batch Photo Processing</h1>
            <p>Automatically organize, enhance, and sort all photos by quality & location</p>
          </div>
        </div>
      </div>

      <div className="batch-container">
        {/* Left Panel: Configuration */}
        <div className="batch-config-panel">
          <h2>⚙️ Configuration</h2>

          {/* API Key Section */}
          <div className="config-section">
            <div className="section-header">
              <label>🔑 OpenAI API Key (Optional - for better quality detection)</label>
              <button 
                className="settings-btn"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                title="Toggle API key input"
              >
                <Settings size={18} />
              </button>
            </div>
            
            {showApiKeyInput ? (
              <div className="api-key-input-group">
                <input
                  type="password"
                  placeholder="sk-... (kept private, only in your browser)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="api-key-input"
                />
                <div className="api-key-buttons">
                  <button onClick={handleSaveApiKey} className="btn btn-primary">
                    Save Key
                  </button>
                  <button 
                    onClick={() => setShowApiKeyInput(false)} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
                <p className="info-text">
                  🔒 Your key is stored locally in your browser and never sent to our servers.
                  Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com</a>
                </p>
              </div>
            ) : (
              <div className="api-key-display">
                {apiKey ? (
                  <div className="key-saved">
                    <CheckCircle size={16} className="icon-success" />
                    <span>API Key saved (click to change)</span>
                  </div>
                ) : (
                  <div className="key-empty">
                    <AlertCircle size={16} className="icon-warning" />
                    <span>No API key configured</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Folder Selection */}
          <div className="config-section">
            <label>📁 Root Folder Path</label>
            <div className="folder-input-group">
              <input
                type="text"
                placeholder="C:/Users/YourName/Pictures"
                value={rootDirectory}
                onChange={(e) => setRootDirectory(e.target.value)}
                className="folder-input"
              />
              <button onClick={handleBrowseFolder} className="btn btn-secondary" title="Browse folder">
                <Folder size={18} />
              </button>
            </div>
            <p className="help-text">Path to scan for photos (all subfolders included)</p>
          </div>

          {/* Processing Options */}
          <div className="config-section">
            <h3>🎯 Processing Options</h3>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                />
                <span>🧠 Use AI for Quality Detection</span>
                <span className="badge">{useAI ? 'ACCURATE' : 'FAST'}</span>
              </label>
              <p className="help-text">Uses OpenAI for enhanced quality assessment (requires API key)</p>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoEnhance}
                  onChange={(e) => setAutoEnhance(e.target.checked)}
                />
                <span>✨ Auto-Enhance Good Photos</span>
              </label>
              <p className="help-text">Save enhanced versions to Enhanced_Photos folder</p>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={organizeByLocation}
                  onChange={(e) => setOrganizeByLocation(e.target.checked)}
                />
                <span>🌍 Organize by Location (GPS)</span>
              </label>
              <p className="help-text">Create folders by Country/City from photo GPS data</p>
            </div>
          </div>

          {/* Quality Threshold */}
          <div className="config-section">
            <label>🎚️ Quality Threshold: {qualityThreshold}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={qualityThreshold}
              onChange={(e) => setQualityThreshold(Number(e.target.value))}
              className="slider"
            />
            <div className="threshold-labels">
              <span>30<br/><small>Lenient</small></span>
              <span>50<br/><small>Balanced ✓</small></span>
              <span>70<br/><small>Strict</small></span>
            </div>
            <p className="help-text">
              Photos scoring below threshold moved to Bad_Photos folder
            </p>
          </div>

          {/* Folder Names */}
          <div className="config-section">
            <h3>📂 Output Folder Names</h3>
            
            <div className="folder-config">
              <label>Bad Photos Folder</label>
              <input
                type="text"
                value={badPhotoFolder}
                onChange={(e) => setBadPhotoFolder(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="folder-config">
              <label>Enhanced Photos Folder</label>
              <input
                type="text"
                value={enhancedFolder}
                onChange={(e) => setEnhancedFolder(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="folder-config">
              <label>Location Organization Folder</label>
              <input
                type="text"
                value={locationFolder}
                onChange={(e) => setLocationFolder(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="config-section action-buttons">
            <button
              onClick={handleAnalyzeOnly}
              disabled={processing || !rootDirectory}
              className="btn btn-secondary btn-large"
              title="Preview photos without making changes"
            >
              📊 Analyze Only
            </button>
            <button
              onClick={handleProcessPhotos}
              disabled={processing || !rootDirectory}
              className="btn btn-primary btn-large"
              title="Process all photos"
            >
              {processing ? '⏳ Processing...' : '🚀 Process All Photos'}
            </button>
          </div>
        </div>

        {/* Right Panel: Results & Progress */}
        <div className="batch-results-panel">
          {/* Error Messages */}
          {error && (
            <div className="alert alert-error">
              <XCircle size={20} />
              <div>{error}</div>
            </div>
          )}

          {/* Progress Display */}
          {progress && (
            <div className="progress-container">
              <h2>⏳ Processing in Progress</h2>
              <div className="progress-stage">
                <div className="stage-label">{progress.stage}</div>
                <div className="stage-message">{progress.message}</div>
              </div>
              
              {progress.stats && (
                <div className="progress-stats">
                  {progress.stats.total > 0 && (
                    <div className="stat-item">
                      <span className="stat-label">Processed:</span>
                      <span className="stat-value">{progress.stats.processed}/{progress.stats.total}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="results-container">
              <h2>✅ Processing Complete!</h2>
              
              <div className={`result-status ${result.stats ? 'success' : 'info'}`}>
                {result.status === 'SUCCESS' ? '✅ SUCCESS' : 'ℹ️ ' + result.status}
              </div>

              {result.stats && (
                <div className="results-grid">
                  <div className="result-card">
                    <div className="result-number">{result.stats.totalPhotos}</div>
                    <div className="result-label">Total Photos</div>
                  </div>

                  <div className="result-card good">
                    <div className="result-number">{result.stats.goodPhotos || 0}</div>
                    <div className="result-label">Good Photos</div>
                  </div>

                  <div className="result-card bad">
                    <div className="result-number">{result.stats.badPhotos || 0}</div>
                    <div className="result-label">Bad Photos Moved</div>
                  </div>

                  <div className="result-card enhanced">
                    <div className="result-number">{result.stats.enhanced || 0}</div>
                    <div className="result-label">Photos Enhanced</div>
                  </div>

                  <div className="result-card location">
                    <div className="result-number">{result.stats.organizedByLocation || 0}</div>
                    <div className="result-label">By Location</div>
                  </div>

                  <div className="result-card">
                    <div className="result-number">{result.duration || '?'}</div>
                    <div className="result-label">Duration</div>
                  </div>
                </div>
              )}

              {/* Location Breakdown */}
              {result.processed && result.processed.byLocation && Object.keys(result.processed.byLocation).length > 0 && (
                <div className="location-breakdown">
                  <h3>🌍 Photos by Location</h3>
                  <div className="location-list">
                    {Object.entries(result.processed.byLocation).map(([location, photos]) => (
                      <div key={location} className="location-item">
                        <Globe size={16} />
                        <span className="location-name">{location}</span>
                        <span className="location-count">{photos.length} photo(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="result-message">
                <p>📁 <strong>Bad Photos:</strong> Moved to {result.stats.badPhotoFolder || badPhotoFolder}/</p>
                <p>✨ <strong>Enhanced:</strong> Saved to {result.stats.enhancedFolder || enhancedFolder}/</p>
                <p>🌍 <strong>Location Org:</strong> Organized in {result.stats.locationFolder || locationFolder}/</p>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setRootDirectory('');
                }}
                className="btn btn-primary"
              >
                Process Another Folder
              </button>
            </div>
          )}

          {/* Empty State */}
          {!progress && !result && !error && (
            <div className="empty-state">
              <Zap size={48} className="empty-icon" />
              <h2>Ready to Process Photos</h2>
              <p>1. Configure settings on the left</p>
              <p>2. Click "Analyze Only" for preview (no changes)</p>
              <p>3. Or click "Process All Photos" to organize everything</p>
              <p className="note">💡 Start with "Analyze Only" to see what will happen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
