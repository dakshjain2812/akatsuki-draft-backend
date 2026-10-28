const express = require('express');
const router = express.Router();
const { improvePostContent } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// POST /ai/improve/:postId - Improve content using AI and save as new draft
router.post('/improve/:postId', protect, upload.single('document'), improvePostContent);

module.exports = router;
