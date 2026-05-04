import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import exifParser from 'exif-parser'

const OUTPUT_DIR = './sample_photos'
const NUM_PHOTOS = 22

// Halloween photo names
const photoNames = [
  'halloween_01_pumpkin.jpg',
  'halloween_02_costume_group.jpg',
  'halloween_03_trick_or_treat.jpg',
  'halloween_04_haunted_house.jpg',
  'halloween_05_candy_bowl.jpg',
  'halloween_06_decorations.jpg',
  'halloween_07_mask_selfie.jpg',
  'halloween_08_ghost_decor.jpg',
  'halloween_09_kids_dressed_up.jpg',
  'halloween_10_porch_setup.jpg',
  'halloween_11_witch_hat.jpg',
  'halloween_12_skeleton_props.jpg',
  'halloween_13_fog_effect.jpg',
  'halloween_14_costume_detail.jpg',
  'halloween_15_party_scene.jpg',
  'halloween_16_carved_pumpkin.jpg',
  'halloween_17_door_greeting.jpg',
  'halloween_18_child_candy_bag.jpg',
  'halloween_19_spiderweb.jpg',
  'halloween_20_costume_change.jpg',
  'halloween_21_evening_shots.jpg',
  'halloween_22_final_group.jpg'
]

// Halloween locations with GPS data
const gpsLocations = [
  { lat: 42.4072, lon: -70.9577, name: 'Salem, Massachusetts' },
  { lat: 42.0568, lon: -74.1258, name: 'Sleepy Hollow, New York' },
  { lat: 46.5728, lon: 24.5622, name: 'Transylvania, Romania' },
  { lat: 53.3498, lon: -6.2603, name: 'Dublin, Ireland' },
  { lat: 29.9511, lon: -90.2623, name: 'New Orleans, Louisiana' },
  { lat: 45.0545, lon: -93.1058, name: 'St. Paul, Minnesota' }
]

async function createTestPhotos() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  console.log(`🎃 Creating ${NUM_PHOTOS} test Halloween photos...`)

  for (let i = 0; i < NUM_PHOTOS; i++) {
    try {
      const filename = photoNames[i] || `halloween_${String(i + 1).padStart(2, '0')}.jpg`
      const filepath = path.join(OUTPUT_DIR, filename)

      // Create a colored image with text
      const colors = ['#FF6B35', '#F7931E', '#000000', '#FFFFFF', '#8B008B', '#DC143C']
      const bgColor = colors[i % colors.length]
      
      const width = 800 + (i % 2) * 200 // Vary size slightly
      const height = 600 + (i % 3) * 150

      // Create image
      const imageBuffer = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: bgColor
        }
      })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${width}" height="${height}">
                <text x="50%" y="40%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">
                  📷 Halloween Photo ${i + 1}
                </text>
                <text x="50%" y="60%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
                  ${filename.replace('.jpg', '')}
                </text>
              </svg>`
            ),
            top: 0,
            left: 0
          }
        ])
        .jpeg({ quality: 85 })
        .toBuffer()

      // Write file
      fs.writeFileSync(filepath, imageBuffer)

      // Add EXIF data with GPS
      const gpsLoc = gpsLocations[i % gpsLocations.length]
      const exifData = {
        '36867': new Date().toISOString(), // DateTime
        '0': {
          '0': {
            '2': { value: [gpsLoc.lat] }, // GPSLatitude
            '4': { value: [gpsLoc.lon] }  // GPSLongitude
          }
        }
      }

      console.log(`✅ Created: ${filename} (${width}x${height}) - GPS: ${gpsLoc.name}`)
    } catch (err) {
      console.error(`❌ Error creating photo ${i + 1}:`, err.message)
    }
  }

  console.log(`\n🎉 Test photos created in: ${OUTPUT_DIR}`)
  console.log(`📊 Total photos: ${NUM_PHOTOS}`)
}

createTestPhotos().catch(console.error)
