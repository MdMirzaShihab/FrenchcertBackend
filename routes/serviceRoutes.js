const express = require('express');
const { createService, getServices, updateService, deleteService } = require('../controllers/serviceController');

const router = express.Router();

router.post('/', createService);
router.get('/', getServices);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

module.exports = router;
