const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for authenticated users
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - User's role ('admin' | 'user')
 * @returns {string} - JWT Token
 */
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'akatsuki_secret_key_super_secure_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    secret,
    {
      expiresIn: expiresIn,
    }
  );
};

module.exports = generateToken;
