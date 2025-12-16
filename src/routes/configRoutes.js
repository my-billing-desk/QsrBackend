const express = require('express');
const router = express.Router();
const OutletController = require('../controllers/OutletController');

router.get('/outlet', OutletController.getOutletConfig);
router.post('/outlet', OutletController.updateOutletConfig);

module.exports = router;
