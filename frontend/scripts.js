const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomId;

const videoContainer = document.getElementById('video-container');
const messageForm = document.getElementById('message-form');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message');
const nameInput = document.getElementById('name');
const linkContainer = document.getElementById('link-container');

async function initializeRoom() {
    const params = new URLSearchParams(window.location.search);
    roomId = params.get('room');

    if (!roomId) {
        const response = await fetch('https://realtime-ydgg.onrender.com/create-room', { method: 'GET' });
        const { roomId: newRoomId } = await response.json();
        roomId = newRoomId;

        const uniqueLink = `${window.location.origin}?room=${roomId}`;
        linkContainer.innerHTML = `
            <p>Share this link to invite others:</p>
            <input type="text" class="form-control" value="${uniqueLink}" readonly>
        `;
    } else {
        linkContainer.innerHTML = `<p>You have joined room: ${roomId}</p>`;
    }
}

async function joinRoom() {
    const username = nameInput.value.trim();

    if (!username) {
        alert('Please enter your name to join the room.');
        return;
    }

    try {
        const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomId}`);
        const { token } = await response.json();

        const uid = await client.join(APP_ID, roomId, token);

        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

        const localPlayer = `<div id="user-${uid}" class="video-player"><p>${username}</p></div>`;
        videoContainer.insertAdjacentHTML('beforeend', localPlayer);
        localTracks[1].play(`user-${uid}`);

        await client.publish(localTracks);

        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);

            if (mediaType === "video") {
                const remotePlayer = `<div id="user-${user.uid}" class="video-player"><p>User ${user.uid}</p></div>`;
                videoContainer.insertAdjacentHTML('beforeend', remotePlayer);
                user.videoTrack.play(`user-${user.uid}`);
            }

            if (mediaType === "audio") {
                user.audioTrack.play();
            }
        });

        client.on("user-unpublished", (user) => {
            const remotePlayer = document.getElementById(`user-${user.uid}`);
            if (remotePlayer) remotePlayer.remove();
        });

        socket.emit('join_room', { room: roomId, username });
    } catch (error) {
        console.error('Error joining room:', error);
        alert('Failed to join the room. Please try again.');
    }
}

socket.on('receive_message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.username}: ${data.message}`;
    messagesDiv.appendChild(messageElement);
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;

    if (message) {
        const username = nameInput.value.trim();
        socket.emit('send_message', { room: roomId, username, message });

        const messageElement = document.createElement('div');
        messageElement.textContent = `You: ${message}`;
        messagesDiv.appendChild(messageElement);

        messageInput.value = '';
    }
});

document.addEventListener('DOMContentLoaded', initializeRoom);