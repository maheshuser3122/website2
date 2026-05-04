const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function convertMarkdownToPdf() {
  try {
    // Read markdown file
    const mdPath = path.join(__dirname, 'Storage Access Help Doc V1.md');
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(mdContent);
    
    // Create a professionally styled HTML wrapper
    const styledHtml = `
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
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
          line-height: 1.8;
          color: #2c3e50;
          background: #fff;
          padding: 0;
        }
        
        @page {
          size: A4;
          margin: 30mm 25mm;
          @bottom-center {
            content: "Storage Access - Blob API";
            font-size: 10px;
            color: #95a5a6;
          }
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 10px;
            color: #95a5a6;
          }
        }
        
        @page :first {
          margin-top: 50mm;
          margin-bottom: 40mm;
        }
        
        /* Cover Page Styling */
        h1:first-of-type {
          color: #fff;
          font-size: 3.2em;
          font-weight: 800;
          margin: 60px 0 30px 0;
          padding: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
          page-break-after: avoid;
          box-shadow: 0 12px 24px rgba(102, 126, 234, 0.5);
          text-align: center;
          letter-spacing: -0.5px;
        }
        
        /* Main Heading Styles */
        h2 {
          color: #667eea;
          font-size: 2em;
          font-weight: 800;
          margin-top: 60px;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 5px solid #667eea;
          page-break-after: avoid;
          letter-spacing: -0.3px;
        }
        
        h2:first-of-type {
          margin-top: 0;
        }
        
        /* Sub-heading Styles */
        h3 {
          color: #764ba2;
          font-size: 1.5em;
          font-weight: 700;
          margin-top: 35px;
          margin-bottom: 18px;
          padding-left: 12px;
          border-left: 5px solid #764ba2;
          page-break-after: avoid;
        }
        
        h4 {
          color: #34495e;
          font-size: 1.15em;
          font-weight: 700;
          margin-top: 25px;
          margin-bottom: 15px;
          page-break-after: avoid;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.95em;
        }
        
        /* Paragraph Styling */
        p {
          margin: 14px 0;
          text-align: justify;
          text-justify: inter-word;
          font-size: 0.95em;
          line-height: 1.8;
        }
        
        /* Table of Contents */
        ol ol {
          margin-left: 30px;
        }
        
        ol li {
          margin: 8px 0;
          font-size: 0.95em;
        }
        
        /* Table Styling - Professional Design */
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 30px 0;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          font-size: 0.87em;
          page-break-inside: avoid;
        }
        
        th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 700;
          padding: 18px 16px;
          text-align: left;
          border: none;
          letter-spacing: 0.3px;
        }
        
        td {
          padding: 15px 16px;
          border-bottom: 1px solid #ecf0f1;
          color: #34495e;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f8fafb;
        }
        
        tbody tr:nth-child(odd) {
          background-color: #fff;
        }
        
        tbody tr:hover {
          background-color: #f0f4ff;
        }
        
        /* Code and Pre Styling */
        code {
          background-color: #2c3e50;
          color: #ecf0f1;
          border-radius: 5px;
          padding: 4px 10px;
          font-family: 'Fira Code', 'Monaco', 'Courier New', monospace;
          font-size: 0.88em;
          display: inline-block;
          word-break: break-word;
          font-weight: 500;
        }
        
        pre {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: #ecf0f1;
          border-radius: 12px;
          padding: 24px;
          overflow-x: auto;
          line-height: 1.7;
          margin: 24px 0;
          border-left: 6px solid #667eea;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          font-size: 0.83em;
          page-break-inside: avoid;
        }
        
        pre code {
          background: none;
          color: #ecf0f1;
          padding: 0;
          border-radius: 0;
          display: block;
          word-wrap: break-word;
          white-space: pre-wrap;
          font-weight: normal;
        }
        
        /* Blockquote / Note Styling */
        blockquote {
          border-left: 6px solid #f39c12;
          margin: 24px 0;
          padding: 18px 24px;
          background: #fffaf0;
          border-radius: 0 10px 10px 0;
          color: #7f5a00;
          font-style: italic;
          font-size: 0.95em;
          page-break-inside: avoid;
          box-shadow: 0 4px 12px rgba(243, 156, 18, 0.1);
        }
        
        blockquote strong {
          font-style: normal;
          color: #664d00;
        }
        
        /* Horizontal Rule */
        hr {
          border: none;
          height: 3px;
          background: linear-gradient(to right, transparent, #667eea, #764ba2, #667eea, transparent);
          margin: 50px 0;
          page-break-after: avoid;
        }
        
        /* List Styling */
        ul, ol {
          margin: 18px 0 18px 32px;
          padding-left: 0;
        }
        
        li {
          margin: 12px 0;
          line-height: 1.9;
          color: #34495e;
        }
        
        li strong {
          color: #2c3e50;
          font-weight: 700;
        }
        
        /* Links */
        a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 2px solid rgba(102, 126, 234, 0.3);
          transition: all 0.2s;
        }
        
        a:hover {
          background-color: #f0f4ff;
          border-bottom-color: #667eea;
        }
        
        /* Strong and Emphasis */
        strong {
          color: #2c3e50;
          font-weight: 700;
        }
        
        em {
          color: #555;
          font-style: italic;
        }
        
        /* Section Containers */
        section {
          page-break-inside: avoid;
        }
        
        /* Special Section Styling */
        h2 + ul, h2 + ol, h2 + p {
          margin-top: 20px;
        }
        
        /* API Endpoint Styling */
        h3 code {
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          margin: 0 8px 0 0;
        }
        
        /* Checkmark and X styling */
        .emoji {
          font-size: 1.1em;
          margin-right: 6px;
        }
        
        /* Column Breaker */
        .page-break {
          page-break-after: always;
        }
        
        /* Better vertical spacing */
        h1, h2, h3, h4 {
          page-break-after: avoid;
        }
        
        table, pre, blockquote {
          page-break-inside: avoid;
        }
        
        /* Section Headers with Icons */
        .section-icon {
          display: inline-block;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          text-align: center;
          line-height: 40px;
          color: white;
          margin-right: 12px;
          font-weight: bold;
          font-size: 1.3em;
        }
        
        /* Example box styling */
        .example {
          background: #f0f4ff;
          border-left: 5px solid #667eea;
          padding: 16px;
          margin: 18px 0;
          border-radius: 6px;
          page-break-inside: avoid;
        }
        
        .example h4 {
          color: #667eea;
          margin-top: 0;
          text-transform: none;
          letter-spacing: normal;
        }
        
        /* Error styling */
        .error-box {
          background: #ffe5e5;
          border-left: 5px solid #c0392b;
          padding: 16px;
          margin: 18px 0;
          border-radius: 6px;
        }
        
        /* Success styling */
        .success-box {
          background: #e5ffe5;
          border-left: 5px solid #27ae60;
          padding: 16px;
          margin: 18px 0;
          border-radius: 6px;
        }
        
        /* Security styling */
        .security-box {
          background: #e5f2ff;
          border-left: 5px solid #3498db;
          padding: 16px;
          margin: 18px 0;
          border-radius: 6px;
        }
        
        /* Better spacing between sections */
        body > h2:not(:first-of-type) {
          margin-top: 80px;
        }
        
        /* Table of Contents formatting */
        ul:first-of-type {
          background: #f8fafb;
          padding: 24px 32px;
          border-radius: 10px;
          border-left: 5px solid #667eea;
          margin: 20px 0;
        }
        
        /* Metadata table */
        table:first-of-type {
          background: linear-gradient(135deg, #f0f4ff 0%, #fff 100%);
          border-top: 4px solid #667eea;
          margin-top: 20px;
          margin-bottom: 40px;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>`;
    
    // Launch browser and create PDF
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--disable-gpu', '--no-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setContent(styledHtml, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    const pdfPath = path.join(__dirname, 'Storage Access Help Doc V1.pdf');
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '30mm',
        bottom: '30mm',
        left: '25mm',
        right: '25mm'
      },
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      scale: 1
    });
    
    await browser.close();
    
    console.log(`✓ Professional PDF created successfully: ${pdfPath}`);
    console.log(`✓ Enhancements:`);
    console.log(`  - Premium gradient styling with shadows`);
    console.log(`  - Interactive-friendly navigation structure`);
    console.log(`  - Optimized typography and readability`);
    console.log(`  - Smart page breaks for better flow`);
    console.log(`  - Color-coded sections for easy scanning`);
    console.log(`  - Professional table of contents`);
  } catch (error) {
    console.error('Error converting to PDF:', error);
    process.exit(1);
  }
}

convertMarkdownToPdf();
