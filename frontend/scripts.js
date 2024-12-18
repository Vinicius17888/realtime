// Agora.io Configurations
const APP_ID = "701280bcf0b4492ea5a2f3876ed83642"; // Substitua pelo seu App ID do Agora.io
let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};

let roomName = '';
let token = "007eJxTYHivIMAf96GfxWkua+YDlulz1YVbZrC8vGXxgnPvZM8c8RAFBnMDQyMLg6TkNIMkExNLo9RE00SjNGMLc7PUFAtjMxOj8/zJ6Q2BjAy+aV+YGRkgEMRnYchNzMxjYAAAZXUcbA=="; // Token gerado para o canal

// Socket.IO Configurations
const socket = io('https://seu-backend.onrender.com'); // Atualize com a URL do backend hospedado

// Join a Room with Agora.io
async function joinRoom() {
    roomName = document.getElementById('room').value;
    const username = document.getElementById('username').value;

    if (!roomName || !username) {
        alert('Please enter a room name and username');
        return;
    }

    // Fetch Agora Token from your backend
    try {
        const response = await fetch(`https://seu-backend.onrender.com/agora-token?channel=${roomName}`);
        const data = await response.json();
        token = data.token; // Token enviado pelo backend
    } catch (error) {
        console.error('Error fetching Agora token:', error);
        alert('Failed to fetch Agora token. Please try again.');
        return;
    }

    // Agora Join
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);

    const uid = await client.join(APP_ID, roomName, token);

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    const [audioTrack, videoTrack] = localTracks;

    let player = `<div id="user-container-${uid}">
                    <div id="user-${uid}"></div>
                  </div>`;
    document.getElementById('video-container').insertAdjacentHTML('beforeend', player);

    videoTrack.play(`user-${uid}`);
    await client.publish([audioTrack, videoTrack]);

    // Socket.IO Join
    socket.emit('join_room', roomName);

    // Display Chat Messages
    socket.on('receive_message', ({ message, username }) => {
        const messageElement = document.createElement('p');
        messageElement.textContent = `${username}: ${message}`;
        document.getElementById('messages').appendChild(messageElement);
    });
}

// Handle Agora User Events
function handleUserPublished(user, mediaType) {
    const id = user.uid;
    client.subscribe(user, mediaType).then(() => {
        if (mediaType === 'video') {
            let player = `<div id="user-container-${id}">
                            <div id="user-${id}"></div>
                          </div>`;
            document.getElementById('video-container').insertAdjacentHTML('beforeend', player);
            user.videoTrack.play(`user-${id}`);
        }
        if (mediaType === 'audio') {
            user.audioTrack.play();
        }
    });
}

function handleUserUnpublished(user) {
    const id = user.uid;
    document.getElementById(`user-container-${id}`).remove();
}

// Send a Chat Message
document.getElementById('message-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const message = document.getElementById('message').value;
    const username = document.getElementById('username').value;

    if (message && username && roomName) {
        socket.emit('send_message', { room: roomName, message, username });
        document.getElementById('message').value = '';
    }
});

// Attach Join Room Button
document.getElementById('join-room').addEventListener('click', joinRoom);
