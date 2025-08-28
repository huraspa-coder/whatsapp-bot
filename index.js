import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { create } from 'venom-bot';
import { sendTextToBotpress } from './botpress-integration.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.BOTPRESS_RESPONSE_SECRET;

let venomClient = null;

function normalizeToJid(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  return `${digits}@c.us`;
}

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.post('/botpress/response', async (req, res) => {
  try {
    const secret = req.header('x-bp-secret');
    if (!secret || secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'invalid webhook secret' });
    }

    const event = req.body?.event || req.body;
    const userId =
      event?.userId || req.body?.user?.id || req.body?.message?.userId;

    const text =
      req.body?.message?.payload?.text ||
      req.body?.event?.payload?.text ||
      req.body?.payload?.text;

    if (!userId || !text) {
      console.warn('Webhook sin userId o text', req.body);
      return res.status(204).end();
    }

    const to = normalizeToJid(userId);
    await venomClient?.sendText(to, text);
    res.json({ delivered: true });
  } catch (err) {
    console.error('Error en /botpress/response', err?.response?.data || err);
    res.status(500).json({ error: 'fail' });
  }
});

async function startVenom() {
  venomClient = await create({
    session: 'session-name',
    folderNameToken: process.env.SESSION_PATH || './.venom-sessions',
    headless: true,
    browserPathExecutable: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    puppeteerOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  console.log('✅ Venom iniciado con Chromium en', process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium');

  venomClient.onMessage(async (message) => {
    try {
      if (message.fromMe) return;
      const userId = message.from.replace('@c.us', '');
      const text = message.body || '';
      await sendTextToBotpress({ userId, text });
    } catch (err) {
      console.error('Error forwarding message to Botpress', err?.response?.data || err);
    }
  });
}

startVenom()
  .then(() => app.listen(PORT, () => console.log(`🌍 Servidor escuchando en :${PORT}`)))
  .catch((e) => {
    console.error('Fallo al iniciar Venom', e);
    process.exit(1);
  });
