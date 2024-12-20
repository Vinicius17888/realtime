const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
app.use(cors());
app.use(express.json());

const APP_ID = 'YOUR_APP_ID'; // Substitua pelo seu APP_ID do Agora.io
const APP_CERTIFICATE = 'YOUR_APP_CERTIFICATE'; // Substitua pelo APP_CERTIFICATE

app.get('/agora-token', (req, res) => {
    const channelName = req.query.channel;

    if (!channelName) {
        return res.status(400).send('Channel name is required');
    }

    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expireTime = Math.floor(Date.now() / 1000) + 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime);
    res.json({ token });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
