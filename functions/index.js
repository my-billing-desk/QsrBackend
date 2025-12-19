const { onRequest } = require("firebase-functions/v2/https");
const app = require("./server");

// Serve the Express app as a Cloud Function called 'api'
exports.api = onRequest({
    maxInstances: 10,
    cors: true
}, app);
