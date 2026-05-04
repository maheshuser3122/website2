import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import '../styles/MapPage.css'

export default function MapPage({ photos }) {
  const photosWithLocation = photos.filter(p => p.metadata?.gps?.lat && p.metadata?.gps?.lon)

  const defaultCenter = [20, 0]
  const zoom = 3

  if (photosWithLocation.length === 0) {
    return (
      <div className="map-page">
        <div className="info-box">
          <h2>📍 Map View</h2>
          <p>No photos with location data found. Please scan photos with GPS metadata.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="map-page">
      <h2>📍 Photos on Map</h2>
      <div className="map-container">
        <MapContainer center={defaultCenter} zoom={zoom} className="leaflet-map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {photosWithLocation.map((photo, idx) => (
            <Marker key={idx} position={[photo.metadata.gps.lat, photo.metadata.gps.lon]}>
              <Popup>
                <div className="popup-content">
                  <p><strong>{photo.filename}</strong></p>
                  {photo.metadata?.exif?.DateTime && (
                    <p>📅 {new Date(photo.metadata.exif.DateTime).toLocaleDateString()}</p>
                  )}
                  {photo.metadata?.location && (
                    <p>📍 {photo.metadata.location}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="map-info">
        <p>Total photos with location: <strong>{photosWithLocation.length}</strong></p>
      </div>
    </div>
  )
}
