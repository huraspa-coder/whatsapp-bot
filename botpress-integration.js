// botpress-integration.js
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Normaliza número a formato JID de WhatsApp
function normalizeToJid(raw) {
  if (!raw) return null;
  if (String(raw).includes('@')) return String(raw);
  let digits = String(raw).replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (digits.length === 8 || digits.length === 9) digits = '56' + digits; // default Chile
  if (digits.length < 8) return null;
  return `${digits}@c.us`;
}

// Genera JWT para Chat API
function createUserJWT(userId) {
  const secret = process.env.BOTPRESS_CHAT_ENCRYPTION_KEY;
  if (!secret) throw new Error('BOTPRESS_CHAT_ENCRYPTION_KEY not set');
  return jwt.sign({ id: String(userId) }, secret, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });
}

module.exports = function registerBotpressRoutes({ app, venomClient }) {
  if (!app || !venomClient) throw new Error('app and venomClient are required');

  const router = express.Router();
  const CHAT_API_URL = process.env.BOTPRESS_CHAT_API_URL; // https://chat.botpress.cloud/<BOT_ID>
  const WEBHOOK_SECRET = process.env.BOTPRESS_RESPONSE_SECRET;

  // 1) Recibir mensajes desde WhatsApp y mandarlos a Botpress Chat API
  venomClient.onMessage(async (message) => {
    try {
      if (!CHAT_API_URL) {
        console.warn('BOTPRESS_CHAT_API_URL not set.');
        return;
      }
      if (message.fromMe) return;

      const userId = String(message.from || '')
        .replace('@c.us', '')
        .replace('@s.whatsapp.net', '');
      const jwtToken = createUserJWT(userId);

      const payload = {
        type: 'text',
        text: message.body || ''
      };

      await axios.post(`${CHAT_API_URL}/conversations/${userId}/messages`, payload, {
        headers: {
          'x-user-key': jwtToken,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error(
        'Error sending message to Botpress Chat API',
        err?.response?.status,
        err?.response?.data || err?.message
      );
    }
  });

  // 2) Endpoint para enviar un mensaje a WhatsApp desde API interna
  router.post('/botpress/send', async (req, res) => {
    try {
      const { to: rawTo, text } = req.body || {};
      const to = normalizeToJid(rawTo);
      if (!to || !text) return res.status(400).send('missing to or text');
      await venomClient.sendText(to, text);
      return res.json({ ok: true });
    } catch (err) {
      console.error('Error /botpress/send', err?.message || err);
      return res.status(500).send('error');
    }
  });

  // 3) Endpoint para recibir respuestas desde Botpress
  router.post('/botpress/response', async (req, res) => {
    try {
      const secretHeader = req.headers['x-bp-secret'];
      if (WEBHOOK_SECRET && secretHeader !== WEBHOOK_SECRET) {
        return res.status(403).send('forbidden');
      }

      const { userId, type, text } = req.body || {};
      if (!userId || !text) {
        return res.status(400).send('missing userId or text');
      }

      const to = normalizeToJid(userId);
      if (!to) return res.status(400).send('invalid userId');

      await venomClient.sendText(to, text);
      return res.json({ ok: true });
    } catch (err) {
      console.error('Error /botpress/response', err?.message || err);
      return res.status(500).send('error');
    }
  });

  app.use('/', router);
};
