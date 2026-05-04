// Multi-file PDF Converter for Report Generator
// Converts multiple HTML files to PDF in batch mode
// 
// Usage:
// 1. Install dependency: npm install puppeteer
// 2. Run: node convert-all-to-pdf.js
// 3. All PDFs will be created in same directory

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration: HTML files to convert
const HTML_FILES_TO_CONVERT = [
    {
        name: 'production.html',
        pdfName: 'production-report.pdf',
        waitTime: 3000,
        scale: 1.0
    },
    {
        name: 'professional.html',
        pdfName: 'professional-report.pdf',
        waitTime: 3000,
        scale: 1.0
    },
    {
        name: 'index.html',
        pdfName: 'index-report.pdf',
        waitTime: 2000,
        scale: 0.9
    }
];

async function convertHtmlsToPdf() {
    let browser;
    const results = {
        successful: [],
        failed: [],
        startTime: new Date().toISOString(),
        conversions: {}
    };

    try {
        console.log('🚀 Launching Puppeteer browser...\n');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Process each HTML file
        for (const file of HTML_FILES_TO_CONVERT) {
            console.log(`\n📄 Processing: ${file.name}`);
            console.log('─'.repeat(50));

            try {
                const page = await browser.newPage();
                await page.setViewport({ width: 1920, height: 1080 });

                const htmlFilePath = path.join(__dirname, file.name);

                // Check if file exists
                if (!fs.existsSync(htmlFilePath)) {
                    console.warn(`⚠️  File not found: ${htmlFilePath}`);
                    results.failed.push({
                        file: file.name,
                        error: 'File not found',
                        timestamp: new Date().toISOString()
                    });
                    continue;
                }

                const fileUrl = `file://${htmlFilePath.replace(/\\/g, '/')}`;
                console.log(`🌐 Loading: ${fileUrl}`);

                // Load the HTML file
                await page.goto(fileUrl, {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                });

                // Wait for content to render
                console.log(`⏳ Waiting ${file.waitTime}ms for content rendering...`);
                await page.waitForTimeout(file.waitTime);

                // Generate PDF
                const pdfPath = path.join(__dirname, file.pdfName);
                console.log(`📝 Generating PDF: ${file.pdfName}`);

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
                    scale: file.scale,
                    displayHeaderFooter: true,
                    headerTemplate: `
                        <div style="font-size: 11px; width: 100%; text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">
                            ${file.name.replace('.html', ' Report').toUpperCase()} - <span class="date"></span>
                        </div>
                    `,
                    footerTemplate: `
                        <div style="font-size: 11px; width: 100%; text-align: center; padding: 10px; border-top: 1px solid #ddd;">
                            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                        </div>
                    `
                });

                // Get file stats
                const fileStats = fs.statSync(pdfPath);
                const fileSizeKB = (fileStats.size / 1024).toFixed(2);
                const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

                console.log(`✅ Successfully created: ${file.pdfName}`);
                console.log(`   📊 Size: ${fileSizeKB} KB (${fileSizeMB} MB)`);

                results.successful.push({
                    source: file.name,
                    output: file.pdfName,
                    size: fileStats.size,
                    sizeKB: parseFloat(fileSizeKB),
                    timestamp: new Date().toISOString()
                });

                results.conversions[file.name] = {
                    pdfFile: file.pdfName,
                    status: 'success',
                    size: fileStats.size
                };

                await page.close();

            } catch (error) {
                console.error(`❌ Error processing ${file.name}:`, error.message);
                results.failed.push({
                    file: file.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                results.conversions[file.name] = {
                    status: 'failed',
                    error: error.message
                };
            }
        }

        // Close browser
        await browser.close();

        // Summary report
        console.log('\n' + '='.repeat(50));
        console.log('📊 CONVERSION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Successful: ${results.successful.length}`);
        console.log(`❌ Failed: ${results.failed.length}`);
        console.log(`⏱️  Started: ${results.startTime}`);
        console.log(`⏱️  Completed: ${new Date().toISOString()}`);

        // Calculate total size
        const totalSize = results.successful.reduce((sum, r) => sum + r.size, 0);
        console.log(`📁 Total PDF size: ${(totalSize / 1024).toFixed(2)} KB`);

        // Save detailed report
        results.endTime = new Date().toISOString();
        const reportPath = path.join(__dirname, 'pdf-batch-conversion-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n📋 Detailed report saved: pdf-batch-conversion-report.json`);

        // Log individual files
        console.log('\n📄 Generated PDFs:');
        results.successful.forEach(r => {
            console.log(`   • ${r.output} (${r.sizeKB} KB)`);
        });

        if (results.failed.length > 0) {
            console.log('\n⚠️  Failed conversions:');
            results.failed.forEach(r => {
                console.log(`   • ${r.file}: ${r.error}`);
            });
        }

        return results.failed.length === 0;

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        if (browser) {
            await browser.close();
        }
        return false;
    }
}

// Run the batch conversion
console.log('🎯 PDF Batch Converter Started');
console.log('━'.repeat(50));

convertHtmlsToPdf().then(success => {
    console.log('\n' + (success ? '✅ All conversions completed successfully!' : '⚠️  Some conversions failed!'));
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
