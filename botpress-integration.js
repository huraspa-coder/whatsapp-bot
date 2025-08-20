// botpress-integration.js
const express = require('express');
const axios = require('axios');

function normalizeToJid(raw) {
  if (!raw) return null;
  if (raw.includes('@')) return raw;
  let digits = ('' + raw).replace(/[^\d]/g, ''); // solo dígitos
  if (digits.length === 8 || digits.length === 9) digits = '56' + digits; // agregar prefijo Chile si falta
  if (digits.length < 11) return null; // invalido
  return `${digits}@c.us`;
}

module.exports = function registerBotpressRoutes({ app, venomClient }) {
  if (!app || !venomClient) throw new Error('app and venomClient are required');

  const router = express.Router();
  const BOTPRESS_INCOMING_URL = process.env.BOTPRESS_INCOMING_URL;
  const BOTPRESS_PAT = process.env.BOTPRESS_PAT;
  const BOTPRESS_RESPONSE_SECRET = process.env.BOTPRESS_RESPONSE_SECRET || '';

  // Endpoint para enviar mensajes desde Botpress
  router.post('/botpress/response', async (req, res) => {
    try {
      // Validación del secreto
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

      if (text) await venomClient.sendText(to, text);
      return res.sendStatus(200);
    } catch (err) {
      console.error('Error /botpress/response:', err?.message || err);
      return res.status(500).send('error');
    }
  });

  // Endpoint opcional para enviar mensajes manualmente
  router.post('/botpress/send', async (req, res) => {
    try {
      const { to: rawTo, text } = req.body || {};
      const to = normalizeToJid(rawTo);

      console.log('📤 Enviando mensaje manual:', { to: rawTo, normalized: to, text });

      if (!to || !text) return res.status(400).send('missing to or text');
      await venomClient.sendText(to, text);
      return res.json({ ok: true });
    } catch (err) {
      console.error('Error /botpress/send:', err?.message || err);
      return res.status(500).send('error');
    }
  });

  router.get('/botpress/health', (req, res) => res.json({ ok: true }));

  app.use('/', router);

  // Reenvío de mensajes entrantes de WhatsApp a Botpress
  venomClient.onMessage(async (message) => {
    try {
      if (!BOTPRESS_INCOMING_URL || !BOTPRESS_PAT) {
        console.warn('BOTPRESS_INCOMING_URL / BOTPRESS_PAT not set.');
        return;
      }

      if (message.fromMe) return; // evita loops

      const userId = (message.from || '').replace('@c.us','').replace('@s.whatsapp.net','');
      const conversationId = userId;

      const payload = {
        userId: userId,
        messageId: message.id || `${Date.now()}-${Math.random()}`,
        conversationId: conversationId,
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
      console.error('Error forwarding message to Botpress:', err?.message || err);
    }
  });
};
