#!/usr/bin/env node

/**
 * Simple test script to verify batch processing API
 */

async function testBatchAPI() {
  console.log('🧪 Testing Batch Processing API...\n');

  // Test 1: Check server health
  try {
    console.log('1️⃣ Testing server health...');
    const healthRes = await fetch('http://localhost:5000/api/health');
    console.log(`   ✅ Server is running (Status: ${healthRes.status})\n`);
  } catch (err) {
    console.error(`   ❌ Server not responding: ${err.message}\n`);
    return;
  }

  // Test 2: Test analyze-only with valid directory
  try {
    console.log('2️⃣ Testing analyze-only endpoint...');
    const analyzeRes = await fetch('http://localhost:5000/api/batch/analyze-only', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rootDirectory: process.cwd() + '/sample_photos',
        useAI: false
      })
    });

    const analyzeData = await analyzeRes.json();
    if (analyzeRes.ok && analyzeData.success) {
      console.log(`   ✅ Analyze endpoint working!`);
      console.log(`      - Found ${analyzeData.analysis.totalPhotos} photos`);
      console.log(`      - Quality breakdown:`, analyzeData.analysis.photosByQuality);
    } else {
      console.log(`   ⚠️ Analyze returned:`, analyzeData);
    }
    console.log('');
  } catch (err) {
    console.error(`   ❌ Analyze test failed: ${err.message}\n`);
  }

  // Test 3: Test with invalid directory (should error gracefully)
  try {
    console.log('3️⃣ Testing error handling with invalid directory...');
    const invalidRes = await fetch('http://localhost:5000/api/batch/analyze-only', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rootDirectory: 'C:/invalid/path/that/does/not/exist'
      })
    });

    const invalidData = await invalidRes.json();
    if (invalidData.error) {
      console.log(`   ✅ Error handling working!`);
      console.log(`      - Error message: "${invalidData.error}"`);
    } else {
      console.log(`   ⚠️ Unexpected response:`, invalidData);
    }
    console.log('');
  } catch (err) {
    console.error(`   ❌ Error handling test failed: ${err.message}\n`);
  }

  // Test 4: Test missing required parameter
  try {
    console.log('4️⃣ Testing missing rootDirectory parameter...');
    const missingRes = await fetch('http://localhost:5000/api/batch/analyze-only', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing rootDirectory
      })
    });

    const missingData = await missingRes.json();
    if (missingData.error) {
      console.log(`   ✅ Parameter validation working!`);
      console.log(`      - Error message: "${missingData.error}"`);
    } else {
      console.log(`   ⚠️ Unexpected response:`, missingData);
    }
    console.log('');
  } catch (err) {
    console.error(`   ❌ Parameter validation test failed: ${err.message}\n`);
  }

  console.log('✅ All tests completed!');
}

testBatchAPI().catch(console.error);
