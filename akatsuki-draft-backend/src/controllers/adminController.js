const Post = require('../models/Post');

/**
 * @desc    View all posts awaiting admin approval
 * @route   GET /admin/posts/pending
 * @access  Private (Admin only)
 */
const getPendingPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
      Post.find({ status: 'pending' })
        .populate('createdBy', 'name email role')
        .sort({ createdAt: 1 }) // oldest pending first
        .skip(skip)
        .limit(Number(limit)),
      Post.countDocuments({ status: 'pending' }),
    ]);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a pending post
 * @route   PATCH /admin/posts/approve/:id
 * @access  Private (Admin only)
 */
const approvePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    post.status = 'approved';
    if (req.body.feedback) {
      post.adminFeedback = req.body.feedback;
    }

    const updatedPost = await post.save();
    const populated = await Post.findById(updatedPost._id).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post approved successfully. It is now publicly visible in Explore Posts.',
      post: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a pending post
 * @route   PATCH /admin/posts/reject/:id
 * @access  Private (Admin only)
 */
const rejectPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    post.status = 'rejected';
    if (req.body.feedback) {
      post.adminFeedback = req.body.feedback;
    }

    const updatedPost = await post.save();
    const populated = await Post.findById(updatedPost._id).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post rejected.',
      post: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingPosts,
  approvePost,
  rejectPost,
};
