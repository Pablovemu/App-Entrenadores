// Comprobación mínima antes de desplegar: abre la app con Playwright (Chromium
// sin cabeza) y falla si aparece algún error en la consola del navegador o si
// la pantalla de acceso no llega a cargar. No sustituye probar la app a mano,
// pero pilla roturas evidentes (JS que no carga, errores de sintaxis, etc.)
// antes de hacer `git push`.
//
// Uso:  npm run test:smoke

const http = require('http');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8977;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(ROOT, urlPath);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  let failed = false;
  try {
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
    await page.waitForSelector('#auth-screen', { timeout: 5000 });
    await page.waitForSelector('#form-login', { timeout: 5000 });

    if (consoleErrors.length) {
      failed = true;
      console.error(`✗ La app cargó pero hubo ${consoleErrors.length} error(es) en consola:`);
      consoleErrors.forEach((e) => console.error('  -', e));
    } else {
      console.log('✓ La app carga sin errores de consola y la pantalla de acceso aparece correctamente.');
    }
  } catch (err) {
    failed = true;
    console.error('✗ La app no llegó a cargar como se esperaba:', err.message);
    if (consoleErrors.length) {
      console.error('  Errores de consola detectados:');
      consoleErrors.forEach((e) => console.error('  -', e));
    }
  } finally {
    await browser.close();
    server.close();
  }

  process.exit(failed ? 1 : 0);
}

main();
