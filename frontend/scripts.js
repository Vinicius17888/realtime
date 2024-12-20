const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Substitua pelo seu APP_ID do Agora.io
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};

const videoContainer = document.getElementById('video-container');
const messageForm = document.getElementById('message-form');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message');
let roomId;

async function createRoom() {
    const response = await fetch('https://realtime-ydgg.onrender.com/create-room', {
        method: 'GET', // Agora usa GET para criar sala
    });

    const { roomId } = await response.json();
    const uniqueLink = `${window.location.origin}?room=${roomId}`;

    document.getElementById('link-container').innerHTML = `
        <p>Share this link to invite others:</p>
        <input type="text" class="form-control" value="${uniqueLink}" readonly>
    `;
}

async function joinRoom() {
    const params = new URLSearchParams(window.location.search);
    roomId = params.get('room');

    if (!roomId) {
        alert('Invalid or missing room link.');
        return;
    }

    // Fetch Agora token
    const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomId}`);
    const { token } = await response.json();

    // Join Agora channel
    const uid = await client.join(APP_ID, roomId, token);

    // Create local tracks (camera and mic)
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    // Display local video
    const localPlayer = `<div id="user-${uid}" class="video-player"></div>`;
    videoContainer.insertAdjacentHTML('beforeend', localPlayer);
    localTracks[1].play(`user-${uid}`);

    // Publish local tracks
    await client.publish(localTracks);

    client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        console.log("Subscribed to user", user.uid);

        if (mediaType === "video") {
            const remoteVideo = `<div id="user-${user.uid}" class="video-player"></div>`;
            videoContainer.insertAdjacentHTML('beforeend', remoteVideo);
            user.videoTrack.play(`user-${user.uid}`);
        }

        if (mediaType === "audio") {
            user.audioTrack.play();
        }
    });

    client.on("user-unpublished", (user) => {
        document.getElementById(`user-${user.uid}`).remove();
    });

    socket.emit('join_room', roomId);
}

// Handle incoming messages
socket.on('receive_message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.username}: ${data.message}`;
    messagesDiv.appendChild(messageElement);
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;

    if (message) {
        socket.emit('send_message', { room: roomId, username: "User", message });
        const messageElement = document.createElement('div');
        messageElement.textContent = `You: ${message}`;
        messagesDiv.appendChild(messageElement);
        messageInput.value = '';
    }
});

// Automatically join room if URL has a room parameter
document.addEventListener('DOMContentLoaded', joinRoom);