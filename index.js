const venom = require('venom-bot');
const express = require('express');
const app = express();

let qrBase64 = null; // Aquí guardaremos el último QR generado
let attemptsCount = 0;

// Nombre de la sesión
const sessionName = 'session-name';

// Arrancar el bot
function startBot() {
  venom.create(
    {
      session: sessionName,
      multidevice: true
    },
    // Callback QR
    (base64Qr, asciiQR, attempts, urlCode) => {
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

// Lógica de respuestas
function start(client) {
  client.onMessage((message) => {
    if (message.body.toLowerCase() === 'hola') {
      client.sendText(message.from, '👋 Hola! ¿Cómo estás?');
    }
  });
}

// 🚀 Servidor Express
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

// Railway usa un puerto dinámico
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`);
});

// Iniciar el bot
startBot();
