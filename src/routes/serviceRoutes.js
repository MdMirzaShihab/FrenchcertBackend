const express = require('express');
const { createService, getServices, updateService, deleteService } = require('../controllers/serviceController');
const { adminOnly, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, adminOnly, createService);
router.get('/', getServices);
router.put('/:id', protect, adminOnly, updateService);
router.delete('/:id', protect, adminOnly, deleteService);


module.exports = router;
