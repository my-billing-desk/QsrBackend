const libsodium = require('libsodium-wrappers');

/**
 * Utility for ONDC Digital Signatures (Beckn Protocol)
 */
const OndcSecurity = {
    /**
     * Creates a Beckn signing string from a request body
     */
    createSigningString: async (body, created, expires) => {
        await libsodium.ready;
        const sodium = libsodium;

        // 1. Create BLAKE-512 digest of the JSON body
        const bodyContent = typeof body === 'string' ? body : JSON.stringify(body);
        const digest = sodium.crypto_generichash(64, sodium.from_string(bodyContent));
        const digestBase64 = sodium.to_base64(digest, sodium.base64_variants.ORIGINAL);

        // 2. Format timing
        if (!created) created = Math.floor(Date.now() / 1000).toString();
        if (!expires) expires = (parseInt(created) + 3600).toString(); // 1 hour expiry

        // 3. Construct signing string
        const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digestBase64}`;

        return { signingString, created, expires };
    },

    /**
     * Signs a signing string using a private key
     */
    signMessage: async (signingString, privateKey) => {
        await libsodium.ready;
        const sodium = libsodium;
        const signature = sodium.crypto_sign_detached(
            signingString,
            sodium.from_base64(privateKey, sodium.base64_variants.ORIGINAL)
        );
        return sodium.to_base64(signature, sodium.base64_variants.ORIGINAL);
    },

    /**
     * Verifies a signature against a signing string and public key
     */
    verifyMessage: async (signature, signingString, publicKey) => {
        try {
            await libsodium.ready;
            const sodium = libsodium;
            return sodium.crypto_sign_verify_detached(
                sodium.from_base64(signature, sodium.base64_variants.ORIGINAL),
                signingString,
                sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL)
            );
        } catch (e) {
            console.error("Verification error:", e);
            return false;
        }
    },

    /**
     * Formats the Authorization header for ONDC
     */
    generateAuthHeader: (subscriberId, keyId, signature, created, expires) => {
        return `Signature keyId="${subscriberId}|${keyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;
    }
};

module.exports = OndcSecurity;
