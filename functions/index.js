const { onRequest } = require("firebase-functions/v2/https");
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));

app.all('*', (req, res) => {
    res.json({
        status: 'online',
        mode: 'safe_mode',
        message: 'Backend is responding. Database is temporarily disabled to prevent crashes.',
        path: req.path,
        url: req.url,
        method: req.method
    });
});

exports.server = onRequest({
    maxInstances: 10,
    invoker: 'public'
}, app);
