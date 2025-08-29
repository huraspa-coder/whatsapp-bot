const venom = require('venom-bot');

venom.create({
  session: 'venom-session',
  multidevice: true, // usa multidevice (WhatsApp Web)
  headless: true,    // modo headless para servidores
  browserArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium'
})
.then(client => {
  console.log('Venom BOT conectado 🚀');

  // Ejemplo: responder cualquier mensaje con "Hola!"
  client.onMessage(message => {
    client.sendText(message.from, 'Hola!');
  });
})
.catch(err => console.error('Error iniciando Venom:', err));
