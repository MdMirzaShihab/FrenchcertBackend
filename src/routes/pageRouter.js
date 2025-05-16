const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { authenticate, csrfProtection, authorize } = require('../middlewares/auth');
const { validatePageRequest } = require('../validators/page');

// Public routes
router.get('/', pageController.getAllPages);
router.get('/:name', pageController.getPage);

// Protected routes - authentication required
router.use(authenticate, csrfProtection);

// Get user's pending page actions
router.get('/status/user', pageController.getUserPagePendingActions);

// Request page operations (require admin approval)
router.post('/pending/create', validatePageRequest, pageController.requestCreatePage);
router.put('/pending/update/:name', validatePageRequest, pageController.requestUpdatePage);
router.delete('/pending/delete/:name', pageController.requestDeletePage);

// Admin-only direct operations
router.use(authorize(['admin']));
router.post('/admin', validatePageRequest, pageController.createPage);
router.put('/admin/:name', validatePageRequest, pageController.updatePage);
router.delete('/admin/:name', pageController.deletePage);

module.exports = router;