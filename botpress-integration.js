// botpress-integration.js
const express = require('express');
const axios = require('axios');

module.exports = function initBotpressIntegration({ venomClient }) {
  const app = express();
  app.use(express.json());

  const BOTPRESS_INCOMING_URL = process.env.BOTPRESS_INCOMING_URL; // webhook de Botpress (create messages)
  const BOTPRESS_PAT = process.env.BOTPRESS_PAT; // Personal Access Token (Botpress)
  const BOTPRESS_RESPONSE_SECRET = process.env.BOTPRESS_RESPONSE_SECRET || ''; // opcional, si configuras secret en BP

  if (!BOTPRESS_INCOMING_URL || !BOTPRESS_PAT) {
    console.warn('Botpress integration not fully configured (BOTPRESS_INCOMING_URL / BOTPRESS_PAT)');
  }

  // 1) Endpoint que Botpress usará para enviar respuestas (configurar en la integración)
  // Botpress enviará payloads con conversationId / userId / message ...
  app.post('/botpress/response', async (req, res) => {
    try {
      // seguridad simple: valida header o shared secret si lo configuraste
      if (BOTPRESS_RESPONSE_SECRET) {
        const header = req.header('x-bp-secret') || req.query.shared_secret;
        if (header !== BOTPRESS_RESPONSE_SECRET) return res.status(401).send('invalid secret');
      }

      const body = req.body;
      // Ejemplo: body podría traer { conversationId, type, text, ... }
      const convId = body.conversationId || (body.user && body.user.id) || body.userId;
      if (!convId) {
        console.warn('No conversationId in Botpress payload', body);
        return res.sendStatus(400);
      }

      // Convierte conversationId a formato venombot: normalmente <phone>@c.us
      // Asumiremos convId es el número completo (ej: 569XXXXXXXX)
      // Ajusta según tu mapping.
      const to = convId.includes('@') ? convId : `${convId}@c.us`;

      // Mensajes de texto simples:
      if (body.text) {
        await venomClient.sendText(to, body.text);
      }

      // aquí podrías mapear más tipos: images, buttons, templates, etc.
      return res.sendStatus(200);
    } catch (err) {
      console.error('Error in /botpress/response', err?.message || err);
      return res.status(500).send('error');
    }
  });

  // 2) (Opcional) Endpoint para health / debug
  app.get('/botpress/health', (req, res) => res.json({ ok: true }));

  // 3) Inicia el server (si tu app ya tiene Express, integra estas rutas en el router existente)
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Botpress integration endpoints listening on port ${port}`);
  });

  // Hook: cuando venom recibe un mensaje, hacemos POST a Botpress (create message)
  // Este snippet lo puedes agregar donde inicializas venom (index.js)
  // Ejemplo de payload acorde a la doc de Botpress Chat API / Messaging integration.
  venomClient.onMessage(async (message) => {
    try {
      // Sólo reenvía mensajes que sean de usuarios (evitar loops con mensajes del propio bot)
      if (message.fromMe) return;

      const userId = message.from.replace('@c.us',''); // ej: "569XXXXXXXX@c.us"
      const conversationId = userId; // puedes usar el mismo userId como conversationId

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
