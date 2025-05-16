const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
  validateLogin, 
  validateForgotPassword,
  validateResetPassword,
  validateUpdatePassword
} = require('../validators/auth');
const { authenticate, loginLimiter, csrfProtection } = require('../middlewares/auth');

// Public routes
router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/refresh-token', csrfProtection, authController.refreshToken);
router.post('/logout', csrfProtection, authController.logout);
router.get('/csrf-token', authController.getCSRFToken);
// router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
// router.patch('/reset-password/:resetToken', validateResetPassword, authController.resetPassword);

// Protected routes
router.get('/me', authenticate, csrfProtection, authController.getCurrentUser);
// router.patch('/update-password', validateUpdatePassword, authController.updatePassword);

module.exports = router;