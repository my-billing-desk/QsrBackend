const express = require('express');
const router = express.Router();
const controller = require('../controllers/RoleController');
const { protect, authorize } = require('../middleware/authMiddleware');

const admins = ['super_admin', 'admin'];

router.get('/', protect, authorize(...admins), controller.getRoles);
router.post('/', protect, authorize(...admins), controller.createRole);
router.put('/:id', protect, authorize(...admins), controller.updateRole);
router.delete('/:id', protect, authorize(...admins), controller.deleteRole);

module.exports = router;
