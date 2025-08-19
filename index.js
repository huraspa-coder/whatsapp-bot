// index.js
const venom = require('venom-bot');
const express = require('express');
const app = express();

// Integración Botpress
const registerBotpressRoutes = require('./botpress-integration');

app.use(express.json());

let qrBase64 = null;
let attemptsCount = 0;
let venomClient;

const sessionName = 'session-name';

function startBot() {
  venom.create(
    {
      session: sessionName,
      multidevice: true,
      folderNameToken: process.env.SESSION_PATH || './.venom-sessions',
      headless: true,
      disableSpins: true,
      logQR: false
    },
    (base64Qr, asciiQR, attempts) => {
      qrBase64 = base64Qr;
      attemptsCount = attempts;
      console.log('QR generado, escanea con WhatsApp si es necesario');
    },
    (statusSession, session) => {
      console.log('Status Session:', statusSession);
    }
  )
  .then(client => initClient(client))
  .catch(err => console.log('❌ Error Venom:', err));
}

function initClient(client) {
  venomClient = client;
  registerBotpressRoutes({ app, venomClient: client });
  console.log('✅ Venom conectado y rutas de Botpress registradas');

  // Interceptar todos los mensajes entrantes y salientes
  venomClient.onMessage(message => {
    console.log(`📥 Entrante de ${message.from}: ${message.body}`);
  });
}

app.get('/', (req, res) => {
  res.send('<h1>Servidor activo 🚀</h1><p>Visita <a href="/qr">/qr</a> para ver el QR.</p>');
});

app.get('/qr', (req, res) => {
  if (!qrBase64) return res.send('<h2>Aún no se ha generado el QR.</h2>');
  res.send(`<img src="${qrBase64}" alt="QR Code" style="width:300px;height:300px;" /><p>Intento: ${attemptsCount}</p>`);
});

// Mensajes desde Botpress
app.post('/botpress/response', async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).send('Faltan datos: userId o message');
    if (!venomClient) return res.status(500).send('Cliente Venom no iniciado');

    const whatsappId = userId.includes('@c.us') ? userId : `${userId}@c.us`;
    await venomClient.sendText(whatsappId, message);
    console.log(`📤 Saliente a ${whatsappId}: ${message}`);
    res.status(200).send('Mensaje enviado');
  } catch (err) {
    console.error('❌ Error enviando mensaje:', err);
    res.status(500).send('Error interno');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`));

startBot();
