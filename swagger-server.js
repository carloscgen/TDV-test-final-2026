const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const swaggerUi = require('swagger-ui-dist');

const port = 3000;
const swaggerFiles = swaggerUi.getAbsoluteFSPath();
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.yaml': 'application/yaml; charset=utf-8',
};

const initializer = `window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: '/github-api.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout'
  });
};`;

http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;

  if (request.method !== 'GET') {
    response.writeHead(405).end('Method Not Allowed');
    return;
  }

  if (pathname === '/swagger-initializer.js') {
    response.writeHead(200, { 'Content-Type': contentTypes['.js'] }).end(initializer);
    return;
  }

  const file = pathname === '/'
    ? path.join(swaggerFiles, 'index.html')
    : pathname === '/github-api.yaml'
      ? path.join(__dirname, 'github-api.yaml')
      : /^\/[\w.-]+$/.test(pathname)
        ? path.join(swaggerFiles, pathname.slice(1))
        : null;

  if (!file) {
    response.writeHead(404).end('Not Found');
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream',
    }).end(data);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Swagger UI disponible en http://localhost:${port}`);
});
