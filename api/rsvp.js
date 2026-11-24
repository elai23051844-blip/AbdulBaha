/**
 * Vercel Serverless: POST /api/rsvp
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * If CHAT_ID is empty, tries getUpdates for the latest private chat.
 */

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function resolveChatId(token, preferred) {
  if (preferred) { return String(preferred); }
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=20`;
  const r = await fetch(url);
  const data = await r.json();
  if (!data.ok || !Array.isArray(data.result)) { return null; }
  for (let i = data.result.length - 1; i >= 0; i--) {
    const msg = data.result[i].message || data.result[i].edited_message;
    if (msg && msg.chat && msg.chat.type === 'private') {
      return String(msg.chat.id);
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: 'Бот не настроен (нет токена)' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const source = String(body.source || 'page').slice(0, 40);
  const event = String(body.event || 'День Завета · 26 ноября').slice(0, 120);
  const when = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Minsk' });

  try {
    const chatId = await resolveChatId(token, process.env.TELEGRAM_CHAT_ID);
    if (!chatId) {
      return res.status(503).json({
        ok: false,
        error: 'Напишите боту любое сообщение в Telegram, затем нажмите ещё раз'
      });
    }

    const text = [
      '🕊 Я приду',
      '',
      event,
      `Источник: ${source}`,
      `Время: ${when}`
    ].join('\n');

    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        disable_web_page_preview: true
      })
    });
    const result = await tg.json();
    if (!result.ok) {
      return res.status(502).json({
        ok: false,
        error: result.description || 'Telegram не принял сообщение'
      });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Ошибка отправки' });
  }
};
