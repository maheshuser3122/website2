/**
 * Resume Builder - Backend API Server
 * Handles resume storage and retrieval
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.RESUME_PORT || 3003;

// Data storage directory
const dataDir = join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ========== MIDDLEWARE ==========

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// ========== ROUTES ==========

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'resume-builder' });
});

// Get all resumes
app.get('/api/resumes', (req, res) => {
  try {
    if (!fs.existsSync(dataDir)) {
      return res.json({ resumes: [] });
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    const resumes = files.map(file => {
      const data = JSON.parse(fs.readFileSync(join(dataDir, file), 'utf8'));
      return { id: file.replace('.json', ''), ...data };
    });

    res.json({ resumes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single resume
app.get('/api/resumes/:id', (req, res) => {
  try {
    const filePath = join(dataDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({ id: req.params.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save resume
app.post('/api/resumes', (req, res) => {
  try {
    const { id, data } = req.body;

    if (!id || !data) {
      return res.status(400).json({ error: 'Missing id or data' });
    }

    const filePath = join(dataDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      id: id,
      message: 'Resume saved successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update resume
app.put('/api/resumes/:id', (req, res) => {
  try {
    const { data } = req.body;
    const filePath = join(dataDir, `${req.params.id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      id: req.params.id,
      message: 'Resume updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete resume
app.delete('/api/resumes/:id', (req, res) => {
  try {
    const filePath = join(dataDir, `${req.params.id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Resume deleted successfully'
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
  console.log(`\n✓ Resume Builder API running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
});
