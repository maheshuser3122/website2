import '../styles/StatsPage.css'

export default function StatsPage({ photos }) {
  const calculateStats = () => {
    if (photos.length === 0) return null

    const byYear = {}
    const byCamera = {}
    const byLocation = {}
    let withGPS = 0
    let withExif = 0

    photos.forEach(photo => {
      const exif = photo.metadata?.exif
      const gps = photo.metadata?.gps
      const location = photo.metadata?.location

      if (exif?.DateTime) {
        const year = new Date(exif.DateTime).getFullYear()
        byYear[year] = (byYear[year] || 0) + 1
        withExif++
      }

      if (exif?.Model) {
        byCamera[exif.Model] = (byCamera[exif.Model] || 0) + 1
      }

      if (location) {
        byLocation[location] = (byLocation[location] || 0) + 1
      }

      if (gps?.lat && gps?.lon) {
        withGPS++
      }
    })

    return {
      byYear: Object.entries(byYear).sort(([a], [b]) => a - b),
      byCamera: Object.entries(byCamera).sort(([, a], [, b]) => b - a),
      byLocation: Object.entries(byLocation).sort(([, a], [, b]) => b - a),
      withGPS,
      withExif
    }
  }

  const stats = calculateStats()

  return (
    <div className="stats-page">
      <h2>📊 Statistics</h2>

      {!stats ? (
        <div className="info-box">
          <p>No photos scanned yet. Please go to the Scan tab first.</p>
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Photos</h3>
            <div className="stat-value">{photos.length}</div>
          </div>

          <div className="stat-card">
            <h3>With EXIF Data</h3>
            <div className="stat-value">{stats.withExif}</div>
            <p className="percentage">({Math.round(stats.withExif / photos.length * 100)}%)</p>
          </div>

          <div className="stat-card">
            <h3>With GPS Data</h3>
            <div className="stat-value">{stats.withGPS}</div>
            <p className="percentage">({Math.round(stats.withGPS / photos.length * 100)}%)</p>
          </div>

          {stats.byYear.length > 0 && (
            <div className="stat-card wide">
              <h3>📅 By Year</h3>
              <div className="chart">
                {stats.byYear.map(([year, count]) => (
                  <div key={year} className="chart-item">
                    <span className="label">{year}</span>
                    <div className="bar-container">
                      <div 
                        className="bar" 
                        style={{ width: `${(count / Math.max(...stats.byYear.map(([, c]) => c))) * 100}%` }}
                      />
                    </div>
                    <span className="count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.byCamera.length > 0 && (
            <div className="stat-card wide">
              <h3>📷 Top Camera Models</h3>
              <div className="list">
                {stats.byCamera.slice(0, 5).map(([model, count]) => (
                  <div key={model} className="list-item">
                    <span className="label">{model || 'Unknown'}</span>
                    <span className="badge">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.byLocation.length > 0 && (
            <div className="stat-card wide">
              <h3>📍 Top Locations</h3>
              <div className="list">
                {stats.byLocation.slice(0, 5).map(([location, count]) => (
                  <div key={location} className="list-item">
                    <span className="label">{location || 'Unknown'}</span>
                    <span className="badge">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
