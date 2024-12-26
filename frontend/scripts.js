const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomId;

async function initializeRoom() {
    const params = new URLSearchParams(window.location.search);
    roomId = params.get('room');

    if (!roomId) {
        const response = await fetch('https://realtime-ydgg.onrender.com/create-room', { method: 'GET' });
        const { roomId: newRoomId } = await response.json();
        roomId = newRoomId;
        const uniqueLink = `${window.location.origin}?room=${roomId}`;
        document.getElementById('link-container').innerHTML = `<p>Share this link: <input value="${uniqueLink}" readonly></p>`;
    } else {
        document.getElementById('link-container').innerText = `You joined room: ${roomId}`;
    }
}

async function joinRoom() {
    const username = document.getElementById('name').value.trim();

    if (!username) {
        alert('Please enter your name.');
        return;
    }

    const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomId}`);
    const { token } = await response.json();

    const uid = await client.join(APP_ID, roomId, token);
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    localTracks[1].play(`user-${uid}`);
    await client.publish(localTracks);

    client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
            user.videoTrack.play(`user-${user.uid}`);
        }
    });

    client.on("user-unpublished", (user) => {
        document.getElementById(`user-${user.uid}`).remove();
    });

    socket.emit('join_room', roomId);
}

socket.on('receive_message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.innerText = `${data.username}: ${data.message}`;
    document.getElementById('messages').appendChild(messageDiv);
});

document.getElementById('join-button').addEventListener('click', joinRoom);
document.addEventListener('DOMContentLoaded', initializeRoom);
