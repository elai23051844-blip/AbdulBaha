# Абдул-Баха · День Завета — приглашение

Статичная страница-приглашение на 26 ноября (сбор 18:30, начало 19:00), Национальный Центр бахаи, пр. Независимости, 12-30.

## Локально (с кнопкой Telegram)

```bash
node server.js
```

Откройте http://localhost:4177 — кнопка «Я приду» шлёт в Telegram.

Токен лежит в `.env.local` (файл в `.gitignore`). Перед работой напишите боту любое сообщение в Telegram — иначе API не знает ваш chat id.

## Деплой на Vercel

1. Загрузите папку `D:\clode\BAh` на Vercel (или `vercel` из этой папки).
2. Environment Variables:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID` (желательно)
3. Напишите боту `/start` один раз.
4. Без `TELEGRAM_CHAT_ID` API возьмёт последний личный чат из `getUpdates`.

## Chat ID

1. Напишите боту «привет».
2. Откройте: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Найдите `"chat":{"id": 123456789}` — впишите в `.env.local` и в Vercel.
