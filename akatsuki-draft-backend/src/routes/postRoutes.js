const express = require('express');
const router = express.Router();
const {
  createPost,
  getApprovedPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Optional auth helper to identify user on public routes if token is provided
const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    return protect(req, res, next);
  }
  next();
};

// GET /posts - View all approved posts (Explore)
// POST /posts - Create a new post or draft (Authenticated)
router
  .route('/')
  .get(getApprovedPosts)
  .post(protect, upload.single('image'), createPost);

// GET /posts/my-posts - View your own posts and drafts (Must come before /:id)
router.get('/my-posts', protect, getMyPosts);

// GET /posts/:id - View an approved post by ID
// PATCH /posts/:id - Update your own post
// DELETE /posts/:id - Delete your own post
router
  .route('/:id')
  .get(optionalProtect, getPostById)
  .patch(protect, upload.single('image'), updatePost)
  .delete(protect, deletePost);

module.exports = router;
