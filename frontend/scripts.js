const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Substitua pelo seu APP_ID do Agora.io
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomName;

// Elementos da interface
const joinRoomButton = document.getElementById('join-room');
const roomInput = document.getElementById('room');
const usernameInput = document.getElementById('username');
const videoContainer = document.getElementById('video-container');

// Captura automaticamente o parâmetro 'room' da URL
function getRoomFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
}

async function joinRoom() {
    roomName = getRoomFromURL() || roomInput.value;
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
}

// Verifica automaticamente o parâmetro 'room' ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const roomFromURL = getRoomFromURL();
    if (roomFromURL) {
        roomInput.value = roomFromURL; // Preenche o input com o nome da sala
    }
});

// Botão para entrar na sala
joinRoomButton.addEventListener('click', joinRoom);
