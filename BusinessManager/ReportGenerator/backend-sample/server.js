#!/usr/bin/env node

/**
 * Backend Sample - Express.js Server
 * This is a reference implementation for the Report Generator backend
 * 
 * Installation:
 * npm install express cors dotenv sqlite3 body-parser
 * 
 * Run:
 * node backend/server.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================
// REPORTS API
// ============================================

// Mock data storage (replace with database)
const reports = new Map();
let reportCounter = 1;

// GET all reports
app.get('/api/reports', (req, res) => {
  try {
    const reportsList = Array.from(reports.values());
    res.json({
      success: true,
      data: reportsList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST create report
app.post('/api/reports', (req, res) => {
  try {
    const { title, sections, metadata } = req.body;

    if (!title || !sections || !Array.isArray(sections)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: missing title or sections',
      });
    }

    const reportId = `report-${reportCounter++}`;
    const report = {
      id: reportId,
      title,
      sections,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };

    reports.set(reportId, report);

    res.status(201).json({
      success: true,
      data: { id: reportId },
      message: 'Report created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET single report
app.get('/api/reports/:reportId', (req, res) => {
  try {
    const { reportId } = req.params;
    const report = reports.get(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE report
app.delete('/api/reports/:reportId', (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reports.has(reportId)) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    reports.delete(reportId);

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// TEMPLATES API
// ============================================

const templates = [
  {
    id: 'template-1',
    name: 'Professional Report',
    description: 'Standard professional layout with summary and data tables',
    layout: 'standard',
    sections: [
      { id: 's1', type: 'text', title: 'Executive Summary', required: true, order: 1 },
      { id: 's2', type: 'table', title: 'Data Overview', required: true, order: 2 },
      { id: 's3', type: 'text', title: 'Key Statistics', required: false, order: 3 },
    ],
  },
  {
    id: 'template-2',
    name: 'Sales Report',
    description: 'Specialized template for sales data and analysis',
    layout: 'detailed',
    sections: [
      { id: 's1', type: 'text', title: 'Sales Summary', required: true, order: 1 },
      { id: 's2', type: 'table', title: 'Sales Data', required: true, order: 2 },
      { id: 's3', type: 'chart', title: 'Trends', required: false, order: 3 },
    ],
  },
];

// GET all templates
app.get('/api/templates', (req, res) => {
  res.json({
    success: true,
    data: templates,
  });
});

// GET single template
app.get('/api/templates/:templateId', (req, res) => {
  const { templateId } = req.params;
  const template = templates.find((t) => t.id === templateId);

  if (!template) {
    return res.status(404).json({
      success: false,
      error: 'Template not found',
    });
  }

  res.json({
    success: true,
    data: template,
  });
});

// POST generate from template
app.post('/api/templates/:templateId/generate', (req, res) => {
  try {
    const { templateId } = req.params;
    const { title, data } = req.body;

    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    // Generate report from template
    const generatedReport = {
      title: title || template.name,
      sections: template.sections.map((s) => ({
        ...s,
        content: data || [],
      })),
      metadata: {
        author: 'Report Generator',
        createdAt: new Date(),
        lastModified: new Date(),
        version: '1.0.0',
        tags: ['template', templateId],
      },
      templateId,
    };

    res.json({
      success: true,
      data: generatedReport,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// SHAREPOINT API (Stub)
// ============================================

// Authenticate with SharePoint
app.post('/api/sharepoint/authenticate', (req, res) => {
  try {
    const { siteUrl, username, password } = req.body;

    if (!siteUrl || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing authentication credentials',
      });
    }

    // In production, use @pnp/sp or microsoft-graph-client
    const token = Buffer.from(`${username}:${password}`).toString('base64');

    res.json({
      success: true,
      data: {
        token: `Bearer ${token}`,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get SharePoint lists
app.get('/api/sharepoint/lists', (req, res) => {
  try {
    // Return mock lists
    const lists = [
      { id: 'list-1', name: 'Sales Data', itemCount: 150 },
      { id: 'list-2', name: 'Inventory', itemCount: 250 },
      { id: 'list-3', name: 'Reports', itemCount: 50 },
    ];

    res.json({
      success: true,
      data: lists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get list items
app.get('/api/sharepoint/lists/:listId/items', (req, res) => {
  try {
    const { listId } = req.params;

    // Return mock items
    const items = [
      { id: 'item-1', title: 'Item 1', value: 100 },
      { id: 'item-2', title: 'Item 2', value: 200 },
    ];

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Search SharePoint
app.get('/api/sharepoint/search', (req, res) => {
  try {
    const { q } = req.query;

    // Return mock search results
    const results = [
      { id: 'item-1', title: `Result for ${q}`, value: 100 },
    ];

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get site info
app.get('/api/sharepoint/site', (req, res) => {
  res.json({
    success: true,
    data: {
      displayName: 'My SharePoint Site',
      webUrl: 'https://tenant.sharepoint.com/sites/mysite',
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Report Generator Backend Server v1.0.0   ║
╚════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📡 API ready for Report Generator frontend

Available endpoints:
  • GET    /api/reports
  • POST   /api/reports
  • GET    /api/reports/:id
  • DELETE /api/reports/:id
  • GET    /api/templates
  • GET    /api/templates/:id
  • POST   /api/templates/:id/generate
  • POST   /api/sharepoint/authenticate
  • GET    /api/sharepoint/lists
  • GET    /api/sharepoint/lists/:id/items
  • GET    /api/sharepoint/search
  • GET    /api/sharepoint/site

Health check:
  • GET    /health

Press Ctrl+C to stop server
  `);
});

process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  process.exit(0);
});

module.exports = app;
