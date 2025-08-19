// index.js
// Servidor Venom + integración con Botpress

const venom = require("venom-bot");
const express = require("express");
const app = express();

// ==========================
// Configuración Middleware
// ==========================
app.use(express.json()); // cambios: necesario para recibir POST JSON de Botpress

// ==========================
// Variable de puerto
// ==========================
const PORT = process.env.PORT || 8080; // cambios: Railway usa PORT dinámico

// ==========================
// Inicializar Venom
// ==========================
let venomClient;

venom
  .create({
    session: "session-name",
    multidevice: true,
    headless: true,
  })
  .then((client) => {
    venomClient = client;
    console.log("✅ Venom conectado");

    // cambios: registrar onMessage en el cliente ya inicializado
    venomClient.onMessage((message) => {
      console.log("📩 Mensaje entrante de WhatsApp a Botpress:", message);

      // cambios: si quieres enviar mensaje a Botpress, descomenta y configura URL
      // fetch(process.env.BOTPRESS_INCOMING_URL, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId: message.from, text: message.body }),
      // });
    });
  })
  .catch((err) => {
    console.error("❌ Error al iniciar Venom:", err);
  });

// ==========================
// Endpoint POST para recibir mensajes de Botpress
// ==========================
app.post("/botpress/response", async (req, res) => {
  // esto es nuevo: ruta correcta para Botpress
  const { conversationId, text } = req.body;

  if (!conversationId || !text) {
    return res.status(400).json({ error: "Faltan parámetros conversationId o text" }); // esto es nuevo: validación
  }

  try {
    // esto es nuevo: enviar mensaje a WhatsApp usando Venom
    await venomClient.sendText(conversationId, text);
    console.log(`✅ Mensaje enviado a ${conversationId}: ${text}`);
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ Error al enviar mensaje:", error);
    res.status(500).json({ error: "Error enviando mensaje" });
  }
});

// ==========================
// Iniciar servidor Express
// ==========================
app.listen(PORT, () => {
  console.log(`🌐 Servidor escuchando en puerto ${PORT}`);
  console.log(`🌐 Endpoint Botpress: http://localhost:${PORT}/botpress/response`);
}); // cambios: cierre final correcto para evitar "Unexpected end of input"
