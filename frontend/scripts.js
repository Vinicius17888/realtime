const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Substitua pelo seu APP_ID do Agora.io
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomName;

// Elementos da interface
const joinRoomButton = document.getElementById('join-room');
const roomInput = document.getElementById('room');
const videoContainer = document.getElementById('video-container');
const messageForm = document.getElementById('message-form');
const messagesDiv = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const leaveRoomButton = document.getElementById('leave-room');
const muteMicButton = document.getElementById('mute-mic');
const toggleCameraButton = document.getElementById('toggle-camera');

let isMicMuted = false;
let isCameraOn = true;

async function joinRoom() {
    // Trocar de sala sem recarregar
    if (roomName) {
        await leaveRoom();
    }

    roomName = roomInput.value;
    const username = usernameInput.value;

    if (!roomName || !username) {
        alert("Please enter a room name and username");
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
    console.log("Local tracks published");

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

// Handle remote user publishing tracks
client.on("user-published", async (user, mediaType) => {
    console.log(`User published: ${user.uid}, mediaType: ${mediaType}`);

    // Subscribe to the user's tracks
    await client.subscribe(user, mediaType);
    console.log(`Subscribed to user: ${user.uid}`);

    if (mediaType === "video") {
        const remotePlayer = `<div id="user-${user.uid}" class="video-player"></div>`;
        videoContainer.insertAdjacentHTML('beforeend', remotePlayer);
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === "audio") {
        user.audioTrack.play();
    }

    // Store remote user
    remoteUsers[user.uid] = user;
});

async function leaveRoom() {
    for (let track of localTracks) {
        track.stop();
        track.close();
    }
    localTracks = [];
    remoteUsers = {};
    videoContainer.innerHTML = '';
    messagesDiv.innerHTML = '';

    await client.leave();
    console.log("Left the room");
    roomName = null;
}

muteMicButton.addEventListener('click', () => {
    if (!localTracks[0]) return;
    if (isMicMuted) {
        localTracks[0].setEnabled(true);
        muteMicButton.textContent = "Mute Mic";
    } else {
        localTracks[0].setEnabled(false);
        muteMicButton.textContent = "Unmute Mic";
    }
    isMicMuted = !isMicMuted;
});

toggleCameraButton.addEventListener('click', () => {
    if (!localTracks[1]) return;
    if (isCameraOn) {
        localTracks[1].setEnabled(false);
        toggleCameraButton.textContent = "Turn Camera On";
    } else {
        localTracks[1].setEnabled(true);
        toggleCameraButton.textContent = "Turn Camera Off";
    }
    isCameraOn = !isCameraOn;
});

leaveRoomButton.addEventListener('click', leaveRoom);
joinRoomButton.addEventListener('click', joinRoom);
