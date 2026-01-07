const express = require('express');
const router = express.Router();
const ondcController = require('../controllers/OndcController');
const { protect } = require('../middleware/authMiddleware');

const { verifyOndcSignature } = require('../middleware/ondcAuth');

// ONDC Callback Endpoints - Secured with Digital Signature Verification
router.post('/search', verifyOndcSignature, ondcController.search);
router.post('/select', verifyOndcSignature, ondcController.select);
router.post('/init', verifyOndcSignature, ondcController.init);
router.post('/confirm', verifyOndcSignature, ondcController.confirm);
router.post('/status', verifyOndcSignature, ondcController.status);
router.post('/update', verifyOndcSignature, ondcController.update);
router.post('/track', verifyOndcSignature, ondcController.track);
router.post('/cancel', verifyOndcSignature, ondcController.cancel);

// Admin Configuration Endpoints
router.get('/config', protect, ondcController.getConfig);
router.post('/config', protect, ondcController.updateConfig);

module.exports = router;
