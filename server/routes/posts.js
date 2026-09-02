import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { uploadImage } from '../config/cloudinary.js';
import multer from 'multer';
import { moderateText } from '../services/aiModeration.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  },
});

const router = express.Router();

// Get trending hashtags
router.get('/trending/hashtags', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Filter strictly for published posts only
    const publishedFilter = {
      $and: [
        { status: { $nin: ['PENDING_REVIEW', 'REJECTED'] } },
        { moderationStatus: { $ne: 'removed' } },
        {
          $or: [
            { status: 'PUBLISHED' },
            { status: { $exists: false }, moderationStatus: 'approved' }
          ]
        }
      ]
    };

    // Try recent hashtags first
    let trendingTags = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          ...publishedFilter
        }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          tag: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // If recent hashtags are fewer than 3, fall back to all-time hashtags
    if (trendingTags.length < 3) {
      trendingTags = await Post.aggregate([
        {
          $match: {
            ...publishedFilter
          }
        },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) },
        {
          $project: {
            tag: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);
    }

    res.json(trendingTags);
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming events
router.get('/events', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await Post.find({
      category: 'events',
      eventDate: { $gte: today },
      $and: [
        { status: { $nin: ['PENDING_REVIEW', 'REJECTED'] } },
        { moderationStatus: { $ne: 'removed' } },
        {
          $or: [
            { status: 'PUBLISHED' },
            { status: { $exists: false }, moderationStatus: 'approved' }
          ]
        }
      ]
    })
      .select('title eventDate')
      .sort({ eventDate: 1 })
      .limit(20);

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts (only PUBLISHED)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      excludeCategory,
      search,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Strict filter: only PUBLISHED and approved posts (never PENDING_REVIEW or REJECTED)
    let query = {
      $and: [
        { status: { $nin: ['PENDING_REVIEW', 'REJECTED'] } },
        { moderationStatus: { $ne: 'removed' } },
        {
          $or: [
            { status: 'PUBLISHED' },
            { status: { $exists: false }, moderationStatus: 'approved' }
          ]
        }
      ]
    };

    if (category && category !== 'all') {
      query.category = category;
    } else if (excludeCategory) {
      query.category = { $ne: excludeCategory };
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    } else if (search) {
      query.$text = { $search: search };
    }

    if (sortBy === 'random') {
      const posts = await Post.aggregate([
        { $match: query },
        { $sample: { size: parseInt(limit) } },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author'
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
      ]);

      const processedPosts = posts.map(post => {
        // Calculate reaction counts
        const reactionCounts = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
        (post.reactions || []).forEach(r => {
          reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
        });

        // Find user's reaction if authenticated
        let userReaction = null;
        if (req.userId) {
          const userReact = (post.reactions || []).find(
            r => r.user && r.user.toString() === req.userId.toString()
          );
          userReaction = userReact?.type || null;
        }

        // Check if user has voted on the poll (for random sort path)
        let userPollVote = null;
        let hasVoted = false;
        if (post.postType === 'polling' || post.postType === 'qna') {
          const votedIndices = [];
          (post.pollOptions || []).forEach((opt, idx) => {
            const hasVotedThisOpt = req.userId && (opt.votes || []).some(v => v && v.toString() === req.userId.toString());
            if (hasVotedThisOpt) {
              votedIndices.push(idx);
              hasVoted = true;
            }
          });
          if (votedIndices.length > 0) {
            userPollVote = post.postType === 'polling' ? votedIndices[0] : votedIndices;
          }
        }

        const isAuthor = req.userId && post.author && (post.author._id ? post.author._id.toString() : post.author.toString()) === req.userId.toString();
        const showCorrectAnswers = hasVoted || isAuthor;

        return {
          ...post,
          author: post.isAnonymous ? null : {
            _id: post.author?._id,
            name: post.author?.name,
            studentId: post.author?.studentId,
            year: post.author?.year,
            branch: post.author?.branch,
            avatar: post.author?.avatar
          },
          upvoteCount: post.upvotes?.length || 0,
          downvoteCount: post.downvotes?.length || 0,
          reactionCounts,
          totalReactions: (post.reactions || []).length,
          userReaction,
          // Q&A / Polling additions
          pollOptions: (post.pollOptions || []).map(opt => ({
            _id: opt._id,
            text: opt.text,
            voteCount: (opt.votes || []).length
          })),
          correctAnswers: (post.postType === 'qna' && !showCorrectAnswers) ? [] : (post.correctAnswers || []),
          userPollVote
        };
      });

      const totalCount = await Post.countDocuments(query);

      return res.json({
        posts: processedPosts,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        total: totalCount
      });
    }

    const posts = await Post.find(query)
      .populate('author', 'name studentId year branch avatar')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Post.countDocuments(query);

    const processedPosts = posts.map(post => {
      // Calculate reaction counts
      const reactionCounts = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
      (post.reactions || []).forEach(r => {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      });

      // Find user's reaction if authenticated
      let userReaction = null;
      if (req.userId) {
        const userReact = (post.reactions || []).find(
          r => r.user && r.user.toString() === req.userId.toString()
        );
        userReaction = userReact?.type || null;
      }

      // Check if user has voted on the poll
      let userPollVote = null;
      let hasVoted = false;
      if (post.postType === 'polling' || post.postType === 'qna') {
        const votedIndices = [];
        (post.pollOptions || []).forEach((opt, idx) => {
          const hasVotedThisOpt = req.userId && (opt.votes || []).some(v => v && v.toString() === req.userId.toString());
          if (hasVotedThisOpt) {
            votedIndices.push(idx);
            hasVoted = true;
          }
        });
        if (votedIndices.length > 0) {
          userPollVote = post.postType === 'polling' ? votedIndices[0] : votedIndices;
        }
      }

      const isAuthor = req.userId && post.author && (post.author._id ? post.author._id.toString() : post.author.toString()) === req.userId.toString();
      const showCorrectAnswers = hasVoted || isAuthor;

      return {
        ...post,
        author: post.isAnonymous ? null : post.author,
        upvoteCount: post.upvotes?.length || 0,
        downvoteCount: post.downvotes?.length || 0,
        reactionCounts,
        totalReactions: (post.reactions || []).length,
        userReaction,

        // Q&A / Polling additions
        pollOptions: (post.pollOptions || []).map(opt => ({
          _id: opt._id,
          text: opt.text,
          voteCount: opt.votes?.length || 0
        })),
        correctAnswers: (post.postType === 'qna' && !showCorrectAnswers) ? [] : (post.correctAnswers || []),
        userPollVote
      };
    });

    res.json({
      posts: processedPosts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name studentId year branch avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check visibility permissions:
    // If post is not published/approved, only the author or an admin can view it
    const isPublished = post.status === 'PUBLISHED' || (!post.status && post.moderationStatus === 'approved');
    const isAuthor = req.userId && post.author && (post.author._id ? post.author._id.toString() : post.author.toString()) === req.userId.toString();
    const isAdminUser = req.userRole === 'admin' || req.userRole === 'moderator';

    if (!isPublished && !isAuthor && !isAdminUser) {
      return res.status(404).json({ message: 'This post is currently under review or does not exist' });
    }

    // Increment view count without triggering full validation on old documents
    await Post.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    // Calculate reaction counts
    const reactionCounts = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
    (post.reactions || []).forEach(r => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    // Find user's reaction if authenticated
    let userReaction = null;
    if (req.userId) {
      const userReact = (post.reactions || []).find(
        r => r.user && r.user.toString() === req.userId.toString()
      );
      userReaction = userReact?.type || null;
    }

    // Check if user has voted on the poll
    let userPollVote = null;
    let hasVoted = false;
    if (post.postType === 'polling' || post.postType === 'qna') {
      const votedIndices = [];
      (post.pollOptions || []).forEach((opt, idx) => {
        const hasVotedThisOpt = req.userId && (opt.votes || []).some(v => v && v.toString() === req.userId.toString());
        if (hasVotedThisOpt) {
          votedIndices.push(idx);
          hasVoted = true;
        }
      });
      if (votedIndices.length > 0) {
        userPollVote = post.postType === 'polling' ? votedIndices[0] : votedIndices;
      }
    }

    const showCorrectAnswers = hasVoted || isAuthor;

    const processedPost = {
      ...post.toObject(),
      author: post.isAnonymous ? null : post.author,
      upvoteCount: post.upvotes?.length || 0,
      downvoteCount: post.downvotes?.length || 0,
      reactionCounts,
      totalReactions: (post.reactions || []).length,
      userReaction,

      // Q&A / Polling additions
      pollOptions: (post.pollOptions || []).map(opt => ({
        _id: opt._id,
        text: opt.text,
        voteCount: opt.votes?.length || 0
      })),
      correctAnswers: (post.postType === 'qna' && !showCorrectAnswers) ? [] : (post.correctAnswers || []),
      userPollVote
    };

    res.json(processedPost);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// CREATE POST - With AI Moderation & Admin Review
// ============================================
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { title, content, category, tags, isAnonymous, eventDate, pollOptions, correctAnswers } = req.body;

    console.log('📝 Create Post Request Received');
    console.log('   Content-Type:', req.headers['content-type']);
    console.log('   Files received:', req.files ? req.files.length : 'None');

    // --- AI MODERATION ---
    const textToAnalyze = `${title}\n${content || ''}`;
    console.log('Analyzing content for moderation...');

    const moderationResult = await moderateText(textToAnalyze);
    console.log('Moderation Result:', moderationResult);

    const isAdminUser = req.userRole === 'admin' || req.userRole === 'moderator';

    // Admins publish immediately to feed; all non-admins require Admin Approval first
    const status = isAdminUser ? 'PUBLISHED' : 'PENDING_REVIEW';
    const moderationStatus = isAdminUser
      ? 'approved'
      : (moderationResult.isUnsafe ? 'flagged' : 'pending');

    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const extractedHashtags = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      extractedHashtags.push(match[1].toLowerCase());
    }

    // Handle image uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      console.log(`📷 Processing ${req.files.length} image(s) for upload...`);
      for (const file of req.files) {
        try {
          console.log(`   Uploading: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`);
          const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const imageUrl = await uploadImage(base64Image);
          console.log(`   ✅ Uploaded: ${imageUrl.substring(0, 60)}...`);
          attachments.push({
            url: imageUrl,
            type: 'image',
            filename: file.originalname
          });
        } catch (error) {
          console.error('❌ Image upload failed:', error.message);
          return res.status(500).json({
            message: 'Image upload failed. Is Cloudinary configured?',
            error: error.message
          });
        }
      }
      console.log(`📷 Total attachments uploaded: ${attachments.length}/${req.files.length}`);
    }

    const cleanAttachments = attachments.map(attachment => ({
      url: attachment.url.trim(),
      type: attachment.type,
      filename: attachment.filename
    }));

    const manualTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [];
    const allTags = [...new Set([...manualTags, ...extractedHashtags])];

    let parsedPollOptions = [];
    if (category === 'qna' || category === 'polling') {
      try {
        if (pollOptions) {
          const rawOptions = typeof pollOptions === 'string'
            ? JSON.parse(pollOptions)
            : pollOptions;
          parsedPollOptions = rawOptions.map(opt => ({ text: opt.text, votes: [] }));
        }
      } catch (err) {
        console.error('Error parsing poll options:', err);
      }
    }

    let parsedCorrectAnswers = [];
    if (category === 'qna') {
      try {
        if (correctAnswers) {
          parsedCorrectAnswers = typeof correctAnswers === 'string'
            ? JSON.parse(correctAnswers)
            : correctAnswers;
          parsedCorrectAnswers = parsedCorrectAnswers.map(Number);
        }
      } catch (err) {
        console.error('Error parsing correct answers:', err);
      }
    }

    const post = new Post({
      title: title.trim(),
      content: (content || '').trim() || (category === 'qna' ? 'Q&A' : category === 'polling' ? 'Poll' : ''),
      author: req.userId,
      category,
      tags: allTags,
      isAnonymous: isAnonymous === 'true',
      attachments: cleanAttachments,

      // Moderation fields
      status,
      eventDate: category === 'events' ? eventDate : undefined,
      moderation: {
        isUnsafe: moderationResult.isUnsafe || false,
        confidence: moderationResult.confidence || 0,
        categories: moderationResult.categories || [],
        flaggedWords: moderationResult.flaggedWords || [],
        language: moderationResult.language || 'unknown'
      },
      adminDecision: isAdminUser ? {
        decision: 'APPROVED',
        adminId: req.userId,
        reviewedAt: new Date(),
        reason: 'Auto-approved for admin'
      } : undefined,

      moderationStatus,

      // Q&A / Polling fields
      postType: ['qna', 'polling'].includes(category) ? category : 'normal',
      pollOptions: parsedPollOptions,
      correctAnswers: parsedCorrectAnswers,
      pollSettings: {
        allowMultiple: category === 'qna'
      }
    });

    await post.save();
    console.log('💾 Saved post attachments:', post.attachments);
    await post.populate('author', 'name studentId year branch avatar');

    const processedPost = {
      ...post.toObject(),
      author: post.isAnonymous ? null : post.author,
      upvoteCount: 0,
      downvoteCount: 0
    };

    // Return appropriate message
    res.status(201).json({
      message: status === 'PUBLISHED'
        ? 'Post published successfully!'
        : 'Your post has been submitted for review. It will be visible in the feed once approved by an admin.',
      post: processedPost,
      moderationStatus: status
    });

  } catch (error) {
    console.error('Create post error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        message: 'File upload error',
        error: error.message
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on post
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { voteType } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.upvotes = post.upvotes.filter(vote => !vote.user.equals(req.userId));
    post.downvotes = post.downvotes.filter(vote => !vote.user.equals(req.userId));

    if (voteType === 'up') {
      post.upvotes.push({ user: req.userId });
    } else if (voteType === 'down') {
      post.downvotes.push({ user: req.userId });
    }

    await post.save();

    res.json({
      upvoteCount: post.upvotes.length,
      downvoteCount: post.downvotes.length
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// REACT TO POST (Facebook-style reactions)
// ============================================
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { type } = req.body;
    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

    if (!type || !validReactions.includes(type)) {
      return res.status(400).json({
        message: 'Invalid reaction type. Must be one of: ' + validReactions.join(', ')
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Convert req.userId to string for comparison
    const currentUserId = req.userId.toString();

    // Find existing reaction from this user
    const existingReactionIndex = post.reactions.findIndex(
      r => r.user.toString() === currentUserId
    );

    let userReaction = null;

    console.log('React request - User:', currentUserId, 'Type:', type, 'Existing index:', existingReactionIndex);

    if (existingReactionIndex > -1) {
      const existingReaction = post.reactions[existingReactionIndex];
      console.log('Existing reaction type:', existingReaction.type);

      if (existingReaction.type === type) {
        // Same reaction - toggle off (remove)
        console.log('Removing reaction (toggle off)');
        post.reactions.splice(existingReactionIndex, 1);
        userReaction = null;
      } else {
        // Different reaction - update to new type
        console.log('Changing reaction to:', type);
        post.reactions[existingReactionIndex].type = type;
        post.reactions[existingReactionIndex].createdAt = new Date();
        userReaction = type;
      }
    } else {
      // No existing reaction - add new one
      console.log('Adding new reaction:', type);
      post.reactions.push({ user: req.userId, type });
      userReaction = type;
    }

    await post.save();

    // Calculate reaction counts
    const reactionCounts = {};
    validReactions.forEach(r => reactionCounts[r] = 0);
    post.reactions.forEach(r => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    console.log('Response - userReaction:', userReaction, 'total:', post.reactions.length);

    res.json({
      reactionCounts,
      totalReactions: post.reactions.length,
      userReaction
    });
  } catch (error) {
    console.error('React error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.id,
      $and: [
        { status: { $nin: ['PENDING_REVIEW', 'REJECTED'] } },
        { moderationStatus: { $ne: 'removed' } },
        {
          $or: [
            { status: 'PUBLISHED' },
            { status: { $exists: false }, moderationStatus: 'approved' }
          ]
        }
      ]
    })
      .populate('author', 'name studentId year branch avatar')
      .sort({ createdAt: -1 });

    const processedComments = comments.map(comment => ({
      ...comment.toObject(),
      author: comment.isAnonymous ? null : comment.author,
      upvoteCount: comment.upvotes?.length || 0,
      downvoteCount: comment.downvotes?.length || 0
    }));

    res.json(processedComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment - with AI Moderation & Admin Review
router.post('/:id/comments', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { content, isAnonymous, parentComment } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    // --- AI MODERATION FOR COMMENTS ---
    const moderationResult = await moderateText(content.trim());
    console.log('Comment Moderation Result:', moderationResult);

    const isAdminUser = req.userRole === 'admin' || req.userRole === 'moderator';

    // Admins publish immediately; non-admins go to PENDING_REVIEW
    const status = isAdminUser ? 'PUBLISHED' : 'PENDING_REVIEW';
    const moderationStatus = isAdminUser
      ? 'approved'
      : (moderationResult.isUnsafe ? 'flagged' : 'pending');

    // Handle image uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const imageUrl = await uploadImage(base64Image);
          attachments.push({
            url: imageUrl,
            type: 'image',
            filename: file.originalname
          });
        } catch (error) {
          console.warn('Comment image upload failed (skipping):', error.message);
        }
      }
    }

    const comment = new Comment({
      content: content.trim(),
      author: req.userId,
      post: req.params.id,
      isAnonymous: isAnonymous === 'true',
      parentComment: parentComment || null,
      attachments,
      status,
      moderation: {
        isUnsafe: moderationResult.isUnsafe || false,
        confidence: moderationResult.confidence || 0,
        categories: moderationResult.categories || [],
        flaggedWords: moderationResult.flaggedWords || [],
        language: moderationResult.language || 'unknown'
      },
      adminDecision: isAdminUser ? {
        decision: 'APPROVED',
        adminId: req.userId,
        reviewedAt: new Date(),
        reason: 'Auto-approved for admin'
      } : undefined,
      moderationStatus
    });

    await comment.save();
    await comment.populate('author', 'name studentId year branch avatar');

    // Only increment comment count if published immediately
    if (status === 'PUBLISHED') {
      await Post.findByIdAndUpdate(req.params.id, {
        $inc: { commentCount: 1 }
      });
    }

    const processedComment = {
      ...comment.toObject(),
      author: comment.isAnonymous ? null : comment.author,
      upvoteCount: 0,
      downvoteCount: 0
    };

    res.status(201).json({
      message: status === 'PUBLISHED'
        ? 'Comment added successfully!'
        : 'Your comment has been submitted for review. It will be visible once approved by an admin.',
      status,
      comment: processedComment,
      moderationStatus
    });
  } catch (error) {
    console.error('Add comment error:', error);
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        message: 'File upload error',
        error: error.message
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!comment.author.equals(req.userId) && req.userRole !== 'admin' && req.userRole !== 'moderator') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    if (comment.status === 'PUBLISHED' || comment.moderationStatus === 'approved') {
      await Post.findByIdAndUpdate(req.params.id, {
        $inc: { commentCount: -1 }
      });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report comment
router.post('/:id/comments/:commentId/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existingReport = comment.reports.find(report => report.user.equals(req.userId));
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this comment' });
    }

    comment.reports.push({
      user: req.userId,
      reason
    });

    if (comment.reports.length >= 3 && comment.status === 'PUBLISHED') {
      comment.status = 'PENDING_REVIEW';
      comment.moderationStatus = 'flagged';
    }

    await comment.save();
    res.json({ message: 'Comment reported successfully' });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.author.equals(req.userId) && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Comment.deleteMany({ post: req.params.id });
    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report post
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingReport = post.reports.find(report => report.user.equals(req.userId));
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    post.reports.push({
      user: req.userId,
      reason
    });

    if (post.reports.length >= 5 && post.status === 'PUBLISHED') {
      post.status = 'PENDING_REVIEW';
      post.moderationStatus = 'flagged';
    }

    await post.save();

    res.json({ message: 'Post reported successfully' });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register poll or Q&A votes
router.post('/:id/poll-vote', auth, async (req, res) => {
  try {
    const { optionIndices } = req.body; // Array of option indices (numbers)
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Support both postType field (new) and category field (backward compat for old posts)
    const isValidPollPost = ['polling', 'qna'].includes(post.postType) ||
      ['polling', 'qna'].includes(post.category);
    if (!isValidPollPost) {
      return res.status(400).json({ message: 'This post is not a poll or Q&A' });
    }

    if (!Array.isArray(optionIndices) || optionIndices.length === 0) {
      return res.status(400).json({ message: 'Please select at least one option' });
    }

    // Check if the user has already voted on this post
    const alreadyVoted = post.pollOptions.some(opt =>
      (opt.votes || []).some(v => v.toString() === req.userId.toString())
    );

    if (alreadyVoted) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    // For single-choice polling, only allow 1 option (check both postType and category)
    const isPollingType = post.postType === 'polling' ||
      (post.postType === 'normal' && post.category === 'polling');
    if (isPollingType && optionIndices.length > 1) {
      return res.status(400).json({ message: 'Only one choice is allowed for this poll' });
    }

    // Validate indices range
    for (const index of optionIndices) {
      const idx = parseInt(index);
      if (isNaN(idx) || idx < 0 || idx >= post.pollOptions.length) {
        return res.status(400).json({ message: 'Invalid option index chosen' });
      }
      post.pollOptions[idx].votes.push(req.userId);
    }

    await post.save();

    // Prepare response options with updated counts
    const pollOptions = post.pollOptions.map(opt => ({
      _id: opt._id,
      text: opt.text,
      voteCount: opt.votes.length
    }));

    res.json({
      message: 'Vote submitted successfully!',
      pollOptions,
      correctAnswers: post.correctAnswers || [],
      userPollVote: isPollingType ? optionIndices[0] : optionIndices
    });
  } catch (error) {
    console.error('Poll vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;