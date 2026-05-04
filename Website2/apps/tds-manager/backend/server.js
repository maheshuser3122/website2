/**
 * TDS Manager - Backend API Server
 * Handles TDS data storage and retrieval
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
const PORT = process.env.TDS_PORT || 3004;

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
  res.json({ status: 'OK', service: 'tds-manager' });
});

// Get all TDS entries
app.get('/api/tds-entries', (req, res) => {
  try {
    const dataFile = join(dataDir, 'tds-entries.json');

    if (!fs.existsSync(dataFile)) {
      return res.json({ entries: [] });
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    res.json({ entries: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add TDS entry
app.post('/api/tds-entries', (req, res) => {
  try {
    const { entry } = req.body;

    if (!entry) {
      return res.status(400).json({ error: 'Missing entry data' });
    }

    const dataFile = join(dataDir, 'tds-entries.json');
    let entries = [];

    if (fs.existsSync(dataFile)) {
      entries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }

    // Add timestamp and ID
    const newEntry = {
      id: Date.now(),
      ...entry,
      createdAt: new Date().toISOString()
    };

    entries.push(newEntry);
    fs.writeFileSync(dataFile, JSON.stringify(entries, null, 2));

    res.json({
      success: true,
      entry: newEntry,
      message: 'TDS entry added successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TDS entry
app.get('/api/tds-entries/:id', (req, res) => {
  try {
    const dataFile = join(dataDir, 'tds-entries.json');

    if (!fs.existsSync(dataFile)) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const entry = entries.find(e => e.id === parseInt(req.params.id));

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update TDS entry
app.put('/api/tds-entries/:id', (req, res) => {
  try {
    const { entry } = req.body;
    const dataFile = join(dataDir, 'tds-entries.json');

    if (!fs.existsSync(dataFile)) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    let entries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const index = entries.findIndex(e => e.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    entries[index] = { ...entries[index], ...entry, updatedAt: new Date().toISOString() };
    fs.writeFileSync(dataFile, JSON.stringify(entries, null, 2));

    res.json({
      success: true,
      entry: entries[index],
      message: 'TDS entry updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete TDS entry
app.delete('/api/tds-entries/:id', (req, res) => {
  try {
    const dataFile = join(dataDir, 'tds-entries.json');

    if (!fs.existsSync(dataFile)) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    let entries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const index = entries.findIndex(e => e.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const deleted = entries.splice(index, 1);
    fs.writeFileSync(dataFile, JSON.stringify(entries, null, 2));

    res.json({
      success: true,
      message: 'TDS entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TDS summary
app.get('/api/tds-summary', (req, res) => {
  try {
    const dataFile = join(dataDir, 'tds-entries.json');

    if (!fs.existsSync(dataFile)) {
      return res.json({
        total: 0,
        totalAmount: 0,
        totalTds: 0,
        count: 0
      });
    }

    const entries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    const summary = {
      total: entries.length,
      totalAmount: entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
      totalTds: entries.reduce((sum, e) => sum + (parseFloat(e.tdsDeducted) || 0), 0),
      count: entries.length,
      entries: entries
    };

    res.json(summary);
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
  console.log(`\n✓ TDS Manager API running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
});
