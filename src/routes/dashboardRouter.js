const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Main dashboard summary
router.get('/summary', dashboardController.getDashboardSummary);

// Activity timeline data
router.get('/timeline', dashboardController.getActivityTimeline);

module.exports = router;