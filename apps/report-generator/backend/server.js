/**
 * Report Generator - Backend API Server
 * Handles data processing, file uploads, and report generation
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.REPORT_PORT || 3002;

// ========== MIDDLEWARE ==========

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// File upload configuration
const upload = multer({
  dest: join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ========== ROUTES ==========

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'report-generator' });
});

// Upload Excel file
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      success: true,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process data
app.post('/api/process-data', (req, res) => {
  try {
    const { data, reportType } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Process data based on report type
    const processedData = {
      total: data.length,
      items: data,
      timestamp: new Date().toISOString(),
      reportType: reportType || 'default'
    };

    res.json({
      success: true,
      data: processedData,
      message: 'Data processed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate chart data
app.post('/api/generate-chart', (req, res) => {
  try {
    const { data, chartType } = req.body;

    if (!data || !chartType) {
      return res.status(400).json({ error: 'Missing data or chart type' });
    }

    const chartData = {
      type: chartType,
      labels: data.map((_, i) => `Item ${i + 1}`),
      datasets: [{
        label: 'Data',
        data: Array.isArray(data) ? data : [data],
        backgroundColor: 'rgba(212, 160, 50, 0.5)',
        borderColor: 'rgba(212, 160, 50, 1)',
        borderWidth: 1
      }]
    };

    res.json({
      success: true,
      chart: chartData,
      message: 'Chart generated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export data
app.post('/api/export', (req, res) => {
  try {
    const { data, format } = req.body;

    if (!data || !format) {
      return res.status(400).json({ error: 'Missing data or format' });
    }

    // Data would be exported based on format (csv, xlsx, pptx)
    res.json({
      success: true,
      format: format,
      message: `Data exported as ${format}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ERROR HANDLING ==========

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`\n✓ Report Generator API running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
});
