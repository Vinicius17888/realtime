const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const sql = require('mssql');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } // Permitir qualquer origem para Socket.IO
});

// Configurar CORS para todas as requisições HTTP
app.use(cors());

// Configuração do SQL Server
const sqlConfig = {
    user: 'seuUsuario',
    password: '',
    database: 'PMSP02-DEV',
    server: 'BDViniTest',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Rota para criar sala com link único
app.get('/create-room', async (req, res) => {
    const roomId = uuidv4(); // Gera um ID único para a sala
    const createdBy = req.query.createdBy || 'Unknown'; // Nome do criador da sala

    try {
        let pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('RoomId', sql.UniqueIdentifier, roomId)
            .input('CreatedBy', sql.NVarChar, createdBy)
            .query('INSERT INTO Rooms (RoomId, CreatedBy) VALUES (@RoomId, @CreatedBy)');

        res.json({ roomId });
    } catch (error) {
        console.error('Erro ao criar sala no banco:', error);
        res.status(500).json({ error: 'Erro ao criar sala.' });
    }
});

// Rota para gerar token do Agora
app.get('/agora-token', (req, res) => {
    const APP_ID = process.env.APP_ID;
    const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
    const channelName = req.query.channel;

    if (!channelName) {
        return res.status(400).json({ error: 'Channel name is required' });
    }

    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expireTime = Math.floor(Date.now() / 1000) + 3600;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime
        );
        res.json({ token });
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({ error: 'Token generation failed' });
    }
});

// Socket.IO - Chat Dinâmico
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
