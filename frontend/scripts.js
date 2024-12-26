const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomId;

async function initializeRoom() {
    const params = new URLSearchParams(window.location.search);
    roomId = params.get('room');

    if (!roomId) {
        const response = await fetch('https://realtime-ydgg.onrender.com/create-room', { method: 'GET' });
        const { roomId: newRoomId } = await response.json();
        roomId = newRoomId;
        const uniqueLink = `${window.location.origin}?room=${roomId}`;
        document.getElementById('link-container').innerHTML = `<p>Share this link: <input value="${uniqueLink}" readonly></p>`;
    } else {
        document.getElementById('link-container').innerText = `You joined room: ${roomId}`;
    }
}

async function joinRoom() {
    console.log("Join button clicked!"); // Verificar se a função é executada
    const username = document.getElementById('name').value.trim();

    if (!username) {
        alert('Please enter your name.');
        return;
    }

    try {
        const response = await fetch(`https://seu-backend.onrender.com/agora-token?channel=${roomId}`);
        const { token } = await response.json();

        console.log("Token fetched:", token); // Confirmar que o token foi gerado corretamente

        const uid = await client.join(APP_ID, roomId, token);
        console.log("Agora UID:", uid); // Confirmar que a conexão foi estabelecida
    } catch (error) {
        console.error('Error joining room:', error);
    }
}


socket.on('receive_message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.innerText = `${data.username}: ${data.message}`;
    document.getElementById('messages').appendChild(messageDiv);
});

document.getElementById('join-button').addEventListener('click', joinRoom);
document.addEventListener('DOMContentLoaded', initializeRoom);
