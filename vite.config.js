import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  optimizeDeps: {
    // ffmpeg.wasm must be excluded from Vite's pre-bundling
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
        },
      },
    },
  },
  server: {
    // No COOP/COEP headers
  },
  plugins: [
    react(),
    {
      name: 'local-netlify-function-proxy',
      configureServer(server) {
        server.middlewares.use('/api/download', async (req, res) => {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.end();
            return;
          }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { createRequire } = await import('module');
              const require = createRequire(import.meta.url);
              const backendPath = require.resolve('./netlify/functions/download.cjs');
              delete require.cache[backendPath]; // Force clean require
              const handler = require(backendPath).handler;
              if (!handler) throw new Error('handler is not a function');
              const result = await handler({
                httpMethod: req.method,
                body: body,
              });
              res.statusCode = result.statusCode;
              res.setHeader('Content-Type', 'application/json');
              res.end(result.body);
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });

        // Add a streaming proxy to bypass YouTube CORS during local development
        server.middlewares.use('/api/stream', (req, res) => {
          const urlStr = new URL(req.url, `http://${req.headers.host}`).searchParams.get('url');
          if (!urlStr) return res.end();
          
          import('module').then(({ createRequire }) => {
            const reqLib = createRequire(import.meta.url);
            const https = reqLib('https');
            const targetUrl = new URL(urlStr);
            
            const options = {
              hostname: targetUrl.hostname,
              path: targetUrl.pathname + targetUrl.search,
              method: 'GET',
              headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Accept': '*/*',
              }
            };

            // Forward Range header for partial content/progress
            if (req.headers.range) {
              options.headers['Range'] = req.headers.range;
            }

            const proxyReq = https.request(options, (proxyRes) => {
              res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Range',
                'Access-Control-Expose-Headers': 'Content-Length, Content-Range'
              });
              proxyRes.pipe(res);
            });

            proxyReq.on('error', (e) => res.end());
            proxyReq.end();
          });
        });
      }
    }
  ]
});
