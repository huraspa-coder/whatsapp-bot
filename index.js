// index.js
const venom = require('venom-bot');
const express = require('express');
const app = express();

const registerBotpressRoutes = require('./botpress-integration');

app.use(express.json());

let qrBase64 = null;
let attemptsCount = 0;
const sessionName = 'session-name';

function startBot() {
  venom.create(
    {
      session: sessionName,
      multidevice: true,
      folderNameToken: process.env.SESSION_PATH || './.venom-sessions'
    },
    (base64Qr, asciiQR, attempts) => {
      console.log(asciiQR);
      qrBase64 = base64Qr;
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

function start(client) {
  registerBotpressRoutes({ app, venomClient: client });

  client.onMessage((message) => {
    if (message.body?.toLowerCase() === 'ping') {
      client.sendText(message.from, 'pong ✅');
    }
  });
}

app.get('/qr', (req, res) => {
  if (!qrBase64) {
    return res.send('<h2>Aún no se ha generado el QR.</h2>');
  }
  res.send(`<img src="${qrBase64}" alt="QR Code" />`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`);
});

startBot();
