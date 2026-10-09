/** Локальный сервер на стандартной библиотеке Node.js. npm install не нужен. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('\0') || pathname.includes('\\')) return null;
  const target = path.resolve(ROOT, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!target.startsWith(ROOT + path.sep) || !MIME[path.extname(target)]) return null;
  return target;
}

function createServer() {
  return http.createServer((request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    const fail = (code, text) => {
      response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : text);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      fail(405, 'Метод не поддерживается.');
      return;
    }
    let file;
    try { file = resolveRequestPath(request.url); }
    catch { fail(400, 'Неверный адрес.'); return; }
    if (!file) { fail(404, 'Страница не найдена.'); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { fail(404, 'Страница не найдена. Вернитесь на главную: /'); return; }
      response.writeHead(200, { 'Content-Type': MIME[path.extname(file)], 'Content-Length': bytes.length });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    });
  });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const portIndex = args.indexOf('--port');
  const port = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Укажите порт от 1 до 65535: node server.js --port 8081');
    process.exit(1);
  }
  const lan = args.includes('--lan');
  const server = createServer();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE'
      ? 'Этот порт занят. Попробуйте: node server.js --port 8081'
      : 'Не удалось запустить сервер: ' + error.message);
    process.exitCode = 1;
  });
  server.listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
    console.log('\nАркантериум запущен: http://localhost:' + port);
    if (lan) {
      console.log('Доступ включён для устройств в вашей локальной сети.');
      for (const entries of Object.values(os.networkInterfaces())) {
        for (const entry of entries || []) {
          if (entry.family === 'IPv4' && !entry.internal) console.log('Адрес для телефона: http://' + entry.address + ':' + port);
        }
      }
    }
    console.log('Оставьте окно открытым. Для остановки нажмите Ctrl+C.\n');
  });
}

module.exports = { createServer, resolveRequestPath };
