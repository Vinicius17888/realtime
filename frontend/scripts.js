const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};

const videoContainer = document.getElementById('video-container');
let roomId;

// Função para criar uma sala automaticamente
async function createRoom() {
    const response = await fetch('https://realtime-ydgg.onrender.com/create-room');
    const { roomId } = await response.json();
    const uniqueLink = `${window.location.origin}?room=${roomId}`;
    document.getElementById('link-container').innerHTML = `
        <p>Share this link to invite others:</p>
        <input type="text" class="form-control" value="${uniqueLink}" readonly>
    `;
    console.log(`Room created: ${roomId}`);
    joinRoom(roomId);
}

// Função para entrar em uma sala
async function joinRoom(room) {
    roomId = room || new URLSearchParams(window.location.search).get('room');

    if (!roomId) {
        alert('Invalid or missing room link.');
        return;
    }

    try {
        const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomId}`);
        const { token } = await response.json();

        // Conectar ao canal do Agora.io
        const uid = await client.join(APP_ID, roomId, token);

        // Configurar trilhas locais
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

        // Adicionar vídeo local
        const localPlayer = `<div id="user-${uid}" class="video-player"></div>`;
        videoContainer.insertAdjacentHTML('beforeend', localPlayer);
        localTracks[1].play(`user-${uid}`);

        // Publicar trilhas locais
        await client.publish(localTracks);

        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);

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
    } catch (error) {
        console.error('Failed to join room:', error);
        alert('Could not join the room.');
    }
}

// Conectar no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
        joinRoom(room);
    } else {
        createRoom();
    }
});
