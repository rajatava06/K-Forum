import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// DASHBOARD STATS
// ============================================
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const pendingPostReports = await Post.countDocuments({ 'reports.0': { $exists: true } });
    const pendingCommentReports = await Comment.countDocuments({ 'reports.0': { $exists: true } });

    // Pending review posts & comments
    const pendingPostsCount = await Post.countDocuments({ status: 'PENDING_REVIEW' });
    const pendingCommentsCount = await Comment.countDocuments({
      $or: [
        { status: 'PENDING_REVIEW' },
        { moderationStatus: 'pending' }
      ]
    });

    const publishedPosts = await Post.countDocuments({ status: 'PUBLISHED' });
    const rejectedPosts = await Post.countDocuments({ status: 'REJECTED' });

    const categoryStats = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalPosts,
      totalComments,
      pendingReports: pendingPostReports + pendingCommentReports,
      pendingReview: pendingPostsCount + pendingCommentsCount,
      pendingPostsCount,
      pendingCommentsCount,
      publishedPosts,
      rejectedPosts,
      categoryStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET PENDING REVIEW POSTS (for admin moderation)
// ============================================
router.get('/posts/pending', auth, isAdmin, async (req, res) => {
  try {
    const posts = await Post.find({ status: 'PENDING_REVIEW' })
      .populate('author', 'name studentId email year branch')
      .sort({ createdAt: -1 })
      .lean();

    // Add formatted data for admin UI
    const formattedPosts = posts.map(post => ({
      ...post,
      moderationInfo: {
        confidence: post.moderation?.confidence || 0,
        confidencePercent: Math.round((post.moderation?.confidence || 0) * 100),
        categories: post.moderation?.categories || [],
        flaggedWords: post.moderation?.flaggedWords || [],
        language: post.moderation?.language || 'unknown',
        isUnsafe: post.moderation?.isUnsafe || false
      }
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Get pending posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// APPROVE POST (Admin action)
// ============================================
router.post('/posts/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.status = 'PUBLISHED';
    post.moderationStatus = 'approved';
    post.adminDecision = {
      decision: 'APPROVED',
      adminId: req.userId,
      reviewedAt: new Date(),
      reason: req.body.reason || 'Approved by admin'
    };

    await post.save();

    res.json({
      message: 'Post approved and published successfully',
      post
    });
  } catch (error) {
    console.error('Approve post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// REJECT POST (Admin action)
// ============================================
router.post('/posts/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.status = 'REJECTED';
    post.moderationStatus = 'removed';
    post.adminDecision = {
      decision: 'REJECTED',
      adminId: req.userId,
      reviewedAt: new Date(),
      reason: req.body.reason || 'Rejected by admin'
    };

    await post.save();

    res.json({
      message: 'Post rejected successfully',
      post
    });
  } catch (error) {
    console.error('Reject post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET PENDING REVIEW COMMENTS (for admin moderation)
// ============================================
router.get('/comments/pending', auth, isAdmin, async (req, res) => {
  try {
    const comments = await Comment.find({
      $or: [
        { status: 'PENDING_REVIEW' },
        { moderationStatus: 'pending' }
      ]
    })
      .populate('author', 'name studentId email year branch')
      .populate('post', 'title category _id')
      .sort({ createdAt: -1 })
      .lean();

    const formattedComments = comments.map(comment => ({
      ...comment,
      moderationInfo: {
        confidence: comment.moderation?.confidence || 0,
        confidencePercent: Math.round((comment.moderation?.confidence || 0) * 100),
        categories: comment.moderation?.categories || [],
        flaggedWords: comment.moderation?.flaggedWords || [],
        language: comment.moderation?.language || 'unknown',
        isUnsafe: comment.moderation?.isUnsafe || false
      }
    }));

    res.json(formattedComments);
  } catch (error) {
    console.error('Get pending comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// APPROVE COMMENT (Admin action)
// ============================================
router.post('/comments/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const wasNotPublished = comment.status !== 'PUBLISHED' && comment.moderationStatus !== 'approved';

    comment.status = 'PUBLISHED';
    comment.moderationStatus = 'approved';
    comment.adminDecision = {
      decision: 'APPROVED',
      adminId: req.userId,
      reviewedAt: new Date(),
      reason: req.body.reason || 'Approved by admin'
    };

    await comment.save();

    if (wasNotPublished && comment.post) {
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentCount: 1 }
      });
    }

    res.json({
      message: 'Comment approved and published successfully',
      comment
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// REJECT COMMENT (Admin action)
// ============================================
router.post('/comments/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.status = 'REJECTED';
    comment.moderationStatus = 'removed';
    comment.adminDecision = {
      decision: 'REJECTED',
      adminId: req.userId,
      reviewedAt: new Date(),
      reason: req.body.reason || 'Rejected by admin'
    };

    await comment.save();

    res.json({
      message: 'Comment rejected successfully',
      comment
    });
  } catch (error) {
    console.error('Reject comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET REPORTED POSTS (user reports)
// ============================================
router.get('/reported-posts', auth, isAdmin, async (req, res) => {
  try {
    const posts = await Post.find({ 'reports.0': { $exists: true } })
      .populate('author', 'name studentId')
      .populate('reports.user', 'name studentId')
      .sort({ 'reports.reportedAt': -1 });

    res.json(posts);
  } catch (error) {
    console.error('Get reported posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET REPORTED COMMENTS (user reports)
// ============================================
router.get('/reported-comments', auth, isAdmin, async (req, res) => {
  try {
    const comments = await Comment.find({ 'reports.0': { $exists: true } })
      .populate('author', 'name studentId')
      .populate('reports.user', 'name studentId')
      .populate('post', 'title _id')
      .sort({ 'reports.reportedAt': -1 });

    res.json(comments);
  } catch (error) {
    console.error('Get reported comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET AI FLAGGED POSTS
// ============================================
router.get('/flagged-posts', auth, isAdmin, async (req, res) => {
  try {
    const posts = await Post.find({
      $and: [
        {
          $or: [
            { 'moderation.isUnsafe': true },
            { moderationStatus: 'flagged' }
          ]
        },
        { status: { $ne: 'REJECTED' } }
      ]
    })
      .populate('author', 'name studentId')
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = posts.map(post => ({
      ...post,
      moderationInfo: {
        confidence: post.moderation?.confidence || 0,
        confidencePercent: Math.round((post.moderation?.confidence || 0) * 100),
        categories: post.moderation?.categories || [],
        flaggedWords: post.moderation?.flaggedWords || [],
        isUnsafe: post.moderation?.isUnsafe || false
      }
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Get flagged posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// MODERATE POST (legacy endpoint, kept for compatibility)
// ============================================
router.post('/moderate-post/:id', auth, isAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'approve', 'flag', 'remove'

    const updateData = {
      moderationStatus: action === 'approve' ? 'approved' : action
    };

    if (action === 'approve') {
      updateData.status = 'PUBLISHED';
      updateData.adminDecision = {
        decision: 'APPROVED',
        adminId: req.userId,
        reviewedAt: new Date()
      };
    } else if (action === 'remove') {
      updateData.status = 'REJECTED';
      updateData.adminDecision = {
        decision: 'REJECTED',
        adminId: req.userId,
        reviewedAt: new Date()
      };
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ message: `Post ${action}d successfully`, post });
  } catch (error) {
    console.error('Moderate post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET ALL USERS (for admin management)
// ============================================
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;