import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

// Note: This requires 'canvas' package. If not installed, install with:
// npm install canvas

const SAMPLE_PHOTOS_DIR = './sample_photos';

// Ensure directory exists
if (!fs.existsSync(SAMPLE_PHOTOS_DIR)) {
  fs.mkdirSync(SAMPLE_PHOTOS_DIR, { recursive: true });
}

// Halloween-themed locations with GPS coordinates
const halloweenLocations = [
  { city: 'Salem', country: 'USA', lat: 42.5195, lon: -70.8967, name: 'Salem Spooky' },
  { city: 'Sleepy Hollow', country: 'USA', lat: 41.0534, lon: -73.8621, name: 'Headless Horseman' },
  { city: 'Transylvania', country: 'Romania', lat: 45.9532, lon: 24.9675, name: 'Dracula Castle' },
  { city: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603, name: 'Haunted Dublin' },
  { city: 'New Orleans', country: 'USA', lat: 29.9511, lon: -90.2623, name: 'Voodoo Night' },
  { city: 'Oahu', country: 'Hawaii', lat: 21.3099, lon: -157.8581, name: 'Spooky Island' }
];

function createDummyJpeg(width = 640, height = 480) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Random background
  ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
  ctx.fillRect(0, 0, width, height);
  
  // Add some text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Halloween 2025', width / 2, height / 2);
  
  return canvas.toBuffer('image/jpeg');
}

function generateExifData(location) {
  // Basic EXIF structure for GPS data
  // This is simplified - real EXIF has binary format
  return JSON.stringify({
    GPSLatitude: location.lat,
    GPSLongitude: location.lon,
    GPSLatitudeRef: location.lat >= 0 ? 'N' : 'S',
    GPSLongitudeRef: location.lon >= 0 ? 'E' : 'W',
    Model: 'Canon EOS R50',
    Make: 'Canon',
    DateTime: new Date().toISOString()
  });
}

async function createTestPhotos() {
  console.log('🎃 Creating test Halloween photos...\n');
  
  try {
    // Create 22 test photos (4 per location, 2 duplicates per location)
    let photoCount = 0;
    
    for (let locIdx = 0; locIdx < halloweenLocations.length; locIdx++) {
      const location = halloweenLocations[locIdx];
      
      // Create 4 photos per location
      for (let i = 0; i < 4; i++) {
        photoCount++;
        const filename = `Halloween_${String(photoCount).padStart(3, '0')}_${location.name}.jpg`;
        const filepath = path.join(SAMPLE_PHOTOS_DIR, filename);
        
        // Create dummy JPEG
        const buffer = createDummyJpeg(1920, 1440);
        fs.writeFileSync(filepath, buffer);
        
        // Note: Real EXIF writing requires special libraries
        // This creates the file but without EXIF data embedded
        console.log(`✅ Created: ${filename}`);
        
        if (photoCount >= 22) break;
      }
      
      if (photoCount >= 22) break;
    }
    
    console.log(`\n🎉 Created ${photoCount} test photos!`);
    console.log('⚠️  Note: These photos do NOT have real EXIF GPS data embedded.');
    console.log('   To add GPS data, use a tool like exiftool:\n');
    console.log('   exiftool -GPSLatitude=40.7128 -GPSLongitude=-74.0060 photo.jpg\n');
    console.log('📍 For testing purposes, copy your actual Halloween photos to ./sample_photos\n');
    
  } catch (error) {
    console.error('❌ Error creating test photos:', error.message);
    console.log('\n⚠️  canvas package not installed. Install with:');
    console.log('   npm install canvas\n');
  }
}

createTestPhotos();
