const venom = require('venom-bot');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode'); // para generar PNG

// Nombre de la sesión
const sessionName = 'session-name';
const sessionPath = path.join(__dirname, 'tokens', sessionName);

// Crear carpeta de tokens si no existe
fs.mkdirSync(sessionPath, { recursive: true });

// Función principal para arrancar el bot
function startBot() {
  venom.create(
    {
      session: sessionName,
      multidevice: true
    },
    // Callback QR
    async (base64Qr, asciiQR, attempts, urlCode) => {
      console.log(asciiQR); // QR en consola

      // Generar archivo QR en PNG usando urlCode
      const qrPath = path.join(sessionPath, 'qr.png');
      try {
        await QRCode.toFile(qrPath, urlCode, {
          type: 'png',
          width: 300,
          errorCorrectionLevel: 'H'
        });
        console.log(`✅ QR guardado en: ${qrPath}`);
      } catch (err) {
        console.error('❌ Error al guardar QR:', err);
      }
    },
    // Callback status de sesión
    (statusSession, session) => {
      console.log('Status Session:', statusSession);
      console.log('Session name:', session);
    }
  )
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
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

startBot();
