const express = require('express');
const router = express.Router();
const { signupUser, loginUser, getMe } = require('../controllers/authController');
const protect = require('../middleware/auth');

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', signupUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/me
// @desc    Get logged-in user profile
// @access  Private
router.get('/me', protect, getMe);

module.exports = router;
