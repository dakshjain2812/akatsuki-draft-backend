const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /auth/register - Register a new user
router.post('/register', registerUser);

// POST /auth/login - Log in and receive a JWT token
router.post('/login', loginUser);

// GET /auth/me - Get the currently logged-in user's details after login
router.get('/me', protect, getMe);

module.exports = router;
