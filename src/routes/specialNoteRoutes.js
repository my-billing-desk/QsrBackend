const express = require('express');
const router = express.Router();
const specialNoteController = require('../controllers/specialNoteController');

router.get('/', specialNoteController.getAll);
router.post('/', specialNoteController.create);
router.put('/:id', specialNoteController.update);
router.delete('/:id', specialNoteController.delete);
router.patch('/:id/toggle', specialNoteController.toggleStatus);

module.exports = router;
