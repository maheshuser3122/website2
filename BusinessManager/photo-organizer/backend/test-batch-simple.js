#!/usr/bin/env node

import http from 'http';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Batch Processing API...\n');

  // Test 1: Health check
  try {
    console.log('1️⃣ Testing server health...');
    const result = await makeRequest('/api/health');
    console.log(`   ✅ Server is running (Status: ${result.status})\n`);
  } catch (err) {
    console.error(`   ❌ Server not responding: ${err.message}\n`);
    return;
  }

  // Test 2: Batch status
  try {
    console.log('2️⃣ Getting batch status...');
    const result = await makeRequest('/api/batch/status');
    if (result.status === 200) {
      console.log(`   ✅ Batch status endpoint working!`);
      console.log(`      Status: ${JSON.stringify(result.body).substring(0, 100)}...\n`);
    } else {
      console.log(`   ⚠️ Unexpected status: ${result.status}\n`);
    }
  } catch (err) {
    console.error(`   ❌ Test failed: ${err.message}\n`);
  }

  // Test 3: Test missing rootDirectory parameter
  try {
    console.log('3️⃣ Testing missing rootDirectory parameter...');
    const result = await makeRequest('/api/batch/analyze-only', 'POST', {});
    if (result.status !== 200 && result.body.error) {
      console.log(`   ✅ Parameter validation working!`);
      console.log(`      Error: "${result.body.error}"\n`);
    } else {
      console.log(`   ⚠️ Unexpected response status: ${result.status}\n`);
    }
  } catch (err) {
    console.error(`   ❌ Test failed: ${err.message}\n`);
  }

  console.log('✅ Basic tests completed!\n');
  console.log('📝 Next steps:');
  console.log('   1. Open frontend in browser (http://localhost:5173)');
  console.log('   2. Go to "Batch Process" page');
  console.log('   3. Enter a valid folder path (e.g., sample_photos)');
  console.log('   4. Click "Analyze Only" to test without making changes');
}

testAPI().catch(console.error);
