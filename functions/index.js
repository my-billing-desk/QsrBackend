const { onRequest } = require("firebase-functions/v2/https");
const app = require('./server');

// Export the Express app as a Firebase Cloud Function
exports.api = onRequest({
    maxInstances: 10,
    invoker: 'public',
    // Increase memory if needed, though default 256MB might be tight for sqlite+express
    memory: "512MiB"
}, app);

// Forced update to ensure deployment picks up the switch from safe_mode to real server


