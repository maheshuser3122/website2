#!/usr/bin/env node

/**
 * MCHARV Business Manager Hub
 * Starts the unified dashboard for all business tools
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const BASE_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
};

const server = http.createServer((req, res) => {
    let pathname = url.parse(req.url).pathname;
    
    // Decode URI component to handle spaces and special characters
    pathname = decodeURIComponent(pathname);
    
    // Remove leading slash
    pathname = pathname.replace(/^\//, '');
    
    // Default to index.html if accessing root
    if (pathname === '') {
        pathname = 'index.html';
    }
    
    const filePath = path.join(BASE_DIR, pathname);
    
    // Security: prevent directory traversal
    const realPath = path.resolve(filePath);
    if (!realPath.startsWith(BASE_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }
    
    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err) {
            // Try with index.html if directory not found
            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (indexErr, indexStats) => {
                if (indexErr) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <head><title>404 Not Found</title></head>
                            <body style="font-family: Arial; margin: 50px; text-align: center;">
                                <h1>404 - File Not Found</h1>
                                <p>The requested resource was not found: ${pathname}</p>
                                <a href="/">Back to Dashboard</a>
                            </body>
                        </html>
                    `);
                    return;
                }
                serveFile(indexPath, res);
            });
            return;
        }
        
        // If directory, try to serve index.html
        if (stats.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (err, stats) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found - No index.html in directory');
                    return;
                }
                
                serveFile(indexPath, res);
            });
        } else {
            serveFile(filePath, res);
        }
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
            return;
        }
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
    });
}

server.listen(PORT, '127.0.0.1', () => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║    MCHARV BUSINESS MANAGER HUB - RUNNING               ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Server is running at: http://127.0.0.1:${PORT}`);
    console.log(`📍 Access the dashboard: http://127.0.0.1:${PORT}/index.html\n`);
    console.log('Available Tools:');
    console.log('  📄 Invoice Generator     → http://127.0.0.1:' + PORT + '/InvoiceGenerator');
    console.log('  🔖 Stamp Manager         → http://127.0.0.1:' + PORT + '/CompanyStampManager');
    console.log('  📸 Photo Organizer       → http://127.0.0.1:' + PORT + '/photo-organizer/frontend');
    console.log('  📝 Resume Builder        → http://127.0.0.1:' + PORT + '/Resume Builder App');
    console.log('  🖨️  Photo Print           → http://127.0.0.1:' + PORT + '/Photo Print\n');
    console.log('Press CTRL+C to stop the server.\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n✋ Server shutting down...');
    server.close(() => {
        console.log('✅ Server stopped.');
        process.exit(0);
    });
});
