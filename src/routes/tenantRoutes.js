const express = require('express');
const router = express.Router();
const controller = require('../controllers/TenantController');
const { protect } = require('../middleware/authMiddleware');

router.get('/sub-tenants', protect, controller.getSubTenants);
router.post('/sub-tenants', protect, controller.createSubTenant);
router.put('/sub-tenants/:id', protect, controller.updateSubTenant);

module.exports = router;
