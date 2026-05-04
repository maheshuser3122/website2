// Advanced PDF Report Generator with Data Integration
// Converts HTML to PDF with embedded data from Excel files
// 
// Usage:
// 1. Install dependencies: npm install puppeteer xlsx
// 2. Run: node create-advanced-pdf.js
// 3. PDF with embedded data will be created

const puppeteer = require('puppeteer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class AdvancedPdfConverter {
    constructor() {
        this.dataCache = {};
        this.conversionLog = [];
    }

    /**
     * Load data from Excel file
     */
    async loadExcelData(excelFilePath) {
        try {
            console.log(`📊 Loading Excel data from: ${excelFilePath}`);
            
            if (!fs.existsSync(excelFilePath)) {
                console.warn(`⚠️  Excel file not found: ${excelFilePath}`);
                return null;
            }

            const workbook = XLSX.readFile(excelFilePath);
            const data = {};

            // Read all sheets
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                data[sheetName] = XLSX.utils.sheet_to_json(sheet);
                console.log(`  ✓ Sheet "${sheetName}": ${data[sheetName].length} rows`);
            });

            this.dataCache = data;
            return data;

        } catch (error) {
            console.error(`❌ Error loading Excel data: ${error.message}`);
            return null;
        }
    }

    /**
     * Inject data into HTML
     */
    async injectDataIntoHtml(htmlFilePath, data) {
        try {
            let htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
            
            // Inject data as JSON into a hidden script tag
            const dataScript = `
                <script type="application/json" id="report-data">
                ${JSON.stringify(data, null, 2)}
                </script>
            `;
            
            // Insert before closing body tag
            htmlContent = htmlContent.replace('</body>', `${dataScript}</body>`);
            
            return htmlContent;
        } catch (error) {
            console.error(`❌ Error injecting data: ${error.message}`);
            return null;
        }
    }

    /**
     * Convert HTML to PDF with data integration
     */
    async convertToPdf(htmlFilePath, pdfOutputPath, dataExcelPath = null) {
        let browser;
        const startTime = Date.now();

        try {
            console.log('\n🚀 Starting Advanced PDF Conversion');
            console.log('─'.repeat(60));

            // Load Excel data if provided
            if (dataExcelPath) {
                await this.loadExcelData(dataExcelPath);
            }

            // Launch browser
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            // Check if source file exists
            if (!fs.existsSync(htmlFilePath)) {
                throw new Error(`HTML file not found: ${htmlFilePath}`);
            }

            // Load HTML
            const fileUrl = `file://${htmlFilePath.replace(/\\/g, '/')}`;
            console.log(`📄 Loading HTML: ${path.basename(htmlFilePath)}`);

            await page.goto(fileUrl, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            // Wait for rendering
            console.log('⏳ Waiting for content to render (5 seconds)...');
            await page.waitForTimeout(5000);

            // Optional: Inject JavaScript to modify page before PDF generation
            await page.evaluate(() => {
                // Hide print-specific elements if any
                const noPrint = document.querySelectorAll('[style*="display: none"]');
                console.log(`Hidden elements found: ${noPrint.length}`);
            });

            // Generate PDF
            console.log(`📝 Generating PDF: ${path.basename(pdfOutputPath)}`);

            const pdfOptions = {
                path: pdfOutputPath,
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
                    <div style="font-size: 10px; width: 100%; text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">
                        PROFESSIONAL REPORT GENERATOR - <span class="date"></span>
                    </div>
                `,
                footerTemplate: `
                    <div style="font-size: 10px; width: 100%; text-align: center; padding: 10px; border-top: 1px solid #ddd;">
                        Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on <span class="date"></span>
                    </div>
                `
            };

            await page.pdf(pdfOptions);

            // Get file information
            const fileStats = fs.statSync(pdfOutputPath);
            const duration = Date.now() - startTime;

            // Log conversion result
            const result = {
                timestamp: new Date().toISOString(),
                source: path.basename(htmlFilePath),
                output: path.basename(pdfOutputPath),
                fullPath: pdfOutputPath,
                fileSize: fileStats.size,
                fileSizeKB: (fileStats.size / 1024).toFixed(2),
                fileSizeMB: (fileStats.size / (1024 * 1024)).toFixed(4),
                durationMs: duration,
                dataSourcesUsed: dataExcelPath ? [path.basename(dataExcelPath)] : [],
                status: 'success'
            };

            this.conversionLog.push(result);

            // Display results
            console.log(`\n✅ PDF created successfully!`);
            console.log(`   📁 File: ${pdfOutputPath}`);
            console.log(`   📊 Size: ${result.fileSizeKB} KB`);
            console.log(`   ⏱️  Time: ${duration}ms`);

            if (dataExcelPath) {
                console.log(`   📈 Data integrated from: ${path.basename(dataExcelPath)}`);
                console.log(`   📋 Sheets loaded: ${Object.keys(this.dataCache).length}`);
            }

            await browser.close();
            return result;

        } catch (error) {
            console.error(`\n❌ Error during conversion: ${error.message}`);
            
            this.conversionLog.push({
                timestamp: new Date().toISOString(),
                source: path.basename(htmlFilePath),
                error: error.message,
                status: 'failed'
            });

            if (browser) {
                await browser.close();
            }
            
            return null;
        }
    }

    /**
     * Generate conversion report
     */
    saveConversionReport(reportPath) {
        const report = {
            generatedAt: new Date().toISOString(),
            totalConversions: this.conversionLog.length,
            successfulConversions: this.conversionLog.filter(l => l.status === 'success').length,
            failedConversions: this.conversionLog.filter(l => l.status === 'failed').length,
            totalSize: this.conversionLog
                .filter(l => l.status === 'success')
                .reduce((sum, l) => sum + l.fileSize, 0),
            conversions: this.conversionLog,
            dataCache: this.dataCache
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📋 Report saved: ${path.basename(reportPath)}`);
        
        return report;
    }
}

/**
 * Main execution
 */
async function main() {
    const converter = new AdvancedPdfConverter();

    try {
        // Conversion 1: Production report with Excel data integration
        const excelPath = path.join(__dirname, 'sample-report-data.xlsx');
        const productionHtmlPath = path.join(__dirname, 'production.html');
        const productionPdfPath = path.join(__dirname, 'production-advanced.pdf');

        await converter.convertToPdf(productionHtmlPath, productionPdfPath, excelPath);

        // Conversion 2: Professional report (without data)
        const professionalHtmlPath = path.join(__dirname, 'professional.html');
        const professionalPdfPath = path.join(__dirname, 'professional-advanced.pdf');

        console.log('\n' + '='.repeat(60));
        await converter.convertToPdf(professionalHtmlPath, professionalPdfPath);

        // Save final report
        const reportPath = path.join(__dirname, 'pdf-advanced-conversion-report.json');
        const finalReport = converter.saveConversionReport(reportPath);

        // Display summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 CONVERSION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${finalReport.successfulConversions}`);
        console.log(`❌ Failed: ${finalReport.failedConversions}`);
        console.log(`📁 Total size: ${(finalReport.totalSize / (1024 * 1024)).toFixed(2)} MB`);

        process.exit(finalReport.failedConversions === 0 ? 0 : 1);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run
main();
