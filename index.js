const venom = require('venom-bot');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

venom.create({
    session: 'session-name',
    multidevice: true,
    useChrome: true,             // fuerza a usar Chrome instalado
    headless: true,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox']
})
.then(client => start(client))
.catch(err => console.log(err));

function start(client) {
    client.onMessage(msg => {
        if(msg.body.toLowerCase() === 'hola') {
            client.sendText(msg.from, '¡Hola! Soy tu bot en Railway 🤖');
        }
    });
}

app.get('/', (req, res) => res.send('Bot de WhatsApp corriendo 🚀'));
app.listen(port, () => console.log(`Servidor activo en puerto ${port}`));
