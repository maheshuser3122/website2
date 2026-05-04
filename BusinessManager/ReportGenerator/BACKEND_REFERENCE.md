# Backend API Reference for Report Generator

This document describes the API endpoints needed to support the Report Generator application.

## Overview

The Report Generator frontend communicates with a backend API to:
- Store and retrieve reports
- Manage report templates
- Handle SharePoint authentication and data fetching
- Process report generation requests

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

---

## Endpoints

### Reports

#### Get All Reports
```
GET /reports
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "report-1",
      "title": "Q4 Sales Report",
      "metadata": { ... },
      "sections": [ ... ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Save Report
```
POST /reports
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "title": "Q4 Sales Report",
  "sections": [
    {
      "id": "section-1",
      "type": "table",
      "title": "Sales Data",
      "content": [...],
      "order": 1
    }
  ],
  "metadata": {
    "author": "John Doe",
    "version": "1.0.0",
    "tags": ["sales", "q4"]
  }
}

Response (201):
{
  "success": true,
  "data": { "id": "report-1" },
  "message": "Report saved successfully"
}
```

#### Get Report by ID
```
GET /reports/:reportId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": { ... report data ... }
}
```

#### Update Report
```
PUT /reports/:reportId
Authorization: Bearer <token>
Content-Type: application/json

Body: { ... updated report data ... }

Response (200):
{
  "success": true,
  "data": { ... updated report ... }
}
```

#### Delete Report
```
DELETE /reports/:reportId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

### Templates

#### Get All Templates
```
GET /templates
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "template-1",
      "name": "Professional Report",
      "description": "Standard professional layout",
      "layout": "standard",
      "sections": [...]
    }
  ]
}
```

#### Get Template by ID
```
GET /templates/:templateId
Response (200):
{
  "success": true,
  "data": { ... template data ... }
}
```

#### Generate from Template
```
POST /templates/:templateId/generate
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "title": "Sales Report 2024",
  "data": {
    "rows": [...],
    "headers": ["Name", "Sales", "Target"]
  }
}

Response (200):
{
  "success": true,
  "data": { ... generated report ... }
}
```

---

### SharePoint Integration

#### Authenticate with SharePoint
```
POST /sharepoint/authenticate
Content-Type: application/json

Body:
{
  "siteUrl": "https://tenant.sharepoint.com/sites/mysite",
  "username": "user@tenant.onmicrosoft.com",
  "password": "password"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

#### Get SharePoint Lists
```
GET /sharepoint/lists
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "list-123",
      "name": "Sales Data",
      "itemCount": 150
    }
  ]
}
```

#### Get List Items
```
GET /sharepoint/lists/:listId/items?$skip=0&$top=100
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "item-1",
      "fields": {
        "Title": "Item 1",
        "Value": 100
      }
    }
  ]
}
```

#### Search SharePoint Items
```
GET /sharepoint/search?q=keyword&listId=list-123
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    { ... matching items ... }
  ]
}
```

#### Get Site Info
```
GET /sharepoint/site
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "displayName": "My Site",
    "webUrl": "https://tenant.sharepoint.com/sites/mysite"
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Description of what went wrong",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_INPUT | Request body is invalid |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | User lacks permission |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 500 | SERVER_ERROR | Internal server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Sample Node.js Backend (Express.js)

Here's a minimal backend implementation:

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Reports endpoints
app.get('/api/reports', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/reports', (req, res) => {
  const { title, sections, metadata } = req.body;
  
  // Validate input
  if (!title) {
    return res.status(400).json({
      success: false,
      error: 'Title is required'
    });
  }

  // Save report to database
  const reportId = `report-${Date.now()}`;
  
  res.status(201).json({
    success: true,
    data: { id: reportId }
  });
});

// Templates endpoints
app.get('/api/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'template-1',
        name: 'Professional Report',
        layout: 'standard',
        sections: []
      }
    ]
  });
});

// SharePoint endpoints
app.post('/api/sharepoint/authenticate', (req, res) => {
  const { siteUrl, username, password } = req.body;
  
  // Implement SharePoint authentication here
  // Using @pnp/sp or microsoft-graph-client
  
  res.json({
    success: true,
    data: {
      token: 'mock-token-' + Date.now(),
      expiresIn: 3600
    }
  });
});

app.listen(5000, () => {
  console.log('Backend running on http://localhost:5000');
});
```

---

## Integration with Microsoft Graph API

For SharePoint integration, use the Microsoft Graph API:

```javascript
// Authentication
const axios = require('axios');

async function getSharePointData(siteId, listId) {
  const response = await axios.get(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}
```

---

## Rate Limiting

- API requests are limited to **1000 requests per hour** per user
- File uploads limited to **10MB per file**
- Maximum **100 reports** stored per user

---

## Webhooks (Optional)

For real-time updates, implement webhooks:

```
POST /webhooks/subscribe
{
  "url": "https://your-service.com/webhook",
  "events": ["report.created", "report.updated"]
}
```

---

## Testing the API

### Using cURL

```bash
# Get reports
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/reports

# Create report
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Test"}' \
  http://localhost:5000/api/reports

# Get templates
curl http://localhost:5000/api/templates
```

### Using Postman

Import this collection:
```json
{
  "info": { "name": "Report Generator API" },
  "item": [
    { "name": "Get Reports", "request": { "method": "GET", "url": "{{base}}/reports" } },
    { "name": "Create Report", "request": { "method": "POST", "url": "{{base}}/reports" } }
  ]
}
```

---

## Database Schema (Example)

```sql
CREATE TABLE reports (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  content JSON NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout VARCHAR(50),
  sections JSON,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

For more information, see the main README.md file.
