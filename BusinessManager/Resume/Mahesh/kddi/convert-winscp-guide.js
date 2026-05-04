const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

async function convertMarkdownToPdf() {
  try {
    console.log('🔄 Converting WinSCP Guide to PDF...');
    
    // Read markdown file
    const mdPath = path.join(__dirname, 'WinSCP_SFTP_Connection_Guide.md');
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    
    // Configure marked with better rendering
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    
    // Convert markdown to HTML
    let htmlContent = marked.parse(mdContent);
    
    // Create professionally styled HTML wrapper
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
          line-height: 1.7;
          color: #333333;
          background: #ffffff;
          padding: 0;
        }
        
        @page {
          size: A4;
          margin: 20mm 25mm;
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 9px;
            color: #999;
          }
        }
        
        @page :first {
          margin-top: 15mm;
          @bottom-center {
            content: none;
          }
        }
        
        /* Main Title */
        h1 {
          color: #ffffff;
          font-size: 2.8em;
          font-weight: 800;
          margin: 0 0 20px 0;
          padding: 30px 25px;
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          border-radius: 8px;
          page-break-after: avoid;
          text-align: center;
          letter-spacing: -0.5px;
          box-shadow: 0 8px 16px rgba(30, 64, 175, 0.2);
        }
        
        /* Section Headers */
        h2 {
          color: #ffffff;
          font-size: 1.6em;
          font-weight: 700;
          margin: 30px 0 15px 0;
          padding: 12px 16px;
          background-color: #1e40af;
          border-radius: 4px;
          page-break-after: avoid;
          break-after: avoid;
          letter-spacing: -0.3px;
        }
        
        /* Sub-headers */
        h3 {
          color: #1e40af;
          font-size: 1.3em;
          font-weight: 700;
          margin: 20px 0 10px 0;
          page-break-after: avoid;
          break-after: avoid;
          padding-left: 8px;
          border-left: 4px solid #1e40af;
        }
        
        h4 {
          color: #2d5a8c;
          font-size: 1.1em;
          font-weight: 700;
          margin: 15px 0 8px 0;
          page-break-after: avoid;
        }
        
        /* Paragraph spacing */
        p {
          margin: 12px 0;
          text-align: justify;
          widows: 3;
          orphans: 3;
        }
        
        /* Lists */
        ul, ol {
          margin: 12px 0 12px 30px;
          line-height: 1.8;
        }
        
        li {
          margin: 6px 0;
          widows: 3;
          orphans: 3;
        }
        
        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          page-break-inside: avoid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        thead {
          background-color: #1e40af;
          color: white;
        }
        
        th {
          padding: 12px;
          text-align: left;
          font-weight: 700;
          border: 1px solid #1e40af;
        }
        
        td {
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        tbody tr:hover {
          background-color: #f3f4f6;
        }
        
        /* Code blocks */
        pre {
          background-color: #1f2937;
          color: #e5e7eb;
          padding: 15px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
          font-family: 'Courier New', monospace;
          font-size: 0.95em;
          line-height: 1.6;
          border-left: 4px solid #1e40af;
          page-break-inside: avoid;
        }
        
        code {
          background-color: #f3f4f6;
          color: #1f2937;
          padding: 3px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.95em;
        }
        
        pre code {
          background-color: transparent;
          color: #e5e7eb;
          padding: 0;
          font-size: 0.95em;
        }
        
        /* Blockquotes */
        blockquote {
          border-left: 4px solid #1e40af;
          padding: 12px 0 12px 15px;
          margin: 12px 0;
          color: #4b5563;
          font-style: italic;
          background-color: #f9fafb;
          page-break-inside: avoid;
        }
        
        /* Dividers */
        hr {
          border: none;
          height: 2px;
          background-color: #e5e7eb;
          margin: 30px 0;
          page-break-after: avoid;
        }
        
        /* Emphasis */
        strong {
          font-weight: 700;
          color: #1e40af;
        }
        
        em {
          font-style: italic;
        }
        
        /* Links */
        a {
          color: #1e40af;
          text-decoration: none;
          border-bottom: 1px dotted #1e40af;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        /* Checkmarks and icons */
        .emoji {
          font-family: 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
        }
        
        /* Table of Contents */
        nav ul {
          list-style-type: none;
          margin: 15px 0;
        }
        
        nav ul li {
          margin: 5px 0;
          padding-left: 15px;
        }
        
        nav ul li:before {
          content: "▸ ";
          color: #1e40af;
          font-weight: bold;
          margin-left: -10px;
        }
        
        /* Page breaks */
        div[style*="page-break"] {
          page-break-before: always;
          margin-top: 0;
        }
        
        /* First paragraph of sections */
        h2 + p, h3 + p {
          margin-top: 12px;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
    `;
    
    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfPath = path.join(__dirname, 'WinSCP_SFTP_Connection_Guide.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '25mm',
        bottom: '20mm',
        left: '25mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();
    console.log('✅ PDF created: WinSCP_SFTP_Connection_Guide.pdf');
    
  } catch (error) {
    console.error('❌ Error converting to PDF:', error);
    process.exit(1);
  }
}

async function convertMarkdownToDocx() {
  try {
    console.log('🔄 Converting WinSCP Guide to Word Document...');
    
    // Run Python script
    try {
      execSync('.venv\\Scripts\\python.exe convert_md_to_docx.py', {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      console.log('✅ Word document created successfully');
    } catch (error) {
      console.error('❌ Error converting to Word:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error during Word conversion:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('📄 Starting WinSCP Guide Conversion...\n');
  
  try {
    await convertMarkdownToPdf();
    console.log();
    await convertMarkdownToDocx();
    
    console.log('\n✅ All conversions completed successfully!');
    console.log('📁 Output files:');
    console.log('   • WinSCP_SFTP_Connection_Guide.pdf');
    console.log('   • WinSCP_SFTP_Connection_Guide.docx');
    console.log('   • WinSCP_SFTP_Connection_Guide.md (original)');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

main();
