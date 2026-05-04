import { useState, useEffect } from 'react'
import { ChevronRight, FolderOpen, AlertCircle } from 'lucide-react'
import '../styles/FolderBrowser.css'

export default function FolderBrowser({ onSelectFolder }) {
  const [currentPath, setCurrentPath] = useState('C:\\')
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pathHistory, setPathHistory] = useState(['C:\\'])

  useEffect(() => {
    loadFolders('C:\\')
  }, [])

  useEffect(() => {
    if (currentPath && currentPath !== 'C:\\') {
      loadFolders(currentPath)
    }
  }, [currentPath])

  const loadFolders = async (path) => {
    setLoading(true)
    setError('')
    try {
      console.log(`Loading folders from: ${path}`)
      const response = await fetch('http://localhost:5000/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('Folders response:', data)
      
      if (data.success) {
        setFolders(data.folders || [])
        if (data.folders?.length === 0) {
          setError('No folders found in this directory')
        }
      } else {
        setError(data.error || 'Failed to load folders')
        setFolders([])
      }
    } catch (err) {
      console.error('Error loading folders:', err)
      setError(`Error: ${err.message}`)
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  const handleFolderClick = (folderName) => {
    const newPath = currentPath.endsWith('\\') 
      ? currentPath + folderName 
      : currentPath + '\\' + folderName
    setCurrentPath(newPath)
    setPathHistory([...pathHistory, newPath])
  }

  const handleBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1)
      setPathHistory(newHistory)
      setCurrentPath(newHistory[newHistory.length - 1])
    }
  }

  const handleSelect = () => {
    onSelectFolder(currentPath)
  }

  const handleDriveChange = (drive) => {
    const drivePath = drive + '\\'
    setCurrentPath(drivePath)
    setPathHistory([drivePath])
  }

  return (
    <div className="folder-browser-overlay">
      <div className="folder-browser">
        <div className="browser-header">
          <h3>📁 Browse Folders</h3>
          <button 
            className="close-btn"
            onClick={() => onSelectFolder(null)}
          >
            ✕
          </button>
        </div>

        <div className="drives">
          <label>Quick Access:</label>
          <div className="drive-buttons">
            {['C:', 'D:', 'E:', 'F:', 'G:'].map(drive => (
              <button
                key={drive}
                className={`drive-btn ${currentPath.startsWith(drive) ? 'active' : ''}`}
                onClick={() => handleDriveChange(drive)}
              >
                {drive}
              </button>
            ))}
          </div>
        </div>

        <div className="path-bar">
          <input
            type="text"
            value={currentPath}
            readOnly
            className="path-input"
          />
          <button 
            className="back-btn"
            onClick={handleBack}
            disabled={pathHistory.length <= 1}
          >
            ← Back
          </button>
        </div>

        <div className="folders-list">
          {loading && <div className="loading">⏳ Loading folders...</div>}
          {error && !loading && (
            <div className="error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          {!loading && folders.length > 0 && folders.map((folder, idx) => (
            <div
              key={idx}
              className="folder-item"
              onClick={() => handleFolderClick(folder)}
            >
              <FolderOpen size={20} className="folder-icon" />
              <span className="folder-name">{folder}</span>
              <ChevronRight size={16} className="arrow" />
            </div>
          ))}
          {!loading && folders.length === 0 && !error && (
            <div className="empty">📂 No folders found in this directory</div>
          )}
        </div>

        <div className="browser-footer">
          <button 
            className="cancel-btn"
            onClick={() => onSelectFolder(null)}
          >
            Cancel
          </button>
          <button 
            className="select-btn"
            onClick={handleSelect}
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  )
}
