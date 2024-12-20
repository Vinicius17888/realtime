const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
app.use(cors());
app.use(express.json());

const APP_ID = '701280bcf0b4492ea5a2f3876ed83642'; 
const APP_CERTIFICATE = 'eb02c6fca8194518b9229d990d306477'; 

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
