const venom = require("venom-bot");
const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta para servir el QR en HTML
app.get("/qr", (req, res) => {
  res.sendFile(__dirname + "/qr.html");
});

venom
  .create({
    session: "session-name",
    multidevice: true,            // soporta multidispositivo
    useChrome: true,              // fuerza a usar Chrome instalado
    headless: true,
    browserArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
    catchQR: (base64Qr, asciiQR) => {
      // mostrar ascii en consola
      console.log(asciiQR);

      // guardar el QR en un HTML accesible
      const html = `
        <html>
          <body style="text-align:center;font-family:sans-serif">
            <h2>Escanea este QR con WhatsApp 📱</h2>
            <img src="${base64Qr}" />
          </body>
        </html>
      `;
      fs.writeFileSync("qr.html", html);
    },
  })
  .then((client) => start(client))
  .catch((err) => console.error(err));

function start(client) {
  client.onMessage((message) => {
    if (message.body.toLowerCase() === "hola") {
      client.sendText(message.from, "👋 Hola, soy tu bot con Venom!");
    }
  });
}

// 🚀 Levantar el servidor en Railway
app.listen(PORT, () =>
  console.log(`🌐 Servidor en http://localhost:${PORT}/qr`)
);
