/**
 * Proxy utilities for forwarding requests to backend services
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

export const httpProxy = (req, res, targetUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(targetUrl);
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: req.method,
        headers: {
          ...req.headers,
          'host': url.host,
        },
      };

      // Remove hop-by-hop headers
      delete options.headers['connection'];
      delete options.headers['transfer-encoding'];

      // Prepare body
      let body = '';
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.body) {
          // If body has been parsed by express.json(), use that
          body = JSON.stringify(req.body);
          options.headers['content-type'] = 'application/json';
          options.headers['content-length'] = Buffer.byteLength(body);
        } else if (req.rawBody) {
          // Use raw body if available
          body = req.rawBody;
          options.headers['content-length'] = Buffer.byteLength(body);
        }
      }

      console.log(`[Proxy] ${req.method} ${targetUrl}`, body ? `(body size: ${body.length} bytes)` : '(no body)');

      const proxyReq = protocol.request(options, (proxyRes) => {
        // Copy status code and headers
        res.writeHead(proxyRes.statusCode, proxyRes.headers);

        // Pipe the response back to the client
        proxyRes.pipe(res);
        proxyRes.on('end', () => {
          resolve();
        });
      });

      proxyReq.on('error', (error) => {
        console.error(`[Proxy Error] ${targetUrl}:`, error.message);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: `Backend service unavailable: ${error.message}`,
          });
        }
        resolve();
      });

      // Send the body
      if (body) {
        proxyReq.write(body);
      }
      proxyReq.end();
    } catch (error) {
      console.error(`[Proxy Setup Error] ${targetUrl}:`, error.message);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: `Proxy error: ${error.message}`,
        });
      }
      resolve();
    }
  });
};
