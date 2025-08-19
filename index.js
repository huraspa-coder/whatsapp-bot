// index.js
const venom = require('venom-bot');
const express = require('express');
const app = express();

// Importamos la integración con Botpress
const registerBotpressRoutes = require('./botpress-integration');

app.use(express.json()); // necesario para endpoints POST

let qrBase64 = null; // Último QR generado
let attemptsCount = 0;
let venomClient; // guardamos el cliente Venom para usar en el POST

// Nombre de la sesión
const sessionName = 'session-name';

// Función para log unificado
function logMessage(type, whatsappId, message) {
  const now = new Date().toISOString();
  console.log(`[${now}] [${type}] ${whatsappId}: ${message}`);
}

// Arrancar el bot
function startBot() {
  venom.create(
    {
      session: sessionName,
      multidevice: true,
      folderNameToken: process.env.SESSION_PATH || './.venom-sessions'
    },
    // Callback QR
    (base64Qr, asciiQR, attempts) => {
      console.log(asciiQR); // QR en consola
      qrBase64 = base64Qr;  // Guardamos el QR en memoria
      attemptsCount = attempts;
    },
    // Callback status de sesión
    (statusSession, session) => {
      console.log('Status Session:', statusSession);
      console.log('Session name:', session);
    }
  )
  .then((client) => start(client))
  .catch((erro) => {
    console.log('❌ Error Venom:', erro);
  });
}

// Inicia las rutas y conecta con Botpress
function start(client) {
  venomClient = client; // guardamos el cliente para el POST

  // Interceptamos todos los mensajes entrantes
  venomClient.onMessage(async (message) => {
    if (message.isGroupMsg === false) {
      logMessage('IN', message.from, message.body);
    }
  });

  registerBotpressRoutes({ app, venomClient: client });
  console.log('✅ Venom conectado y rutas de Botpress registradas');
}

// Rutas públicas / UI
app.get('/', (req, res) => {
  res.send('<h1>Servidor activo 🚀</h1><p>Visita <a href="/qr">/qr</a> para ver el código QR.</p>');
});

app.get('/qr', (req, res) => {
  if (!qrBase64) {
    return res.send('<h2>Aún no se ha generado el QR... intenta refrescar en unos segundos.</h2>');
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Escanea tu QR</title>
    </head>
    <body style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;">
      <h2>Escanea este QR para iniciar sesión en WhatsApp</h2>
      <img src="${qrBase64}" alt="QR Code" style="width:300px;height:300px;" />
      <p>Intento: ${attemptsCount}</p>
    </body>
    </html>
  `);
});

// Endpoint para que Botpress envíe mensajes a WhatsApp
app.post('/botpress/response', async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).send('Faltan datos: userId o message');

    if (!venomClient) return res.status(500).send('Cliente Venom no iniciado');

    const whatsappId = userId.includes('@c.us') ? userId : `${userId}@c.us`;
    await venomClient.sendText(whatsappId, message);

    // Logging unificado
    logMessage('OUT', whatsappId, message);

    res.status(200).send('Mensaje enviado');
  } catch (err) {
    console.error('❌ Error enviando mensaje:', err);
    res.status(500).send('Error interno');
  }
});

// Puerto (Railway asume process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`);
});

// Iniciar el bot
startBot();
