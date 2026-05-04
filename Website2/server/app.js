/**
 * Website2 - Main Express Server
 * Serves all integrated applications (Invoice, Report, Resume, TDS Manager)
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

console.log('DEBUG Paths:');
console.log('  __filename:', __filename);
console.log('  __dirname:', __dirname);
console.log('  rootDir:', rootDir);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========== MIDDLEWARE ==========

// Logging
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(join(rootDir, 'public')));

// ========== ROUTES ==========

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '2.0.0'
  });
});

// API Status
app.get('/api/status', (req, res) => {
  res.json({
    portal: 'OK',
    invoiceGenerator: process.env.INVOICE_PORT || 'not configured',
    reportGenerator: process.env.REPORT_PORT || 'not configured',
    timestamp: new Date().toISOString()
  });
});

// Serve Dashboard
app.get('/', (req, res) => {
  res.sendFile(join(rootDir, 'apps/dashboard/index.html'));
});

// Serve Admin Dashboard
app.get('/admin', (req, res) => {
  res.sendFile(join(rootDir, 'apps/dashboard/admin.html'));
});

// Serve Invoice Generator (frontend only)
app.use('/apps/invoice-generator', express.static(join(rootDir, 'apps/invoice-generator/frontend')));

// Serve Report Generator (frontend only)
app.use('/apps/report-generator', express.static(join(rootDir, 'apps/report-generator/frontend')));

// Serve Resume Builder (frontend only)
app.use('/apps/resume-builder', express.static(join(rootDir, 'apps/resume-builder/frontend')));

// Serve TDS Manager (frontend only)
app.use('/apps/tds-manager', express.static(join(rootDir, 'apps/tds-manager/frontend')));

// AI Chat API
app.post('/api/chat', (req, res) => {
  const { messages } = req.body;
  
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  // Get the last user message
  const lastMessage = messages[messages.length - 1];
  const userText = (lastMessage.content || '').toLowerCase().trim();

  // Keyword patterns with priority (higher = more specific)
  const patterns = [
    {
      priority: 100,
      keywords: ['training', 'course', 'learn', 'certification', 'certificate', 'upskill', 'teach'],
      response: "Great! We offer extensive training in:\n\n• **Cloud Technologies** - Azure, AWS certifications\n• **Programming** - Python, Java, JavaScript, React\n• **DevOps & CI/CD** - Kubernetes, Docker, Jenkins\n• **Data Science** - Machine Learning & Analytics\n• **Cybersecurity** - Ethical hacking, compliance\n\nWhich area interests you most?"
    },
    {
      priority: 100,
      keywords: ['recruit', 'hiring', 'hire', 'job', 'career', 'position', 'join us', 'work with', 'employment', 'vacancy'],
      response: "Excellent! We're always looking for talented professionals. We hire for:\n\n• **Software Developers** - Full-stack, frontend, backend\n• **DevOps Engineers** - Cloud infrastructure specialists\n• **Business Analysts** - Process improvement experts\n• **Support Specialists** - Customer success champions\n• **Managers & Leads** - Technical leadership roles\n\nWould you like to explore opportunities?"
    },
    {
      priority: 100,
      keywords: ['invoice', 'billing', 'payment', 'cost', 'price', 'pricing', 'rate', 'quote', 'charge', 'expense'],
      response: "We provide transparent, flexible billing:\n\n• **Hourly Rates** - For consulting & support\n• **Project-Based** - Fixed pricing for defined scope\n• **Monthly Retainers** - Ongoing support packages\n• **Enterprise Licenses** - Volume discounts available\n\nPlease contact sales at info@mcharvtechlabs.com for a custom quote."
    },
    {
      priority: 100,
      keywords: ['location', 'office', 'where', 'uk', 'india', 'us', 'ireland', 'country', 'region', 'headquarters'],
      response: "Mc'Harv Techlabs operates globally:\n\n• 🇬🇧 **United Kingdom** - EU Tech Hub\n• 🇮🇳 **India** - Development & Support Center\n• 🇺🇸 **United States** - Client Operations\n• 🇮🇪 **Ireland** - Regional Office\n\nWe're a DPIIT-recognised Startup India certified company. How can we serve you?"
    },
    {
      priority: 100,
      keywords: ['contact', 'email', 'phone', 'whatsapp', 'call', 'reach', 'support number', 'number', 'address'],
      response: "You can reach us anytime:\n\n📧 **Email:** info@mcharvtechlabs.com\n📱 **WhatsApp:** +44 7771 090667\n🌐 **Website:** mcharvtechlabs.com\n\nOur team is ready to help! Is there anything specific I can assist with?"
    },
    {
      priority: 90,
      keywords: ['support', 'help', 'issue', 'problem', 'bug', 'error', 'technical', 'troubleshoot', 'fix'],
      response: "I'd be happy to help! Mc'Harv Techlabs offers comprehensive IT support including:\n\n• **24/7 Technical Support** - Rapid issue resolution\n• **System Administration** - Infrastructure management\n• **Cloud Solutions** - Azure, AWS deployment\n• **Security Services** - Data protection & compliance\n\nWhat specific support do you need?"
    },
    {
      priority: 80,
      keywords: ['service', 'what', 'offer', 'do', 'provide', 'solution', 'product', 'can you'],
      response: "Mc'Harv Techlabs provides comprehensive services:\n\n• **IT Support & Consulting** - 24/7 technical assistance\n• **Cloud Solutions** - Azure, AWS, infrastructure\n• **Training & Certification** - Professional development\n• **Recruitment & Staffing** - Top tech talent\n• **Development** - Custom software solutions\n• **Automation** - Process optimization\n\nWhich service interests you?"
    },
    {
      priority: 50,
      keywords: ['hello', 'hi', 'hey', 'namaste', 'greetings', 'good morning', 'good afternoon', 'good evening'],
      response: "Namaste! 🙏 I'm **Tech Maharshi**, Mc'Harv Techlabs' AI assistant. Whether you need tech support, training, recruitment or a custom solution — I'm here to help. What can I guide you with today?"
    },
    {
      priority: 30,
      keywords: ['thank', 'thanks', 'bye', 'goodbye', 'exit', 'quit'],
      response: "Thank you for reaching out! 🙏 Feel free to come back anytime. For urgent matters, contact us directly at info@mcharvtechlabs.com or WhatsApp +44 7771 090667. Have a great day!"
    }
  ];

  // Score each pattern based on keyword matches
  let bestMatch = null;
  let bestScore = 0;

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    let hasMatch = false;
    let matched = [];
    
    for (const keyword of pattern.keywords) {
      // Use word boundaries to avoid partial matches like "hi" in "hire"
      const regex = new RegExp(`\\b${keyword}\\b`);
      if (regex.test(userText)) {
        hasMatch = true;
        matched.push(keyword);
        break; // Stop after first match for this pattern
      }
    }
    
    const score = hasMatch ? pattern.priority : 0;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  // Use matched response or default
  const reply = bestMatch?.response || "I'm here to help with questions about Mc'Harv Techlabs! You can ask me about:\n\n• **Our Services** - Tech support, training, recruitment, consulting\n• **Locations** - We operate in UK, India, US & Ireland\n• **Hiring** - Career opportunities with our team\n• **Contact** - How to reach us\n• **Billing** - Pricing & packages\n\nWhat would you like to know?";

  // Send response in Claude-like format
  res.json({
    content: [{ type: 'text', text: reply }]
  });
});

// ========== ERROR HANDLING ==========

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Website2 - Business Portal Server   ║
╚════════════════════════════════════════╝

✓ Server running on http://localhost:${PORT}
✓ Environment: ${NODE_ENV}
✓ Node version: ${process.version}

📱 Applications:
  • Dashboard: http://localhost:${PORT}/
  • Admin Panel: http://localhost:${PORT}/admin
  • Invoice Generator: http://localhost:${PORT}/apps/invoice-generator
  • Report Generator: http://localhost:${PORT}/apps/report-generator
  • Resume Builder: http://localhost:${PORT}/apps/resume-builder
  • TDS Manager: http://localhost:${PORT}/apps/tds-manager

✓ API Status: http://localhost:${PORT}/api/status
✓ Health Check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Server shutting down gracefully...');
  process.exit(0);
});
