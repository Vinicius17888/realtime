const APP_ID = '701280bcf0b4492ea5a2f3876ed83642';
const socket = io('https://realtime-ydgg.onrender.com');

let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localTracks = [];
let remoteUsers = {};
let roomId;

async function initializeRoom() {
    console.log("Initializing room...");
    const params = new URLSearchParams(window.location.search);
    roomId = params.get('room');

    if (!roomId) {
        console.log("No room ID found in URL, creating a new room...");
        const response = await fetch('https://realtime-ydgg.onrender.com/create-room', { method: 'GET' });
        const { roomId: newRoomId } = await response.json();
        roomId = newRoomId;
        const uniqueLink = `${window.location.origin}?room=${roomId}`;
        document.getElementById('link-container').innerHTML = `<p>Share this link: <input value="${uniqueLink}" readonly></p>`;
        console.log(`Room created with ID: ${roomId}`);
    } else {
        console.log(`Joining existing room: ${roomId}`);
        document.getElementById('link-container').innerText = `You joined room: ${roomId}`;
    }
}

async function joinRoom() {
    const params = new URLSearchParams(window.location.search);
    roomId = params.get('room');

    if (!roomId) {
        alert('Invalid or missing room link.');
        return;
    }

    try {
        // Fetch Agora token
        const response = await fetch(`https://realtime-ydgg.onrender.com/agora-token?channel=${roomId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch token.');
        }

        const { token } = await response.json();

        // Join Agora channel
        const uid = await client.join(APP_ID, roomId, token);

        // Create local tracks (camera and mic)
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

        // Display local video
        const localPlayer = `<div id="user-${uid}" class="video-player"></div>`;
        videoContainer.insertAdjacentHTML('beforeend', localPlayer);
        localTracks[1].play(`user-${uid}`);

        // Publish local tracks
        await client.publish(localTracks);

        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            console.log("Subscribed to user", user.uid);

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
        console.error(error);
        alert('Error joining room.');
    }
}


// Handle incoming messages
socket.on('receive_message', (data) => {
    console.log("Message received:", data);
    const messageDiv = document.createElement('div');
    messageDiv.innerText = `${data.username}: ${data.message}`;
    document.getElementById('messages').appendChild(messageDiv);
});

document.getElementById('join-button').addEventListener('click', joinRoom);
document.addEventListener('DOMContentLoaded', initializeRoom);
