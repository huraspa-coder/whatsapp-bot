const venom = require('venom-bot');
const fs = require('fs');
const path = require('path');

const sessionName = 'session-name';
const sessionPath = path.join(__dirname, 'tokens', sessionName);

// Asegurarse de que la carpeta de tokens exista
fs.mkdirSync(sessionPath, { recursive: true });

venom
  .create(
    sessionName,
    undefined,
    undefined,
    {
      headless: true,
      useChrome: true,
      disableSpins: true,
      logQR: false, // no imprimir QR en consola
    }
  )
  .then(client => start(client))
  .catch(err => console.error(err));

// Guardar QR en PNG y HTML
venom.onStateChange((state) => {
  if (state === 'CONNECTED') {
    console.log('Bot conectado');
  }
});

venom.onQRCode((base64Qr, asciiQR, urlCode) => {
  // Guardar PNG
  const qrBuffer = Buffer.from(base64Qr, 'base64');
  fs.writeFileSync(path.join(sessionPath, 'qr.png'), qrBuffer);

  // Guardar HTML
  const htmlContent = `<img src="data:image/png;base64,${base64Qr}" alt="QR Code">`;
  fs.writeFileSync(path.join(sessionPath, 'qr.html'), htmlContent);

  console.log('QR generado en PNG y HTML en la carpeta tokens/');
});

function start(client) {
  // Tu lógica del bot aquí
  console.log('Bot listo para usar');
}
