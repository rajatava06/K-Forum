import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Moderation System
  status: {
    type: String,
    enum: ['PUBLISHED', 'PENDING_REVIEW', 'REJECTED'],
    default: 'PENDING_REVIEW',
    index: true
  },
  moderation: {
    isUnsafe: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      default: 0
    },
    categories: [{
      type: String
    }],
    flaggedWords: [{
      type: String
    }],
    language: {
      type: String,
      default: 'unknown'
    }
  },
  adminDecision: {
    decision: {
      type: String,
      enum: ['APPROVED', 'REJECTED']
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reason: String
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'removed'],
    default: 'pending'
  },
  attachments: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['image']
    },
    filename: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Comment', commentSchema);