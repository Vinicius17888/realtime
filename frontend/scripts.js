const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Substitua pelo App ID do Agora.io
let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};

const socket = io('https://realtime-ydgg.onrender.com'); // Backend hospedado no Render

const joinRoomButton = document.getElementById('join-room');
const roomInput = document.getElementById('room');
const messageForm = document.getElementById('message-form');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const messagesDiv = document.getElementById('messages');

async function joinRoom() {
    const roomName = roomInput.value;
    const username = usernameInput.value;

    if (!roomName || !username) return alert('Please enter room name and username');

    const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomName}`);
    const { token } = await response.json();

    const uid = await client.join(APP_ID, roomName, token);
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    const videoContainer = document.getElementById('video-container');
    localTracks[1].play(videoContainer);

    await client.publish(localTracks);

    socket.emit('join_room', roomName);
}

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const room = roomInput.value;
    const message = messageInput.value;
    const username = usernameInput.value;

    if (room && message) {
        socket.emit('send_message', { room, message, username });
        messageInput.value = '';
    }
});

socket.on('receive_message', ({ message, username }) => {
    const messageElement = document.createElement('p');
    messageElement.textContent = `${username}: ${message}`;
    messagesDiv.appendChild(messageElement);
});

joinRoomButton.addEventListener('click', joinRoom);
