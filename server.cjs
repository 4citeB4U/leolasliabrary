const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.epub': 'application/epub+zip'
};

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const urlPath = decodeURIComponent(url.pathname);

    // Fast local proxy to LeeWay Kokoro service at 127.0.0.1:8878
    if (urlPath === '/api/voice/status' && req.method === 'GET') {
      const pReq = http.request({
        hostname: '127.0.0.1',
        port: 8878,
        path: '/status',
        method: 'GET'
      }, pRes => {
        res.writeHead(pRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        pRes.pipe(res);
      });
      pReq.on('error', () => {
        res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ready: false, error: 'Local voice service unavailable' }));
      });
      return pReq.end();
    }

    if ((urlPath === '/api/voice/synthesize' || urlPath === '/api/voice/synthesize.wav') && req.method === 'POST') {
      const wantBinary = urlPath.endsWith('.wav');
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const pReq = http.request({
          hostname: '127.0.0.1',
          port: 8878,
          path: '/synthesize',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        }, pRes => {
          if (!wantBinary) {
            res.writeHead(pRes.statusCode, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            return pRes.pipe(res);
          }
          let data = '';
          pRes.on('data', d => { data += d; });
          pRes.on('end', () => {
            try {
              const json = JSON.parse(data);
              if (json.audioContent) {
                const wavBuf = Buffer.from(json.audioContent, 'base64');
                res.writeHead(200, {
                  'Content-Type': 'audio/wav',
                  'Content-Length': wavBuf.length,
                  'Access-Control-Allow-Origin': '*'
                });
                return res.end(wavBuf);
              }
              res.writeHead(pRes.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(data);
            } catch {
              res.writeHead(500, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
              res.end('WAV conversion error');
            }
          });
        });
        pReq.on('error', err => {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: err.message }));
        });
        pReq.write(body);
        pReq.end();
      });
      return;
    }

    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
    const filePath = path.resolve(root, rel);
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found: ' + urlPath);
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500);
    res.end(err.message);
  }
});

server.listen(4174, '127.0.0.1', () => {
  console.log('Leola Library running live on http://localhost:4174/');
});
