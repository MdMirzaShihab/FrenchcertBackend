const express = require('express');
const router = express.Router();
const companyInquiryController = require('../controllers/companyInquiryController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateCompanyInquiry } = require('../validators/companyInquiry');

// Public routes
router.post('/', validateCompanyInquiry, companyInquiryController.createInquiry);

// Protected routes (authenticated users)
router.use(authenticate);

router.get('/', companyInquiryController.getAllInquiries);
router.get('/:id', companyInquiryController.getInquiry);
router.put('/:id/status', companyInquiryController.updateStatus);

// Admin-only routes
router.use(authorize(['admin']));
router.delete('/:id', companyInquiryController.deleteInquiry);

module.exports = router;