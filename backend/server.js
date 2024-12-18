const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/agora-token', (req, res) => {
    const APP_ID = process.env.APP_ID;
    const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
    const channelName = req.query.channel;

    if (!channelName) {
        return res.status(400).json({ error: 'Channel name is required' });
    }

    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expireTime = Math.floor(Date.now() / 1000) + 3600;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role,
            expireTime
        );
        res.json({ token });
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({ error: 'Token generation failed' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
