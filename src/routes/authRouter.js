const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
  validateRegister, 
  validateLogin, 
  validateForgotPassword,
  validateResetPassword,
  validateUpdatePassword
} = require('../validators/auth');
const { authenticate, loginLimiter, csrfProtection } = require('../middlewares/auth');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/csrf-token', authController.getCSRFToken);
// router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
// router.patch('/reset-password/:resetToken', validateResetPassword, authController.resetPassword);

// Protected routes
router.use(authenticate, csrfProtection);
router.get('/me', authController.getCurrentUser);
// router.patch('/update-password', validateUpdatePassword, authController.updatePassword);

module.exports = router;