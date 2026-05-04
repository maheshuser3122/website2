# Get a photo to test
$photoPath = "c:\\chinmayie\\Halloween Chinmayie\\Bad_Photos\\IMG_1337_enhanced_1_1_1.JPG"

# Test 1: Health Check
Write-Host "`n=== TEST 1: Health Check ===" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
$response.Content

# Test 2: Detect Labels
Write-Host "`n=== TEST 2: Detect Labels ===" -ForegroundColor Cyan
$body = @{
    imagePath = $photoPath
} | ConvertTo-Json

Write-Host "Sending: $body"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/ai/detect-labels" `
      -Method POST `
      -ContentType "application/json" `
      -Body $body `
      -UseBasicParsing -TimeoutSec 60
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response: $($_.Exception.Response.StatusCode)"
    }
}

# Test 3: Detect Faces
Write-Host "`n=== TEST 3: Detect Faces ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/ai/detect-faces" `
      -Method POST `
      -ContentType "application/json" `
      -Body $body `
      -UseBasicParsing -TimeoutSec 60
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Assess Quality
Write-Host "`n=== TEST 4: Assess Quality ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/ai/assess-quality" `
      -Method POST `
      -ContentType "application/json" `
      -Body $body `
      -UseBasicParsing -TimeoutSec 60
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
