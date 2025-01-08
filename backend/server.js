const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sql = require('mssql');
const { v4: uuidv4 } = require('uuid');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Configuração do banco de dados
const dbConfig = {
    server: 'PMSP02-DEV\\DSV',               // Servidor local
    user: 'PMSP\\44620',          // Nome do usuário criado
    password: '',         // Senha criada para o usuário
    database: 'BDViniTest',           // Nome do banco de dados criado
    port: 1433,                        // Porta padrão para SQL Server
    options: {
        encrypt: true,                 // Usar SSL para conexão segura
        trustServerCertificate: true  // Confiança no certificado
    }
};

// Configuração do servidor e Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Variáveis do Agora.io
const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Substitua pelo seu APP_ID
const APP_CERTIFICATE = 'eb02c6fca8194518b9229d990d306477'; // Substitua pelo APP_CERTIFICATE

// Testar conexão com o banco de dados
async function testDatabaseConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Conexão com o banco de dados bem-sucedida!');
        await pool.close();
    } catch (err) {
        console.error('Erro ao conectar ao banco:', err);
    }
}
testDatabaseConnection();

// Rota para criar uma sala
app.post('/create-room', async (req, res) => {
    const roomId = uuidv4();
    const roomName = req.body.roomName || 'Sala Sem Nome';

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('RoomId', sql.UniqueIdentifier, roomId)
            .input('RoomName', sql.NVarChar, roomName)
            .query(`
                INSERT INTO Rooms (RoomId, RoomName)
                VALUES (@RoomId, @RoomName)
            `);

        console.log('Sala criada e salva no banco:', roomId);
        res.json({ roomId, roomName });
    } catch (err) {
        console.error('Erro ao salvar sala no banco:', err);
        res.status(500).json({ error: 'Erro ao criar sala' });
    }
});

// Rota para gerar token do Agora.io
app.get('/agora-token', async (req, res) => {
    const channelName = req.query.channel;

    if (!channelName) {
        return res.status(400).json({ error: 'O nome do canal é obrigatório' });
    }

    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expireTime = Math.floor(Date.now() / 1000) + 3600;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime
        );
        res.json({ token });
    } catch (err) {
        console.error('Erro ao gerar token:', err);
        res.status(500).json({ error: 'Erro ao gerar token' });
    }
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

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
