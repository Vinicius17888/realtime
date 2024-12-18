const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; // Seu Agora App ID
let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};

const joinRoomButton = document.getElementById('join-room');
const roomInput = document.getElementById('room');
const videoContainer = document.getElementById('video-container');

async function joinRoom() {
    const roomName = roomInput.value;

    if (!roomName) {
        alert("Please enter a room name");
        return;
    }

    try {
        // Buscar token do backend
        const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomName}`);
        const { token } = await response.json();

        // Entrar no canal do Agora.io
        const uid = await client.join(APP_ID, roomName, token);
        console.log("Joined channel:", roomName);

        // Capturar vídeo e áudio
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

        // Exibir vídeo local
        const localPlayer = `<div id="user-${uid}" class="video-player"></div>`;
        videoContainer.insertAdjacentHTML('beforeend', localPlayer);
        localTracks[1].play(`user-${uid}`);

        // Publicar vídeo local
        await client.publish(localTracks);
        console.log("Local tracks published");

    } catch (error) {
        console.error("Error joining room:", error);
    }
}

client.on("user-published", async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    console.log("User published:", user.uid);

    if (mediaType === "video") {
        const remotePlayer = `<div id="user-${user.uid}" class="video-player"></div>`;
        videoContainer.insertAdjacentHTML('beforeend', remotePlayer);
        user.videoTrack.play(`user-${user.uid}`);
    }
});

client.on("user-unpublished", (user) => {
    console.log("User unpublished:", user.uid);
    document.getElementById(`user-${user.uid}`).remove();
});

joinRoomButton.addEventListener('click', joinRoom);
