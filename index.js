const venom = require('venom-bot');
const express = require('express');
const app = express();

// Importamos la integración con Botpress
const registerBotpressRoutes = require('./botpress-integration');

app.use(express.json()); // necesario para endpoints POST

let qrBase64 = null; // Último QR generado
let attemptsCount = 0;

// Nombre de la sesión
const sessionName = 'session-name';

// Arrancar el bot
function startBot() {
  venom.create(
    {
      session: sessionName,
      multidevice: true,
      folderNameToken: process.env.SESSION_PATH || './.venom-sessions'
    },
    (base64Qr, asciiQR, attempts) => {
      console.log(asciiQR); // QR en consola
      qrBase64 = base64Qr;  // Guardamos el QR en memoria
      attemptsCount = attempts;
    },
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
  registerBotpressRoutes({ app, venomClient: client });
  console.log('✅ Venom conectado y rutas de Botpress registradas');

  // --- NUEVO: endpoint POST para recibir mensajes desde Botpress ---
  app.post('/botpress/response', async (req, res) => {
    try {
      const { userId, message } = req.body; // Botpress enviará userId y message
      if (!userId || !message) {
        return res.status(400).json({ error: 'Faltan userId o message' });
      }

      // Enviar mensaje a WhatsApp
      await client.sendText(`${userId}@c.us`, message);

      res.json({ status: 'ok', sentTo: userId, message });
    } catch (err) {
      console.error('❌ Error enviando mensaje a WhatsApp:', err);
      res.status(500).json({ error: err.message });
    }
  });
  // --- FIN NUEVO ---
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

// Puerto (Railway asume process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`);
});

// Iniciar el bot
startBot();
