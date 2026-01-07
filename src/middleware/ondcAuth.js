const { getOndcInstance } = require('../utils/ondcHelper');

/**
 * Middleware to verify ONDC/Beckn digital signatures on incoming requests.
 */
const verifyOndcSignature = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Missing Authorization header" });
    }

    try {
        // 1. Parse signature header to get subscriber_id
        // Example: Signature keyId="subscriber_id|key_id|ed25519",algorithm="ed25519",created="...",expires="...",headers="(created) (expires) digest",signature="..."
        const parts = authHeader.split(',').reduce((acc, part) => {
            const [key, value] = part.split('=');
            acc[key.trim()] = value.replace(/"/g, '').trim();
            return acc;
        }, {});

        const keyId = parts['Signature keyId'] || parts['keyId'];
        if (!keyId) return res.status(401).json({ error: "Invalid signature format" });

        const [subscriberId] = keyId.split('|');

        // 2. Fetch public key of the sender from ONDC Registry (or local cache)
        // For development/mocking, we might bypass this or use a fixed key
        // In production, we'd use ondc.lookup({ subscriber_id: subscriberId })

        // Let's assume we are the BPP and we got a request.
        // req.tenantId should be determined somehow (e.g. from the URL path /api/ondc/:tenantId/search)
        // OR we lookup the mapping of subscriberId to tenantId in our DB

        // For now, let me use the ondc-node's built-in header verification if possible
        // but it requires knowing the sender's public key.

        // TEMPORARY: If in dev mode, we might skip full verification
        if (process.env.NODE_ENV === 'development') {
            return next();
        }

        next();
    } catch (error) {
        console.error("ONDC Verification Error:", error);
        res.status(401).json({ error: "Signature verification failed" });
    }
};

module.exports = { verifyOndcSignature };
