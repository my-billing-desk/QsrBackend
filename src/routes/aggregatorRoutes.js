const express = require('express');
const router = express.Router();
const aggregatorController = require('../controllers/aggregatorController');

router.get('/', aggregatorController.getAll);
router.post('/:id/toggle', aggregatorController.toggleStatus);
router.post('/webhook', aggregatorController.webhook);

module.exports = router;
