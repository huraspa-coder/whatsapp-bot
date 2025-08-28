// botpress-integration.js
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

function normalizeToJid(raw) {
  if (!raw) return null;
  if (String(raw).includes('@')) return String(raw);
  let digits = String(raw).replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (digits.length === 8 || digits.length === 9) digits = '56' + digits;
  if (digits.length < 8) return null;
  return `${digits}@c.us`;
}

function createUserJWT(userId) {
  const secret = process.env.BOTPRESS_CHAT_ENCRYPTION_KEY;
  if (!secret) throw new Error('BOTPRESS_CHAT_ENCRYPTION_KEY not set');
  return jwt.sign({ id: String(userId) }, secret, { algorithm: 'HS256', expiresIn: '1h' });
}

module.exports = function registerBotpressRoutes({ app, venomClient }) {
  if (!app || !venomClient) throw new Error('app and venomClient are required');

  const router = express.Router();
  const CHAT_API_URL = process.env.BOTPRESS_CHAT_API_URL; // https://chat.botpress.cloud/<BOT_ID>

  // Recibir mensajes desde WhatsApp y mandarlos a Botpress Chat API
  venomClient.onMessage(async (message) => {
    try {
      if (!CHAT_API_URL) {
        console.warn('BOTPRESS_CHAT_API_URL not set.');
        return;
      }
      if (message.fromMe) return;

      const userId = String(message.from || '').replace('@c.us', '').replace('@s.whatsapp.net', '');
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
      console.error('Error sending message to Botpress Chat API', err?.response?.status, err?.response?.data || err?.message);
    }
  });

  // Endpoint para pruebas: enviar un mensaje desde el servidor a WhatsApp
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

  // TODO: aquí podemos añadir polling o event stream de Botpress para escuchar respuestas
  // y reenviarlas a WhatsApp automáticamente.

  app.use('/', router);
};
