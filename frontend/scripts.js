const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Substitua pelo seu App ID do Agora.io
const roomInput = document.getElementById('room');
const joinRoomButton = document.getElementById('join-room');
const videoContainer = document.getElementById('video-container');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];

async function joinRoom() {
    const roomName = roomInput.value;

    if (!roomName) {
        alert('Please enter a room name');
        return;
    }

    try {
        // Buscar o token do backend
        const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomName}`);
        const { token } = await response.json();

        // Entrar no canal do Agora.io
        const uid = await client.join(APP_ID, roomName, token);
        console.log(`Joined channel: ${roomName}, UID: ${uid}`);

        // Capturar vídeo e áudio
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

        // Mostrar o vídeo local
        const player = `<div id="user-${uid}"></div>`;
        videoContainer.insertAdjacentHTML('beforeend', player);
        localTracks[1].play(`user-${uid}`);

        // Publicar as tracks locais
        await client.publish(localTracks);
        console.log("Local tracks published");
    } catch (error) {
        console.error("Error joining room:", error);
        alert("Failed to join room. Check the console for details.");
    }
}

joinRoomButton.addEventListener('click', joinRoom);
