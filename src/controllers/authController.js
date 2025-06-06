const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/email'); // You'll need to implement this

// Generate access token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // 1 hour expiration
  );
};

// Generate refresh token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // 7 days expiration
  );
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userData = {
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'user',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const user = new User(userData);
    await user.save();
    
    return res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        isActive: user.isActive 
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Set CSRF token at the beginning
    const csrfToken = req.csrfToken();
    res.cookie('XSRF-TOKEN', csrfToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 3600000 // 1 hour
    });

    console.log('Login attempt for email:', req.body.email); // Log email
    
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        csrfToken: req.csrfToken()
      });
    }
    
    console.log('Found user:', user.email); // Log found user
    
    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.',
        csrfToken,
        lockUntil: user.lockUntil
      });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch); // Log match result
    
    if (!isMatch) {
      console.log('Password mismatch for user:', user.email);
      await user.incrementLoginAttempts();
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        csrfToken: req.csrfToken()
      });
    }
    
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account disabled',
        csrfToken
      });
    }
    
    // Reset failed login attempts on successful login
    await user.resetLoginAttempts();
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 3600000, // 1 hour
      path: '/'
    };
    
    res.cookie('accessToken', accessToken, cookieOptions);
    
    // Refresh token with longer expiry
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 3600000 // 7 days
    });
    
    res.json({ 
      success: true,
      user: { id: user._id, email: user.email, role: user.role },
      csrfToken
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    console.log('Refresh Token - Incoming Headers:', req.headers);
    console.log('Refresh Token - Cookies:', req.cookies);

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const newCsrfToken = req.csrfToken(); // Generate new CSRF token

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 3600000
    });

    res.cookie('XSRF-TOKEN', newCsrfToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      httpOnly: false, // Must be readable by client
      maxAge: 3600000
    });

    res.json({ 
      success: true,
      csrfToken: newCsrfToken
    });

  } catch (err) {
    console.error('Refresh Token Error:', err);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('XSRF-TOKEN');
    
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  });
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  });
  
  res.clearCookie('XSRF-TOKEN', {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  });
  
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getCSRFToken = (req, res) => {
  const csrfToken = req.csrfToken();
  const isProd = process.env.NODE_ENV === 'production';
  console.log('ENV:', process.env.NODE_ENV);
  res.cookie('XSRF-TOKEN', csrfToken, {
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: 3600000 // 1 hour
  });
  res.json({ success: true, csrfToken });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal whether a user exists or not
      return res.status(200).json({ 
        message: 'If a user with that email exists, a password reset link has been sent.' 
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expiry (1 hour)
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    // Create message
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on the following link to reset your password: \n\n ${resetUrl} \n\n If you did not request this, please ignore this email and your password will remain unchanged.`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message
      });
      
      res.status(200).json({ 
        message: 'If a user with that email exists, a password reset link has been sent.' 
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Validate new password
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long' 
      });
    }
    
    // Set new password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Check if passwords are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide current and new password' 
      });
    }
    
    // Check if new password meets requirements
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'New password must be at least 8 characters long' 
      });
    }
    
    // Get user from database
    const user = await User.findById(req.user.id);
    
    // Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};