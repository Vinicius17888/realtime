const express = require('express');
const http = require('http'); // Necessário para usar o Socket.IO com Express
const { Server } = require('socket.io');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Permitir conexões de qualquer origem
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
const APP_CERTIFICATE = 'eb02c6fca8194518b9229d990d306477';

// Rota raiz para verificar se o backend está rodando
app.get('/', (req, res) => {
    res.send('Conectado. Use /agora-token to generate tokens.');
});

// Rota para gerar token do Agora.io
app.get('/agora-token', (req, res) => {
    const channelName = req.query.channel;

    if (!channelName) {
        return res.status(400).send('Channel name is required.');
    }

    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expireTime = Math.floor(Date.now() / 1000) + 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime);
    res.json({ token });
});

// Configuração do Socket.IO
io.on('connection', (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Usuário ${socket.id} entrou na sala ${room}`);
    });

    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`Usuário desconectado: ${socket.id}`);
    });
});

// Inicia o servidor na porta configurada
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
