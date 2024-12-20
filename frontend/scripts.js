const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; 
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomName;

// Elementos da interface
const createRoomButton = document.getElementById('create-room');
const joinRoomButton = document.getElementById('join-room');
const roomInput = document.getElementById('room');
const usernameInput = document.getElementById('username');
const videoContainer = document.getElementById('video-container');
const linkContainer = document.getElementById('link-container');

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = (Math.random() * 16) | 0;
        return char === 'x' ? random.toString(16) : ((random & 0x3) | 0x8).toString(16);
    });
}

async function createRoom() {
    const room = roomInput.value || generateUUID();

    roomName = room;

    // Gerar o link único para a sala
    const uniqueLink = `${window.location.origin}?room=${encodeURIComponent(roomName)}`;
    linkContainer.innerHTML = `
        <p>Share this link to invite others:</p>
        <input type="text" class="form-control" value="${uniqueLink}" readonly>
    `;
}

async function joinRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room') || roomInput.value;

    if (!room) {
        alert("Room name is required.");
        return;
    }

    roomName = room;

    // Agora token e join
    const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomName}`);
    const { token } = await response.json();

    const uid = await client.join(APP_ID, roomName, token);
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    const localPlayer = `<div id="user-${uid}" class="video-player"></div>`;
    videoContainer.insertAdjacentHTML('beforeend', localPlayer);
    localTracks[1].play(`user-${uid}`);
    await client.publish(localTracks);

    console.log("Joined the room:", roomName);
}

createRoomButton.addEventListener('click', createRoom);
joinRoomButton.addEventListener('click', joinRoom);
