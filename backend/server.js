const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Substitua com seu APP_ID
const APP_CERTIFICATE = 'eb02c6fca8194518b9229d990d306477'; // Substitua com seu APP_CERTIFICATE

let activeRooms = {}; // Objeto para armazenar salas ativas

// Criar uma sala
app.get('/create-room', (req, res) => {
    const roomId = uuidv4();
    activeRooms[roomId] = true;
    console.log(`Room created: ${roomId}`);
    res.json({ roomId });
});

// Gerar token do Agora.io
app.get('/agora-token', (req, res) => {
    const channelName = req.query.channel;

    if (!channelName || !activeRooms[channelName]) {
        console.log(`Invalid or non-existent room: ${channelName}`);
        return res.status(400).send('Invalid or non-existent room.');
    }

    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expireTime = Math.floor(Date.now() / 1000) + 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        role,
        expireTime
    );

    console.log(`Token generated for room ${channelName}`);
    res.json({ token });
});

// Configuração do Socket.IO
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', (roomId) => {
        if (activeRooms[roomId]) {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
        } else {
            socket.emit('error', 'Room does not exist');
        }
    });

    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
