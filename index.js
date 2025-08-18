const venom = require('venom-bot');
const fs = require('fs');
const path = require('path');

// Nombre de la sesión
const sessionName = 'session-name';
const sessionPath = path.join(__dirname, 'tokens', sessionName);

// Crear carpeta de tokens si no existe
fs.mkdirSync(sessionPath, { recursive: true });

// Función principal para arrancar el bot
function startBot() {
  venom.create(
    sessionName,
    undefined,
    undefined,
    {
      headless: true,
      useChrome: true,
      disableSpins: true,
      logQR: false,
      puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    }
  )
  .then(client => {
    console.log('Bot listo y autenticado');
    // Aquí puedes poner tu lógica del bot
  })
  .catch(err => console.error('Error al iniciar el bot:', err));
}

// Función para generar QR si no hay sesión
function generateQR() {
  venom
    .create(
      sessionName,
      undefined,
      undefined,
      {
        headless: true,
        useChrome: true,
        logQR: false,
        disableSpins: true,
        puppeteerOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      }
    )
    .then(client => start(client))
    .catch(err => console.error(err));

  venom.onQRCode((base64Qr) => {
    // Guardar PNG
    const qrBuffer = Buffer.from(base64Qr, 'base64');
    fs.writeFileSync(path.join(sessionPath, 'qr.png'), qrBuffer);

    // Guardar HTML
    const htmlContent = `<img src="data:image/png;base64,${base64Qr}" alt="QR Code">`;
    fs.writeFileSync(path.join(sessionPath, 'qr.html'), htmlContent);

    console.log('QR generado en PNG y HTML en tokens/' + sessionName);
  });

  function start(client) {
    console.log('Bot listo, escanea el QR para iniciar sesión');
  }
}

// Revisar si ya existe la sesión
if (fs.readdirSync(sessionPath).length > 0) {
  console.log('Sesión encontrada, arrancando bot headless...');
  startBot();
} else {
  console.log('No se encontró sesión, generando QR...');
  generateQR();
}
