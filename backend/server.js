const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());

// Rota para gerar tokens do Agora.io
app.get('/agora-token', (req, res) => {
    const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
    const APP_CERTIFICATE = 'Yeb02c6fca8194518b9229d990d306477';
    const channelName = req.query.channel;

    if (!channelName) return res.status(400).json({ error: 'Channel name is required' });

    const uid = 0; // UID padrão
    const role = RtcRole.PUBLISHER;
    const expireTime = Math.floor(Date.now() / 1000) + 3600; // Token válido por 1h

    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime
    );

    res.json({ token });
});

// Socket.IO
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('send_message', ({ room, message, username }) => {
        io.to(room).emit('receive_message', { message, username });
    });

    socket.on('disconnect', () => console.log(`User disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
