const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Seu Agora App ID

const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let roomName;

const joinRoomButton = document.getElementById('join-room');
const roomInput = document.getElementById('room');
const videoContainer = document.getElementById('video-container');

const messageForm = document.getElementById('message-form');
const messagesDiv = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');

async function joinRoom() {
    roomName = roomInput.value;
    const username = usernameInput.value;

    if (!roomName || !username) {
        alert("Please enter a room name and username");
        return;
    }

    // Socket.IO - Join Chat Room
    socket.emit('join_room', roomName);

    // Fetch Agora token
    const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomName}`);
    const { token } = await response.json();

    const uid = await client.join(APP_ID, roomName, token);
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    // Display local video
    const localPlayer = `<div id="user-${uid}" class="video-player"></div>`;
    videoContainer.insertAdjacentHTML('beforeend', localPlayer);
    localTracks[1].play(`user-${uid}`);

    await client.publish(localTracks);
    console.log("Local tracks published");
}

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    const username = usernameInput.value;

    if (message && roomName) {
        socket.emit('send_message', { room: roomName, message, username });
        messageInput.value = '';
    }
});

socket.on('receive_message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.username}: ${data.message}`;
    messagesDiv.appendChild(messageElement);
});

joinRoomButton.addEventListener('click', joinRoom);