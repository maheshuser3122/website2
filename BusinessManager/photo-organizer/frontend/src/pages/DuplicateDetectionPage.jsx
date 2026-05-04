import React, { useState } from 'react';
import {
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  Settings,
  Download
} from 'lucide-react';
import '../styles/DuplicateDetectionPage.css';

const DuplicateDetectionPage = ({ photos = [] }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [mode, setMode] = useState('review');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState('');
  const [selectedGroups, setSelectedGroups] = useState(new Set());

  const photoPaths = photos.map(p => p.path || p);

  const handleAnalyze = async () => {
    if (photoPaths.length === 0) {
      setError('No photos to analyze. Scan a folder first.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('http://localhost:5000/api/duplicates/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoPaths })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
      setSelectedGroups(new Set());
      setActiveTab('overview');
    } catch (err) {
      setError(`Analysis error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCleanup = async () => {
    if (!analysis || analysis.duplicateGroups.length === 0) {
      setError('No duplicates to clean up');
      return;
    }

    if (!window.confirm(
      `${mode === 'auto-delete' ? 'Permanently delete' : 'Move to review folder'} ${analysis.stats?.totalPhotosToRemove || 0} duplicate photos?\n\nThis action ${mode === 'auto-delete' ? 'CANNOT' : 'can'} be undone.`
    )) {
      return;
    }

    setCleaning(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/duplicates/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duplicateGroups: analysis.duplicateGroups,
          mode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Cleanup failed');
      }

      const data = await response.json();
      setResult(
        `✅ ${data.removed || 0} photos ${mode === 'auto-delete' ? 'deleted' : 'moved to review'}\n` +
        `⏱ Time: ${(data.duration / 1000).toFixed(2)}s`
      );
      setAnalysis(null);
    } catch (err) {
      setError(`Cleanup error: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const getQualityColor = (score) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getSeverityColor = (type) => {
    switch (type) {
      case 'exact': return '#3b82f6';
      case 'near': return '#8b5cf6';
      case 'burst': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const renderOverviewTab = () => (
    <div className="overview-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Photos</div>
          <div className="stat-value">{analysis?.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Duplicate Groups</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>
            {analysis?.stats?.totalDuplicates || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Photos to Remove</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {analysis?.stats?.totalPhotosToRemove || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Storage Saved</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            ~{Math.round((analysis?.stats?.totalPhotosToRemove || 0) * 3)}MB
          </div>
        </div>
      </div>

      <div className="detection-summary">
        <h3>📊 Detection Breakdown</h3>
        <div className="detection-grid">
          <div className="detection-item">
            <div className="detection-icon" style={{ backgroundColor: '#3b82f6' }}>🔵</div>
            <div className="detection-content">
              <div className="detection-title">Exact Duplicates</div>
              <div className="detection-count">{analysis?.stats?.exactDuplicateGroups || 0} groups</div>
              <div className="detection-desc">Identical files (SHA-256)</div>
            </div>
          </div>

          <div className="detection-item">
            <div className="detection-icon" style={{ backgroundColor: '#8b5cf6' }}>🟣</div>
            <div className="detection-content">
              <div className="detection-title">Near-Duplicates</div>
              <div className="detection-count">{analysis?.stats?.nearDuplicateGroups || 0} groups</div>
              <div className="detection-desc">Perceptual hash match</div>
            </div>
          </div>

          <div className="detection-item">
            <div className="detection-icon" style={{ backgroundColor: '#ec4899' }}>🔴</div>
            <div className="detection-content">
              <div className="detection-title">Burst-Mode Photos</div>
              <div className="detection-count">{analysis?.stats?.burstModeGroups || 0} groups</div>
              <div className="detection-desc">High similarity (SSIM)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mode-selector">
        <h3>⚙️ Cleanup Mode</h3>
        <div className="mode-options">
          <label className={`mode-option ${mode === 'review' ? 'active' : ''}`}>
            <input
              type="radio"
              name="mode"
              value="review"
              checked={mode === 'review'}
              onChange={(e) => setMode(e.target.value)}
            />
            <span className="mode-name">📁 Review Mode</span>
            <span className="mode-desc">Safely move to Review/Duplicates/</span>
          </label>

          <label className={`mode-option ${mode === 'auto-delete' ? 'active' : ''}`}>
            <input
              type="radio"
              name="mode"
              value="auto-delete"
              checked={mode === 'auto-delete'}
              onChange={(e) => setMode(e.target.value)}
            />
            <span className="mode-name">🗑️ Auto-Delete</span>
            <span className="mode-desc">Permanently remove duplicates</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderExactDuplicatesTab = () => (
    <div className="duplicates-container">
      {analysis?.exactDuplicates && analysis.exactDuplicates.length > 0 ? (
        <div className="duplicate-groups">
          {analysis.exactDuplicates.map((group, idx) => (
            <div key={idx} className="duplicate-group" style={{ borderLeft: `4px solid #3b82f6` }}>
              <div className="group-header">
                <h4>🔵 Group {idx + 1} - {group.photos?.length || 0} copies (Identical)</h4>
              </div>
              <div className="photos-list">
                {group.photos?.map((photo, pidx) => (
                  <div key={pidx} className={`photo-item ${photo.isKeep ? 'keep' : 'duplicate'}`}>
                    <div className="photo-status">
                      {photo.isKeep ? (
                        <CheckCircle size={20} style={{ color: '#10b981' }} />
                      ) : (
                        <Trash2 size={20} style={{ color: '#ef4444' }} />
                      )}
                    </div>
                    <div className="photo-info">
                      <div className="photo-name">{photo.name || 'Unknown'}</div>
                      <div className="photo-meta">
                        {photo.resolution} • {photo.size} • {photo.sharpness}
                      </div>
                      {photo.isKeep && <span className="badge-keep">✓ Keep</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CheckCircle size={48} style={{ color: '#10b981' }} />
          <p>No exact duplicates found!</p>
        </div>
      )}
    </div>
  );

  const renderSimilarTab = () => (
    <div className="duplicates-container">
      {analysis?.nearDuplicates && analysis.nearDuplicates.length > 0 ? (
        <div className="duplicate-groups">
          <h3>🟣 Near-Duplicates</h3>
          {analysis.nearDuplicates.map((group, idx) => (
            <div key={`near-${idx}`} className="duplicate-group" style={{ borderLeft: `4px solid #8b5cf6` }}>
              <div className="group-header">
                <h4>Near-Duplicate Group {idx + 1}</h4>
                <span className="confidence">Confidence: {group.confidence}%</span>
              </div>
              <div className="photos-list">
                {group.photos?.map((photo, pidx) => (
                  <div key={pidx} className={`photo-item ${photo.isKeep ? 'keep' : 'duplicate'}`}>
                    <div className="photo-status">
                      {photo.isKeep ? (
                        <CheckCircle size={20} style={{ color: '#10b981' }} />
                      ) : (
                        <Trash2 size={20} style={{ color: '#ef4444' }} />
                      )}
                    </div>
                    <div className="photo-info">
                      <div className="photo-name">{photo.name || 'Unknown'}</div>
                      <div className="photo-meta">
                        {photo.resolution} • {photo.size} • {photo.sharpness}
                      </div>
                      <div className="quality-score">
                        <div className="score-bar">
                          <div
                            className="score-fill"
                            style={{
                              width: `${(photo.qualityScore || 0) * 100}%`,
                              backgroundColor: getQualityColor(photo.qualityScore || 0)
                            }}
                          />
                        </div>
                        <span className="score-text">Quality: {((photo.qualityScore || 0) * 100).toFixed(0)}%</span>
                      </div>
                      {photo.isKeep && <span className="badge-keep">✓ Keep (Best)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {analysis?.burstModePhotos && analysis.burstModePhotos.length > 0 ? (
        <div className="duplicate-groups">
          <h3>🔴 Burst-Mode Photos</h3>
          {analysis.burstModePhotos.map((group, idx) => (
            <div key={`burst-${idx}`} className="duplicate-group" style={{ borderLeft: `4px solid #ec4899` }}>
              <div className="group-header">
                <h4>Burst-Mode Group {idx + 1} (Similar Photos)</h4>
                <span className="confidence">Similarity: {group.similarity || 87}%</span>
              </div>
              <div className="photos-list">
                {group.photos?.map((photo, pidx) => (
                  <div key={pidx} className={`photo-item ${photo.isKeep ? 'keep' : 'duplicate'}`}>
                    <div className="photo-status">
                      {photo.isKeep ? (
                        <CheckCircle size={20} style={{ color: '#10b981' }} />
                      ) : (
                        <Trash2 size={20} style={{ color: '#ef4444' }} />
                      )}
                    </div>
                    <div className="photo-info">
                      <div className="photo-name">{photo.name || 'Unknown'}</div>
                      <div className="photo-meta">
                        {photo.resolution} • {photo.size} • {photo.sharpness}
                      </div>
                      <div className="quality-score">
                        <div className="score-bar">
                          <div
                            className="score-fill"
                            style={{
                              width: `${(photo.qualityScore || 0) * 100}%`,
                              backgroundColor: getQualityColor(photo.qualityScore || 0)
                            }}
                          />
                        </div>
                        <span className="score-text">Quality: {((photo.qualityScore || 0) * 100).toFixed(0)}%</span>
                      </div>
                      {photo.isKeep && <span className="badge-keep">✓ Keep (Sharpest)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!analysis?.nearDuplicates?.length && !analysis?.burstModePhotos?.length && (
        <div className="empty-state">
          <CheckCircle size={48} style={{ color: '#10b981' }} />
          <p>No similar photos found!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="duplicate-detection-page">
      <div className="page-header">
        <h1>🔄 Duplicate Detection</h1>
        <p>Find and remove exact duplicates, near-duplicates, and burst-mode photos</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {result && (
        <div className="success-banner">
          <CheckCircle size={20} />
          {result}
        </div>
      )}

      {!analysis ? (
        <div className="analysis-section">
          <div className="analysis-card">
            <h2>🔍 Analyze Photos</h2>
            <p>Scan all photos to detect duplicates and similar images</p>
            <div className="info-grid">
              <div className="info-item">
                <span className="icon">🔵</span>
                <span>Exact: SHA-256 hashing</span>
              </div>
              <div className="info-item">
                <span className="icon">🟣</span>
                <span>Near: Perceptual hashing</span>
              </div>
              <div className="info-item">
                <span className="icon">🔴</span>
                <span>Burst: SSIM clustering</span>
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={analyzing || photoPaths.length === 0}
            >
              {analyzing ? '🔄 Analyzing...' : `📊 Analyze ${photoPaths.length} Photos`}
            </button>
          </div>
        </div>
      ) : (
        <div className="analysis-section">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`tab ${activeTab === 'exact' ? 'active' : ''}`}
              onClick={() => setActiveTab('exact')}
            >
              🔵 Exact ({analysis?.stats?.exactDuplicateGroups || 0})
            </button>
            <button
              className={`tab ${activeTab === 'similar' ? 'active' : ''}`}
              onClick={() => setActiveTab('similar')}
            >
              🟣+🔴 Similar ({(analysis?.stats?.nearDuplicateGroups || 0) + (analysis?.stats?.burstModeGroups || 0)})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'exact' && renderExactDuplicatesTab()}
            {activeTab === 'similar' && renderSimilarTab()}
          </div>

          <div className="action-buttons">
            <button
              className="btn-secondary"
              onClick={() => setAnalysis(null)}
              disabled={cleaning}
            >
              ↩️ New Analysis
            </button>
            <button
              className="btn-danger"
              onClick={handleCleanup}
              disabled={cleaning || (analysis?.stats?.totalPhotosToRemove || 0) === 0}
            >
              {cleaning ? '⏳ Cleaning...' : `🗑️ ${mode === 'review' ? 'Move to Review' : 'Delete'} (${analysis?.stats?.totalPhotosToRemove || 0})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicateDetectionPage;
