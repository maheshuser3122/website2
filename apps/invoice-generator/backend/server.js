const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// DO NOT serve static files from backend - this is API only

// Email Configuration
let transporter;

function initializeEmailTransport() {
  const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };

  // Support for custom SMTP servers
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      connectionTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    transporter = nodemailer.createTransport(emailConfig);
  }
}

// Initialize on startup
initializeEmailTransport();

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Invoice Generator Server is running' });
});

// Get logo as base64
function getLogoBase64() {
  try {
    const logoPath = path.join(__dirname, 'logo.avif');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return 'data:image/avif;base64,' + logoBuffer.toString('base64');
    }
  } catch (error) {
    console.error('Error reading logo:', error);
  }
  return null;
}

// Send Invoice Email with PDF Attachment
app.post('/api/send-invoice', async (req, res) => {
  let browser;
  try {
    console.log('[API] POST /api/send-invoice received', { bodyKeys: Object.keys(req.body || {}), bodySize: JSON.stringify(req.body || {}).length });
    
    const { invoiceHTML, emailTo, emailCC, emailBCC, recipientName, invoiceNumber, companyName, grandTotal, amountInWords, servicePeriod } = req.body;

    // Validate input
    if (!invoiceHTML || !emailTo || emailTo.length === 0) {
      console.log('[API] Validation failed', { hasHTML: !!invoiceHTML, hasEmails: !!emailTo, emailCount: emailTo?.length });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: invoiceHTML and emailTo'
      });
    }

    // Check if email is configured
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;
    
    if (!hasEmailConfig && !hasSmtpConfig) {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured. Please set EMAIL_USER/EMAIL_PASSWORD or SMTP configuration in .env file.'
      });
    }

    // Extract invoice data from HTML for professional PDF rendering
    // Replace logo path with base64 for PDF generation
    let processedInvoiceHTML = invoiceHTML;
    const logoBase64 = getLogoBase64();
    if (logoBase64) {
      processedInvoiceHTML = invoiceHTML.replace(/src="\.\/logo\.avif"/g, `src="${logoBase64}"`);
    }
    
    // Use the invoice HTML directly with all its styling preserved
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: #333;
          }
          
          body > div {
            padding: 20px;
          }
        </style>
      </head>
      <body>
        ${processedInvoiceHTML}
      </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    // Use system Chrome on production, download on local dev
    const launchOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };
    
    // On Render (production), use system-installed chromium
    if (process.env.NODE_ENV === 'production') {
      launchOptions.executablePath = '/usr/bin/chromium-browser' || '/usr/bin/chromium';
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    await page.setContent(fullHTML, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '3mm', bottom: '3mm', left: '5mm', right: '5mm' },
      printBackground: true,
      preferCSSPageSize: false,
      scale: 1
    });
    await browser.close();
    browser = null;

    // Prepare email with attachment
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: emailTo.join(','),
      cc: emailCC && emailCC.length > 0 ? emailCC.join(',') : undefined,
      bcc: emailBCC && emailBCC.length > 0 ? emailBCC.join(',') : undefined,
      subject: `Invoice ${invoiceNumber} from ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
            .email-wrapper { background-color: #f5f7fa; padding: 20px; }
            .email-container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
            .header-banner { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px 20px; text-align: center; border-bottom: 4px solid #3498db; }
            .company-logo { font-size: 28px; font-weight: bold; color: #ffffff; margin-bottom: 10px; letter-spacing: 2px; }
            .header-title { font-size: 24px; color: #ffffff; margin: 10px 0; font-weight: 300; }
            .header-subtitle { font-size: 13px; color: #ecf0f1; letter-spacing: 1px; }
            .content { padding: 40px; color: #2c3e50; line-height: 1.7; }
            .greeting { font-size: 16px; color: #2c3e50; margin-bottom: 20px; }
            .greeting strong { color: #34495e; }
            .message-block { background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .message-block p { margin: 8px 0; font-size: 14px; color: #555; }
            .highlight { background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .highlight strong { color: #2c3e50; }
            .amount-display { text-align: center; margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%); border-radius: 4px; }
            .amount-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; }
            .amount-value { font-size: 32px; color: #2c3e50; font-weight: bold; margin: 10px 0; }
            .amount-words { font-size: 13px; color: #555; font-style: italic; }
            .action-items { margin: 25px 0; }
            .action-item { padding: 12px; background-color: #f8f9fa; margin-bottom: 10px; border-radius: 4px; border-left: 3px solid #3498db; font-size: 14px; }
            .action-item strong { color: #34495e; }
            .divider { border: 0; border-top: 2px solid #ecf0f1; margin: 30px 0; }
            .signature-block { margin-top: 30px; }
            .signature-title { font-size: 14px; color: #2c3e50; font-weight: 600; margin-bottom: 15px; }
            .signature-name { font-size: 16px; color: #34495e; font-weight: bold; margin-bottom: 3px; }
            .signature-company { font-size: 13px; color: #3498db; font-weight: 600; margin-bottom: 10px; }
            .contact-info { font-size: 12px; color: #7f8c8d; margin: 4px 0; }
            .contact-info a { color: #3498db; text-decoration: none; }
            .contact-info a:hover { text-decoration: underline; }
            .icon { display: inline-block; margin-right: 5px; }
            .footer-banner { background-color: #2c3e50; padding: 30px 20px; text-align: center; }
            .footer-content { color: #ecf0f1; font-size: 12px; }
            .footer-content p { margin: 8px 0; }
            .footer-content a { color: #3498db; text-decoration: none; }
            .footer-content a:hover { text-decoration: underline; }
            .footer-divider { color: #555; margin: 0 8px; }
            .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 12px 25px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 13px; margin: 20px 0; }
            .button:hover { background-color: #2980b9; }
            .warning-note { background-color: #fee; border-left: 4px solid #e74c3c; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 12px; color: #c0392b; }
            ul { margin: 15px 0; padding-left: 20px; }
            li { margin: 8px 0; font-size: 14px; color: #555; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              
              <!-- Header Banner -->
              <div class="header-banner" style="text-align: center;">
                <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                  <img src="cid:logoImage" alt="    MCHARV TECHLABS" style="height: 45px; vertical-align: middle;">
                  <div style="font-size: 28px; font-weight: bold; color: #ffffff; margin: 0; letter-spacing: 2px;">MCHARV TECHLABS</div>
                </div>
                <div class="header-title">Invoice Notification</div>
                <div class="header-subtitle">Professional Services Invoice</div>
              </div>
              
              <!-- Main Content -->
              <div class="content">
                
                <div class="greeting">
                  Dear <strong>${recipientName || 'Valued Client'}</strong>,
                </div>
                
                <p style="margin-top: 20px; font-size: 15px;">I hope this message finds you well.</p>
                
                <div class="message-block">
                  <p><strong>✓ Invoice Ready for Review</strong></p>
                  <p>Please find attached the invoice <strong>(Ref: ${invoiceNumber})</strong> for services rendered to <strong>${recipientName || companyName}</strong>.</p>
                </div>
                
                <!-- Service Details -->
                <div style="margin: 25px 0;">
                  <h3 style="color: #2c3e50; margin-bottom: 12px; font-size: 15px;">Service Details</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;">
                      <span style="color: #3498db;">▸</span> <strong>${servicePeriod || 'Professional Services'}</strong>
                    </li>
                  </ul>
                </div>
                
                <!-- Amount Display -->
                <div class="amount-display">
                  <div class="amount-label">Invoice Amount Due</div>
                  <div class="amount-value">$${grandTotal || '0.00'}</div>
                  <div class="amount-words">${amountInWords || 'Amount'} Only</div>
                </div>
                
                <!-- Action Items -->
                <div class="action-items">
                  <div class="action-item">
                    <strong>📋 What to Do Next:</strong> Please review the attached invoice and refer to the bank details provided for payment processing.
                  </div>
                  <div class="action-item">
                    <strong>⏰ Payment Timeline:</strong> We would appreciate if the payment could be processed at your earliest convenience.
                  </div>
                  <div class="action-item">
                    <strong>❓ Questions?</strong> Should you have any questions or require further clarification, please don't hesitate to reach out.
                  </div>
                </div>
                
                <p style="margin: 25px 0; color: #555; font-size: 15px;">
                  Thank you for your continued trust and collaboration. We value your business and look forward to serving you further.
                </p>
                
                <hr class="divider">
                
                <!-- Signature Block -->
                <div class="signature-block">
                  <p style="margin: 0 0 15px 0; font-size: 15px; font-weight: 600; color: #2c3e50;">Warm regards,</p>
                  <div class="signature-name">Harshitha B P</div>
                  <div class="signature-company">${companyName}</div>
                  <div class="contact-info">
                    <span class="icon">📧</span>
                    <a href="mailto:harshithabp@mcharvtechlabs.com">harshithabp@mcharvtechlabs.com</a>
                  </div>
                  <div class="contact-info">
                    <span class="icon">📞</span>
                    +91-7259850838 / +44-7771090667
                  </div>
                </div>
                
                <hr class="divider">
                
                <!-- Important Note -->
                <div class="warning-note">
                  <strong>📌 Important:</strong> Please mention invoice number <strong>${invoiceNumber}</strong> in your payment reference for faster processing.
                </div>
                
              </div>
              
              <!-- Footer -->
              <div class="footer-banner">
                <div class="footer-content">
                  <p style="margin-top: 0;"><strong>${companyName}</strong></p>
                  <p>
                    <a href="https://mcharvtechlabs.com">🌐 Visit Our Website</a>
                    <span class="footer-divider">|</span>
                    <a href="mailto:info@mcharvtechlabs.com">📧 Contact Us</a>
                  </p>
                  <p style="margin-bottom: 0; color: #95a5a6;">
                    This is an automated email from our invoicing system. Please do not reply to this email directly.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </body>
        </html>
      `,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_USER,
      attachments: [
        {
          filename: `Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        },
        {
          filename: 'logo.jpg',
          path: path.join(__dirname, 'company-logo.jpg'),
          cid: 'logoImage'
        }
      ]
    };

    // Check if logo file exists before sending
    const logoPath = path.join(__dirname, 'company-logo.jpg');
    if (!fs.existsSync(logoPath)) {
      console.warn('Logo file not found at:', logoPath);
      // Remove logo attachment if it doesn't exist
      mailOptions.attachments = mailOptions.attachments.filter(att => att.cid !== 'logoImage');
    }

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Email Error:', err);
        return res.status(500).json({
          success: false,
          message: `Failed to send invoice: ${err.message}`
        });
      }

      const allRecipients = [...emailTo, ...(emailCC || []), ...(emailBCC || [])];
      console.log('Invoice sent successfully to:', allRecipients.join(', '));
      res.json({
        success: true,
        message: 'Invoice sent successfully with PDF attachment',
        info: info.response
      });
    });

  } catch (error) {
    console.error('Send Invoice Error:', error);
    if (browser) {
      await browser.close();
    }
    res.status(500).json({
      success: false,
      message: `Failed to send invoice: ${error.message || 'Unknown error'}`
    });
  }
});

// Test Email Configuration
app.post('/api/test-email', async (req, res) => {
  try {
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;
    
    if (!hasEmailConfig && !hasSmtpConfig) {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured'
      });
    }

    const testMail = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER,
      to: req.body.testEmail,
      subject: 'Invoice Generator - Test Email',
      html: '<h1>Test Email</h1><p>If you received this, email configuration is working correctly!</p>'
    };

    const info = await transporter.sendMail(testMail);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      info: info.response
    });
  } catch (error) {
    console.error('Test Email Error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to send test email: ${error.message || 'Unknown error'}`
    });
  }
});

// Get Email Status
app.get('/api/email-status', (req, res) => {
  const hasEmailConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  const isConfigured = hasEmailConfig || hasSmtpConfig;
  
  let user = 'not configured';
  let service = 'not configured';
  
  if (hasSmtpConfig) {
    service = `${process.env.SMTP_HOST} (SMTP)`;
    user = process.env.SMTP_USER.replace(/(.{2})(.*)(.{2})/, '$1****$3');
  } else if (hasEmailConfig) {
    service = process.env.EMAIL_SERVICE || 'gmail';
    user = process.env.EMAIL_USER.replace(/(.{2})(.*)(.{2})/, '$1****$3');
  }
  
  res.json({
    configured: isConfigured,
    service: service,
    user: user
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Invoice Generator API is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Invoice Generator Server Running     ║
╠════════════════════════════════════════╣
║ URL: http://${HOST}:${PORT}${' '.repeat(18 - HOST.length - PORT.toString().length)} ║
║ Email Service: ${isEmailConfigured() ? 'CONFIGURED' : 'NOT CONFIGURED'} ${' '.repeat(18 - (isEmailConfigured() ? 'CONFIGURED' : 'NOT CONFIGURED').length)}║
╚════════════════════════════════════════╝
  `);
});

function isEmailConfigured() {
  const hasEmailConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  return hasEmailConfig || hasSmtpConfig;
}

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
