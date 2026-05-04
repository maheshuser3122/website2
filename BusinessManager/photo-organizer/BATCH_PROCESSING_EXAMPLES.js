/**
 * Quick Start Example: Batch Photo Processing
 * 
 * This script demonstrates how to use the batch photo processing API
 * to automatically organize, enhance, and sort photos by quality and location.
 */

// ============================================
// EXAMPLE 1: Basic Processing
// ============================================
async function processPhotosBasic() {
  const response = await fetch('http://localhost:5000/api/batch/process-all', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rootDirectory: 'C:/Users/YourName/Pictures',
      useAI: true,
      autoEnhance: true,
      organizeByLocation: true,
      aiQualityThreshold: 50
    })
  });

  const result = await response.json();
  console.log('Processing complete:', result);
  
  if (result.success) {
    console.log(`✅ Processed ${result.result.stats.totalPhotos} photos`);
    console.log(`Good photos: ${result.result.stats.goodPhotos}`);
    console.log(`Bad photos: ${result.result.stats.badPhotos}`);
    console.log(`Photos organized by location: ${result.result.stats.organizedByLocation}`);
  }
}

// ============================================
// EXAMPLE 2: Analysis Only (Preview)
// ============================================
async function analyzePhotosOnly() {
  const response = await fetch('http://localhost:5000/api/batch/analyze-only', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rootDirectory: 'C:/Users/YourName/Pictures',
      useAI: true,
      aiQualityThreshold: 50
    })
  });

  const result = await response.json();
  console.log('Analysis results:', result);
  
  if (result.success) {
    console.log(`Total photos: ${result.analysis.totalPhotos}`);
    console.log(`Excellent quality: ${result.analysis.photosByQuality.excellent}`);
    console.log(`Good quality: ${result.analysis.photosByQuality.good}`);
    console.log(`Fair quality: ${result.analysis.photosByQuality.fair}`);
    console.log(`Poor quality: ${result.analysis.photosByQuality.poor}`);
  }
}

// ============================================
// EXAMPLE 3: With Live Progress Monitoring
// ============================================
async function processWithProgress() {
  // Start monitoring progress
  const eventSource = new EventSource('http://localhost:5000/api/progress');
  
  eventSource.onmessage = (event) => {
    const progress = JSON.parse(event.data);
    console.log(`[${progress.stage}] ${progress.message}`);
    console.log(`Progress: ${progress.stats.processed}/${progress.stats.total}`);
  };

  eventSource.onerror = () => {
    console.log('Progress monitoring ended');
    eventSource.close();
  };

  // Start processing
  const response = await fetch('http://localhost:5000/api/batch/process-all', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rootDirectory: 'C:/Users/YourName/Pictures',
      useAI: true,
      autoEnhance: true,
      organizeByLocation: true
    })
  });

  const result = await response.json();
  console.log('\n✅ Batch processing complete!');
  console.log('Final result:', result);
}

// ============================================
// EXAMPLE 4: Strict Quality Control
// ============================================
async function processWithStrictQuality() {
  const response = await fetch('http://localhost:5000/api/batch/process-all', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rootDirectory: 'C:/Users/YourName/Pictures',
      useAI: true,
      autoEnhance: true,
      organizeByLocation: true,
      aiQualityThreshold: 70  // Only keep excellent photos
    })
  });

  const result = await response.json();
  console.log('Strict processing result:', result);
}

// ============================================
// EXAMPLE 5: Get Processing Status
// ============================================
async function checkStatus() {
  const response = await fetch('http://localhost:5000/api/batch/status');
  const status = await response.json();
  
  console.log('Processing Status:');
  console.log(`Good photos: ${status.stats.goodPhotos}`);
  console.log(`Bad photos: ${status.stats.badPhotos}`);
  console.log(`Enhanced: ${status.stats.enhanced}`);
  console.log(`Organized by location: ${status.stats.organizedByLocation}`);
  console.log('\nLocation breakdown:');
  Object.entries(status.processed.byLocation).forEach(([location, photos]) => {
    console.log(`  ${location}: ${photos.length} photos`);
  });
}

// ============================================
// EXAMPLE 6: Reset Cache Between Runs
// ============================================
async function resetCache() {
  const response = await fetch('http://localhost:5000/api/batch/reset', {
    method: 'POST'
  });
  
  const result = await response.json();
  console.log('Cache reset:', result);
}

// ============================================
// EXAMPLE 7: PowerShell Version
// ============================================
/*
PowerShell script to run batch processing:

$body = @{
    rootDirectory = "C:\Users\YourName\Pictures"
    useAI = $true
    autoEnhance = $true
    organizeByLocation = $true
    aiQualityThreshold = 50
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/batch/process-all" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$result = $response.Content | ConvertFrom-Json
Write-Host "Processing complete!"
Write-Host "Good photos: $($result.result.stats.goodPhotos)"
Write-Host "Bad photos: $($result.result.stats.badPhotos)"
Write-Host "Photos organized: $($result.result.stats.organizedByLocation)"
*/

// ============================================
// EXAMPLE 8: Complete Workflow
// ============================================
async function completeWorkflow() {
  console.log('🚀 Starting complete photo processing workflow...\n');

  try {
    // Step 1: Analyze photos first (preview)
    console.log('📊 Step 1: Analyzing photos...');
    const analysisResponse = await fetch('http://localhost:5000/api/batch/analyze-only', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rootDirectory: 'C:/Users/YourName/Pictures',
        useAI: true
      })
    });

    const analysis = await analysisResponse.json();
    if (analysis.success) {
      console.log(`✅ Found ${analysis.analysis.totalPhotos} photos`);
      console.log(`   Good: ${analysis.analysis.photosByQuality.good}`);
      console.log(`   Bad: ${analysis.analysis.photosByQuality.poor}`);
    }

    // Step 2: Process all photos
    console.log('\n🔄 Step 2: Processing all photos...');
    const processResponse = await fetch('http://localhost:5000/api/batch/process-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rootDirectory: 'C:/Users/YourName/Pictures',
        useAI: true,
        autoEnhance: true,
        organizeByLocation: true
      })
    });

    const processResult = await processResponse.json();
    if (processResult.success) {
      const stats = processResult.result.stats;
      console.log(`✅ Processing complete!`);
      console.log(`   Enhanced: ${stats.enhanced} photos`);
      console.log(`   Moved: ${stats.moved} bad photos`);
      console.log(`   Organized by location: ${stats.organizedByLocation} photos`);
      console.log(`   Duration: ${stats.duration}`);

      // Show location breakdown
      if (Object.keys(processResult.result.processed.byLocation).length > 0) {
        console.log('\n🌍 Location Breakdown:');
        Object.entries(processResult.result.processed.byLocation).forEach(([location, photos]) => {
          console.log(`   ${location}: ${photos.length} photo(s)`);
        });
      }
    }

    // Step 3: Check final status
    console.log('\n✨ Step 3: Final status');
    const statusResponse = await fetch('http://localhost:5000/api/batch/status');
    const status = await statusResponse.json();
    console.log(`✅ All operations complete!`);
    console.log(`   Total processed: ${status.stats.totalPhotos}`);

  } catch (error) {
    console.error('❌ Error during workflow:', error);
  }
}

// ============================================
// EXPORT FUNCTIONS FOR USE
// ============================================
export {
  processPhotosBasic,
  analyzePhotosOnly,
  processWithProgress,
  processWithStrictQuality,
  checkStatus,
  resetCache,
  completeWorkflow
};

// Run example (uncomment to test):
// completeWorkflow();
