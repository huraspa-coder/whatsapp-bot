const express = require('express');
const bodyParser = require('body-parser');
const venom = require('venom-bot');

const app = express();
app.use(bodyParser.json());

let client; // Cliente de Venom

// Forzar Puppeteer a usar Chromium en el contenedor
process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium';

// Iniciar sesión de WhatsApp
venom.create({
  session: 'session-name',
  headless: true,          // obligatorio en servidores
  useChrome: false,        // usar Chromium en vez de Chrome
  puppeteerArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-gpu',
    '--window-size=1920,1080'
  ]
})
.then((c) => {
  client = c;
  console.log('WhatsApp session ready');
})
.catch((err) => {
  console.error('Error al iniciar sesión de WhatsApp:', err);
});

// Endpoint para ver estado de la sesión
app.get('/status', (req, res) => {
  if (client) {
    res.json({ connected: true, message: 'WhatsApp session active' });
  } else {
    res.json({ connected: false, message: 'WhatsApp session not ready' });
  }
});

// Endpoint para enviar mensaje
app.post('/sendMessage', async (req, res) => {
  const { to, message } = req.body;
  if (!client) return res.status(500).json({ error: 'WhatsApp client not ready' });
  try {
    const result = await client.sendText(to, message);
    res.json({ status: 'success', result });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// Endpoint webhook para recibir mensajes
app.post('/webhook', (req, res) => {
  console.log('Mensaje recibido:', req.body);
  res.sendStatus(200);
});

// Escuchar en el puerto de Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
