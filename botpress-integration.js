// botpress-integration.js
const express = require('express');
const axios = require('axios');

function normalizeToJid(raw) {
  if (!raw) return null;
  // Si ya parece un JID (contiene @), devuélvelo tal cual
  if (raw.includes('@')) return raw;
  // Quita todo lo que no sea dígito o +
  let digits = ('' + raw).replace(/[^\d+]/g, '');
  // Quita + si existe
  digits = digits.replace(/^\+/, '');
  // Si tiene 8 o 9 dígitos (posible número local Chile), asumimos country code 56
  if (digits.length === 8 || digits.length === 9) digits = '56' + digits;
  // Si tiene menos de 8, no intentamos adivinar
  if (digits.length < 8) return null;
  return `${digits}@c.us`;
}

module.exports = function registerBotpressRoutes({ app, venomClient }) {
  if (!app || !venomClient) throw new Error('app and venomClient are required');

  const router = express.Router();
  const BOTPRESS_INCOMING_URL = process.env.BOTPRESS_INCOMING_URL;
  const BOTPRESS_PAT = process.env.BOTPRESS_PAT;
  const BOTPRESS_RESPONSE_SECRET = process.env.BOTPRESS_RESPONSE_SECRET || '';

  // Endpoint que Botpress usará para enviar respuestas (configurar en Botpress)
  router.post('/botpress/response', async (req, res) => {
    try {
      if (BOTPRESS_RESPONSE_SECRET) {
        const header = req.header('x-bp-secret') || req.query.shared_secret;
        if (header !== BOTPRESS_RESPONSE_SECRET) return res.status(401).send('invalid secret');
      }

      const body = req.body || {};
      // Botpress puede mandar distintas propiedades; intentamos extraer texto y destinatario
      const convId = body.conversationId || body.userId || (body.user && body.user.id);
      const text = body.text || (body.message && body.message.text) || '';

      const to = normalizeToJid(convId);
      if (!to) return res.status(400).send('invalid conversationId');

      if (text) {
        await venomClient.sendText(to, text);
      } else {
        // Si hay otras acciones (attachments, images), aquí mapealas
        console.warn('No text provided in Botpress payload', body);
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error('Error /botpress/response', err?.message || err);
      return res.status(500).send('error');
    }
  });

  // Endpoint opcional para pruebas (interno)
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

  // Health
  router.get('/botpress/health', (req, res) => res.json({ ok: true }));

  app.use('/', router);

  // Hook: forward mensajes entrantes de venom a Botpress
  venomClient.onMessage(async (message) => {
    try {
      if (!BOTPRESS_INCOMING_URL || !BOTPRESS_PAT) {
        console.warn('BOTPRESS_INCOMING_URL / BOTPRESS_PAT not set.');
        return;
      }
      // Evita loops: no reenviar mensajes que provienen del propio bot
      if (message.fromMe) return;

      const userId = (message.from || '').replace('@c.us','').replace('@s.whatsapp.net','');
      const conversationId = userId;
      const payload = {
        userId: userId,
        messageId: message.id || `${Date.now()}-${Math.random()}`,
        conversationId: conversationId,
        type: 'text',
        text: message.body || ''
      };

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
