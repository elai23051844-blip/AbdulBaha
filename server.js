/**
 * Локальный сервер: статика + POST /api/rsvp (Telegram)
 * Запуск: node server.js
 * Читает TELEGRAM_* из .env.local или окружения.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = process.env.PORT || 4177;

function loadEnvFile(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) return;
    if (!process.env[m[1]]) process.env[m[1]] = m[2];
  });
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json'
};

async function resolveChatId(token, preferred) {
  if (preferred) return String(preferred);
  const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`);
  const data = await r.json();
  if (!data.ok || !Array.isArray(data.result)) return null;
  for (let i = data.result.length - 1; i >= 0; i--) {
    const msg = data.result[i].message || data.result[i].edited_message;
    if (msg && msg.chat && msg.chat.type === 'private') return String(msg.chat.id);
  }
  return null;
}

async function handleRsvp(req, res, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Бот не настроен (нет токена)' }));
    return;
  }
  let data = {};
  try { data = JSON.parse(body || '{}'); } catch (e) { data = {}; }
  const source = String(data.source || 'page').slice(0, 40);
  const event = String(data.event || 'День Завета · 26 ноября').slice(0, 120);
  const when = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Minsk' });

  try {
    const chatId = await resolveChatId(token, process.env.TELEGRAM_CHAT_ID);
    if (!chatId) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: false,
        error: 'Напишите боту любое сообщение в Telegram, затем нажмите ещё раз'
      }));
      return;
    }
    const text = ['🕊 Я приду', '', event, `Источник: ${source}`, `Время: ${when}`].join('\n');
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
    });
    const result = await tg.json();
    if (!result.ok) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: result.description || 'Telegram не принял сообщение' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Ошибка отправки' }));
  }
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);

  if (u.pathname === '/api/rsvp') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
      return;
    }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => handleRsvp(req, res, body));
    return;
  }

  let rel = decodeURIComponent(u.pathname);
  if (rel === '/') rel = '/index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  sendFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Приглашение: http://localhost:${PORT}`);
  console.log('Кнопка «Я приду» → Telegram через /api/rsvp');
  if (!process.env.TELEGRAM_CHAT_ID) {
    console.log('Подсказка: напишите боту в Telegram, либо задайте TELEGRAM_CHAT_ID в .env.local');
  }
});
