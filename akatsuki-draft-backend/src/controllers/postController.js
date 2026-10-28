const Post = require('../models/Post');

/**
 * @desc    Create a new post or draft
 * @route   POST /posts
 * @access  Private (Authenticated User)
 */
const createPost = async (req, res, next) => {
  try {
    const { title, description, content, image, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for the post.',
      });
    }

    // Status can be 'draft' or 'pending' when created by user.
    // If not specified, defaults to 'draft'.
    let postStatus = 'draft';
    if (status && ['draft', 'pending'].includes(status.toLowerCase())) {
      postStatus = status.toLowerCase();
    }

    // If an image was uploaded via multipart/form-data
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : (image || '');

    const post = await Post.create({
      title,
      description: description || '',
      content,
      image: imageUrl,
      category: category || 'General',
      createdBy: req.user._id,
      status: postStatus,
    });

    const populatedPost = await Post.findById(post._id).populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: postStatus === 'pending'
        ? 'Post submitted for admin review successfully.'
        : 'Draft saved successfully.',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View all approved posts (Public / Explore)
 * @route   GET /posts
 * @access  Public
 */
const getApprovedPosts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    const query = { status: 'approved' };

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Post.countDocuments(query),
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
 * @desc    View an approved post by ID
 * @route   GET /posts/:id
 * @access  Public (Owner or Admin can view non-approved as well)
 */
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('createdBy', 'name email role');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Check if post is approved, or if the requester is creator / admin
    const isOwner = req.user && req.user._id.toString() === post.createdBy._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (post.status !== 'approved' && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This post is not publicly accessible. It has not been approved yet.',
      });
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View your own posts and drafts
 * @route   GET /posts/my-posts
 * @access  Private (Authenticated User)
 */
const getMyPosts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { createdBy: req.user._id };

    if (status && ['draft', 'pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const posts = await Post.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update your own post
 * @route   PATCH /posts/:id
 * @access  Private (Post Owner / Admin)
 */
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Verify ownership
    const isOwner = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this post.',
      });
    }

    const { title, description, content, image, category, status } = req.body;

    if (title !== undefined) post.title = title;
    if (description !== undefined) post.description = description;
    if (content !== undefined) post.content = content;
    if (image !== undefined) post.image = image;
    if (req.file) post.image = `/uploads/${req.file.filename}`;
    if (category !== undefined) post.category = category;

    // Normal users can only set status to 'draft' or 'pending' (submit for review)
    // Admins can set any status
    if (status !== undefined) {
      if (isAdmin) {
        post.status = status;
      } else if (['draft', 'pending'].includes(status.toLowerCase())) {
        post.status = status.toLowerCase();
      }
    }

    const updatedPost = await post.save();
    const populated = await Post.findById(updatedPost._id).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully.',
      post: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete your own post
 * @route   DELETE /posts/:id
 * @access  Private (Post Owner / Admin)
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Verify ownership
    const isOwner = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post.',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getApprovedPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
};
