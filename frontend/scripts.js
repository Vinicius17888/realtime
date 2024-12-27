const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomId;

// Criação de sala e obtenção do link
async function createRoom() {
    try {
        const response = await fetch('https://realtime-ydgg.onrender.com/create-room');
        const { roomId } = await response.json();
        const roomLink = `${window.location.origin}?room=${roomId}`;
        document.getElementById('link-container').innerHTML = `
            <p>Share this link to invite others:</p>
            <input type="text" class="form-control" value="${roomLink}" readonly>
        `;
        joinRoom(roomId); // Host entra automaticamente na sala criada
    } catch (error) {
        console.error('Failed to create room:', error);
    }
}

// Entrar na sala
async function joinRoom(room) {
    try {
        roomId = room || new URLSearchParams(window.location.search).get('room');

        if (!roomId) {
            alert('Invalid or missing room link.');
            return;
        }

        const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomId}`);
        if (!response.ok) {
            throw new Error('Could not join the room.');
        }

        const { token } = await response.json();
        const uid = await client.join(APP_ID, roomId, token);

        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

        const localPlayer = `<div id="user-${uid}" class="video-player"></div>`;
        document.getElementById('video-container').insertAdjacentHTML('beforeend', localPlayer);
        localTracks[1].play(`user-${uid}`);

        await client.publish(localTracks);

        client.on('user-published', async (user, mediaType) => {
            await client.subscribe(user, mediaType);

            if (mediaType === 'video') {
                const remotePlayer = `<div id="user-${user.uid}" class="video-player"></div>`;
                document.getElementById('video-container').insertAdjacentHTML('beforeend', remotePlayer);
                user.videoTrack.play(`user-${user.uid}`);
            }

            if (mediaType === 'audio') {
                user.audioTrack.play();
            }
        });

        client.on('user-unpublished', (user) => {
            document.getElementById(`user-${user.uid}`).remove();
        });

        socket.emit('join_room', roomId);
    } catch (error) {
        console.error('Failed to join room:', error);
        alert(error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const room = new URLSearchParams(window.location.search).get('room');
    if (room) {
        joinRoom(room);
    }
});

document.getElementById('create-room').addEventListener('click', createRoom);
