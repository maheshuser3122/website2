// To use this file with Node.js:
// 1. Install dependencies: npm install puppeteer
// 2. Run: node create-pdf-report.js
// 3. PDF will be created in same directory as 'report-output.pdf'

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertHtmlToPdf() {
    let browser;
    
    try {
        // Launch browser
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Create a new page
        const page = await browser.newPage();

        // Set viewport for better rendering
        await page.setViewport({ width: 1920, height: 1080 });

        // Path to HTML file
        const htmlFilePath = path.join(__dirname, 'production.html');
        const fileUrl = `file://${htmlFilePath.replace(/\\/g, '/')}`;

        console.log('📄 Loading HTML file:', htmlFilePath);
        
        // Navigate to HTML file
        await page.goto(fileUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for all charts and content to render
        console.log('⏳ Waiting for content to render...');
        await page.waitForTimeout(3000);

        // Generate PDF
        const pdfPath = path.join(__dirname, 'report-output.pdf');
        console.log('📝 Generating PDF...');
        
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            scale: 1,
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 12px; width: 100%; text-align: center; padding: 10px;">
                    Professional Report - <span class="date"></span>
                </div>
            `,
            footerTemplate: `
                <div style="font-size: 12px; width: 100%; text-align: center; padding: 10px;">
                    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            `
        });

        console.log('✅ PDF successfully created!');
        console.log('📁 Location:', pdfPath);
        console.log('📊 File size:', (fs.statSync(pdfPath).size / 1024).toFixed(2), 'KB');

        // Also create a detailed conversion report
        const reportInfo = {
            created: new Date().toISOString(),
            source: htmlFilePath,
            output: pdfPath,
            fileSize: fs.statSync(pdfPath).size,
            format: 'A4',
            printBackground: true,
            status: 'success'
        };

        const reportPath = path.join(__dirname, 'pdf-conversion-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportInfo, null, 2));
        console.log('\n📋 Conversion report saved:', reportPath);

        await browser.close();
        return true;

    } catch (error) {
        console.error('❌ Error converting HTML to PDF:', error.message);
        if (browser) {
            await browser.close();
        }
        return false;
    }
}

// Run the conversion
convertHtmlToPdf().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
