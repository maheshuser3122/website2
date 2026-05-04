const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function convertMarkdownToPdf() {
  try {
    // Read markdown file
    const mdPath = path.join(__dirname, 'Storage Access Help Doc V1.md');
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    
    // Configure marked with better rendering
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    
    // Convert markdown to HTML
    let htmlContent = marked.parse(mdContent);
    
    // Create a premium styled HTML wrapper
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
        
        html, body {
          width: 100%;
          height: 100%;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.8;
          color: #333333;
          background: #ffffff;
        }
        
        @page {
          size: A4;
          margin: 20mm 25mm;
          @bottom-center {
            content: "Page " counter(page);
            font-size: 10px;
            color: #999;
          }
        }
        
        @page :first {
          margin-top: 8mm;
          margin-bottom: 20mm;
          @bottom-center {
            content: none;
          }
        }
        
        /* Main Title - Clean Blue */
        h1 {
          color: #ffffff;
          font-size: 2.6em;
          font-weight: 700;
          margin: 0 0 10px 0;
          padding: 20px 20px;
          background-color: #4472C4;
          border-radius: 4px;
          page-break-after: avoid;
          text-align: center;
        }
        
        /* Section Headers - Clean Blue */
        h2 {
          color: #ffffff;
          font-size: 1.5em;
          font-weight: 700;
          margin: 18px 0 10px 0;
          padding: 10px 12px;
          background-color: #4472C4;
          border-radius: 4px;
          page-break-after: avoid;
          break-after: avoid;
        }
        
        /* Sub-headers */
        h3 {
          color: #4472C4;
          font-size: 1.1em;
          font-weight: 700;
          margin: 12px 0 6px 0;
          page-break-after: avoid;
          break-after: avoid;
          orphans: 3;
          widows: 3;
        }
        
        h4 {
          color: #333333;
          font-size: 0.95em;
          font-weight: 700;
          margin: 10px 0 5px 0;
          page-break-after: avoid;
          break-after: avoid;
          orphans: 3;
          widows: 3;
        }
        
        /* Paragraphs */
        p {
          margin: 8px 0;
          font-size: 0.95em;
          line-height: 1.7;
          color: #333333;
          orphans: 3;
          widows: 3;
        }
        
        /* Lists */
        ul, ol {
          margin: 5px 0 5px 18px;
          padding-left: 0;
          break-inside: avoid;
        }
        
        li {
          margin: 2px 0;
          line-height: 1.5;
          color: #333333;
          font-size: 0.9em;
          break-inside: avoid;
        }
        
        /* Tables */
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
          background: white;
          border: 1px solid #ddd;
          font-size: 0.85em;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        th {
          background-color: #4472C4;
          color: white;
          font-weight: 700;
          padding: 8px 8px;
          text-align: left;
          border: 1px solid #4472C4;
          font-size: 0.9em;
        }
        
        td {
          padding: 7px 8px;
          border: 1px solid #ddd;
          color: #333333;
          font-size: 0.9em;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        
        tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }
        
        /* Code - Simple Light Background */
        code {
          background-color: #f0f0f0;
          color: #c41a16;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          word-break: break-word;
        }
        
        pre {
          background-color: #f5f5f5;
          color: #333333;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          line-height: 1.5;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-left: 4px solid #4472C4;
          font-size: 0.85em;
          page-break-inside: avoid;
          break-inside: avoid;
          font-family: 'Courier New', monospace;
          word-wrap: break-word;
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }
        
        pre code {
          background-color: transparent;
          color: #333333;
          padding: 0;
          border-radius: 0;
          display: block;
          word-wrap: break-word;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        /* Blockquote - Light Styling */
        blockquote {
          border-left: 4px solid #4472C4;
          margin: 12px 0;
          padding: 10px 12px;
          background-color: #f9f9f9;
          color: #555555;
          font-style: italic;
          font-size: 0.95em;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        blockquote strong {
          font-style: normal;
          color: #333333;
          font-weight: 700;
        }
        
        /* Horizontal Rules */
        hr {
          border: none;
          height: 1px;
          background-color: #dddddd;
          margin: 20px 0;
          page-break-after: avoid;
        }
        
        /* Links */
        a {
          color: #4472C4;
          text-decoration: none;
          font-weight: 600;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        /* Strong Text */
        strong {
          color: #333333;
          font-weight: 700;
        }
        
        /* Emphasis */
        em {
          color: #555555;
          font-style: italic;
          font-weight: 500;
        }
        
        /* Better Content Flow */
        h2, h3, h4, table, pre, blockquote {
          page-break-inside: avoid;
          break-inside: avoid;
          page-break-after: avoid;
          break-after: avoid;
        }
        
        /* Better paragraph spacing in lists */
        li > p {
          margin: 3px 0;
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
      args: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({
      width: 1000,
      height: 1400,
      deviceScaleFactor: 1
    });
    
    await page.setContent(styledHtml, { 
      waitUntil: 'networkidle0',
      timeout: 60000
    });
    
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
      displayHeaderFooter: true,
      preferCSSPageSize: false,
      scale: 1.0
    });
    
    await browser.close();
    
    console.log(`✓ PDF created successfully!`);
    console.log(`\n📄 File: ${pdfPath}`);
    console.log(`\n✨ Features:`);
    console.log(`  ✓ Clean blue headers (#4472C4)`);
    console.log(`  ✓ Professional table styling`);
    console.log(`  ✓ Light background colors`);
    console.log(`  ✓ Optimized typography`);
    console.log(`  ✓ Smart page breaks`);
    console.log(`  ✓ Simple, readable layout`);
  } catch (error) {
    console.error('Error converting to PDF:', error);
    process.exit(1);
  }
}

convertMarkdownToPdf();
