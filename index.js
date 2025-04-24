// index.js
require('dotenv').config();

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const { createClient } = require('redis');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

const redisUrl = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
const subClient = createClient({ url: redisUrl });

;(async () => {
  await subClient.connect();

  // Quando o CI4 publicar no canal, enviamos pra todos os sockets
  await subClient.subscribe(process.env.REDIS_CHANNEL, message => {
    let data;
    try { data = JSON.parse(message); }
    catch { data = { raw: message }; }
    io.emit('novaSolicitacao', data);
  });

  console.log(`🔴 Inscrito no canal Redis "${process.env.REDIS_CHANNEL}"`);
})();

io.on('connection', socket => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  // opcional: avisar o cliente assim que conectar
  socket.emit('message', '👋 Conectado ao e-Manutenção real-time!');
});

// rota de health-check
app.get('/', (req, res) => {
  res.send('🚀 WebSocket Server UP');
});

const port = process.env.WS_PORT || 3000;
server.listen(port, () => {
  console.log(`⚡ Socket.io rodando em http://localhost:${port}`);
});
