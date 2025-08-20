// botpress-integration.js
const express = require('express');
const axios = require('axios');

function normalizeToJid(raw) {
  if (!raw) return null;
  if (raw.includes('@')) return raw;
  let digits = ('' + raw).replace(/[^\d+]/g, '');
  digits = digits.replace(/^\+/, '');
  if (digits.length === 8 || digits.length === 9) digits = '56' + digits;
  if (digits.length < 8) return null;
  return `${digits}@c.us`;
}

module.exports = function registerBotpressRoutes({ app, venomClient }) {
  if (!app || !venomClient) throw new Error('app and venomClient are required');

  const router = express.Router();
  const BOTPRESS_INCOMING_URL = process.env.BOTPRESS_INCOMING_URL;
  const BOTPRESS_PAT = process.env.BOTPRESS_PAT;
  const BOTPRESS_RESPONSE_SECRET = process.env.BOTPRESS_RESPONSE_SECRET || '';

  // Endpoint que Botpress usará para enviar respuestas de vuelta a WhatsApp
  router.post('/botpress/response', async (req, res) => {
    try {
      if (BOTPRESS_RESPONSE_SECRET) {
        const header = req.header('x-bp-secret') || req.query.shared_secret;
        if (header !== BOTPRESS_RESPONSE_SECRET) return res.status(401).send('invalid secret');
      }

      const body = req.body || {};
      const convId = body.conversationId || body.userId || (body.user && body.user.id);
      const text = body.text || (body.message && body.message.text) || '';
      const to = normalizeToJid(convId);

      if (!to) return res.status(400).send('invalid conversationId');

      console.log('🔄 Enviando mensaje desde Botpress a WhatsApp:', { to, text });

      if (text) {
        await venomClient.sendText(to, text);
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error('Error /botpress/response', err?.message || err);
      return res.status(500).send('error');
    }
  });

  // Endpoint opcional para enviar mensajes manualmente (Postman)
  router.post('/botpress/send', async (req, res) => {
    try {
      const { to: rawTo, text } = req.body || {};
      const to = normalizeToJid(rawTo);
      if (!to || !text) return res.status(400).send('missing to or text');

      console.log('✉️ Enviando mensaje manual a WhatsApp:', { to, text });
      await venomClient.sendText(to, text);
      return res.json({ ok: true });
    } catch (err) {
      console.error('Error /botpress/send', err?.message || err);
      return res.status(500).send('error');
    }
  });

  // Health check
  router.get('/botpress/health', (req, res) => res.json({ ok: true }));

  app.use('/', router);

  // Flujo de mensajes entrantes de Venom a Botpress
  venomClient.onMessage(async (message) => {
    try {
      if (!BOTPRESS_INCOMING_URL || !BOTPRESS_PAT) {
        console.warn('BOTPRESS_INCOMING_URL / BOTPRESS_PAT not set.');
        return;
      }

      if (message.fromMe) return;

      const userId = (message.from || '').replace('@c.us','').replace('@s.whatsapp.net','');
      const conversationId = userId;

      const payload = {
        userId,
        messageId: message.id || `${Date.now()}-${Math.random()}`,
        conversationId,
        type: 'text',
        text: message.body || ''
      };

      console.log('📩 Mensaje entrante de WhatsApp a Botpress:', payload);

      await axios.post(BOTPRESS_INCOMING_URL, payload, {
        headers: {
          Authorization: `Bearer ${BOTPRESS_PAT}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
    } catch (err) {
      console.error('Error forwarding message to Botpress', err?.message || err);
    }
  });
};
