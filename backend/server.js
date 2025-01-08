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
    password: 'suaSenha',
    database: 'suaBaseDeDados',
    server: 'seuServidor',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

(async () => {
    try {
        const pool = await sql.connect(sqlConfig);
        console.log("Conexão com o banco de dados bem-sucedida!");
    } catch (error) {
        console.error("Erro ao conectar ao banco de dados:", error);
    }
})();

// Rota para criar sala com link único
app.get('/create-room', async (req, res) => {
    const roomId = uuidv4(); // Gera um ID único para a sala
    const createdBy = req.query.createdBy || 'Unknown'; // Nome do criador da sala

    try {
        console.log("Tentando salvar a sala no banco de dados...");
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('RoomId', sql.UniqueIdentifier, roomId)
            .input('CreatedBy', sql.NVarChar, createdBy)
            .query('INSERT INTO Rooms (RoomId, CreatedBy) VALUES (@RoomId, @CreatedBy)');

        console.log("Sala salva no banco de dados:", result);
        res.json({ roomId });
    } catch (error) {
        console.error("Erro ao salvar sala no banco de dados:", error);
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
    console.log(`Usuário conectado: ${socket.id}`);

    socket.on('join_room', async (roomId, participantName) => {
        try {
            console.log(`Tentando salvar participante na sala ${roomId}`);
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                .input('RoomId', sql.UniqueIdentifier, roomId)
                .input('ParticipantName', sql.NVarChar, participantName)
                .query('INSERT INTO Participants (RoomId, ParticipantName) VALUES (@RoomId, @ParticipantName)');

            console.log("Participante salvo no banco de dados:", result);
            socket.join(roomId);
            console.log(`${participantName} entrou na sala ${roomId}`);
        } catch (err) {
            console.error("Erro ao salvar participante no banco de dados:", err);
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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
