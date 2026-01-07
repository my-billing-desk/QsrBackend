const express = require('express');
const router = express.Router();
const giftCardController = require('../controllers/GiftCardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, giftCardController.getAllGiftCards);
router.post('/issue', protect, giftCardController.issueGiftCard);
router.get('/:cardNumber', protect, giftCardController.getGiftCard);
router.post('/redeem', protect, giftCardController.redeemGiftCard);
router.post('/reload', protect, giftCardController.reloadGiftCard);
router.post('/bulk-generate', protect, giftCardController.bulkGenerate);

module.exports = router;
