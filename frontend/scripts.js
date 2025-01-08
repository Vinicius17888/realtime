const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomName;

// Elementos da interface
const joinRoomButton = document.getElementById('join-room');
const videoContainer = document.getElementById('video-container');
const messageForm = document.getElementById('message-form');
const messagesDiv = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');

async function joinRoom() {
    roomName = new URLSearchParams(window.location.search).get('room');
    const username = usernameInput.value;

    if (!roomName || !username) {
        alert('Por favor, insira seu nome para entrar na sala.');
        return;
    }

    // Fetch Agora token
    const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomName}`);
    const { token } = await response.json();

    // Join Agora channel
    const uid = await client.join(APP_ID, roomName, token);

    // Create local tracks (camera and mic)
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    // Display local video
    const localPlayer = `<div id="user-${uid}" class="video-player"></div>`;
    videoContainer.insertAdjacentHTML('beforeend', localPlayer);
    localTracks[1].play(`user-${uid}`);

    // Publish local tracks
    await client.publish(localTracks);

    // Notify the socket server
    socket.emit('join_room', roomName);

    // Enable chat functionality
    enableChat();
}

function enableChat() {
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value;
        const username = usernameInput.value;

        if (message && roomName) {
            socket.emit('send_message', { room: roomName, message, username });
            messageInput.value = '';
            displayMessage(username, message); // Display local message
        }
    });

    socket.on('receive_message', (data) => {
        displayMessage(data.username, data.message);
    });
}

function displayMessage(username, message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${username}: ${message}`;
    messagesDiv.appendChild(messageElement);
}

// Automatic room join on page load
document.addEventListener('DOMContentLoaded', joinRoom);
