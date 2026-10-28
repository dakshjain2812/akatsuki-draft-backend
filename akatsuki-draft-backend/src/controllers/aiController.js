const Post = require('../models/Post');
const { improvePostWithGemini } = require('../utils/geminiHelper');

/**
 * @desc    Improve post content using AI and save as a new draft with a new ID
 *          under the same user, preserving the original draft.
 * @route   POST /ai/improve/:postId
 * @access  Private (Post Owner / Admin)
 */
const improvePostContent = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { instruction } = req.body;

    const originalPost = await Post.findById(postId);

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found.',
      });
    }

    // Verify ownership
    const isOwner = originalPost.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to improve this post.',
      });
    }

    // Prepare options for Gemini
    const options = {
      instruction: instruction || 'Enhance clarity, fix grammar, and improve overall readability and structure.',
    };

    if (req.file) {
      options.filePath = req.file.path;
      options.mimeType = req.file.mimetype;
    }

    // Call Gemini AI enhancement engine
    const aiResult = await improvePostWithGemini(
      {
        title: originalPost.title,
        description: originalPost.description,
        content: originalPost.content,
        category: originalPost.category,
      },
      options
    );

    // Save as a brand new draft with a new ID under the SAME user, preserving original draft
    const newDraft = await Post.create({
      title: aiResult.improvedTitle || `${originalPost.title} (AI Enhanced)`,
      description: aiResult.improvedDescription || originalPost.description,
      content: aiResult.improvedContent,
      image: originalPost.image,
      category: originalPost.category,
      createdBy: originalPost.createdBy,
      status: 'draft',
      originalPostId: originalPost._id,
      aiImproved: true,
    });

    const populatedDraft = await Post.findById(newDraft._id).populate(
      'createdBy',
      'name email role'
    );

    res.status(201).json({
      success: true,
      message: 'Post successfully improved with AI and saved as a new draft.',
      aiEngine: aiResult.source || 'gemini',
      improvementsSummary: aiResult.improvementsSummary,
      newDraft: populatedDraft,
      originalDraftPreserved: {
        id: originalPost._id,
        title: originalPost.title,
        status: originalPost.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  improvePostContent,
};
