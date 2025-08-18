const venom = require("venom-bot");
const express = require("express");
const fs = require("fs");

const app = express();

// Ruta para servir el QR
app.get("/qr", (req, res) => {
  res.sendFile(__dirname + "/qr.html");
});

venom
  .create({
    session: "session-name",
    catchQR: (base64Qr, asciiQR) => {
      // mostrar ascii en consola
      console.log(asciiQR);

      // guardar el QR como html básico
      const html = `
        <html>
          <body>
            <h2>Escanea este QR con WhatsApp</h2>
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
    if (message.body === "Hola") {
      client.sendText(message.from, "👋 Hola, soy tu bot con Venom!");
    }
  });
}

// 🚀 Levantar el servidor en Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🌐 Servidor en http://localhost:${PORT}/qr`)
);
