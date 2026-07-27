import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
    // Optional: Google-authenticated users won't have a password
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true   // allows null for non-Google users
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true  // Google users may not have a studentId initially
  },
  year: {
    type: Number,
    min: 1,
    max: 4
  },
  branch: {
    type: String
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: String,
  otpExpires: Date,
  role: {
    type: String,
    enum: ['student', 'moderator', 'admin'],
    default: 'student'
  },
  reputation: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Wordle Streak System
  wordleStreak: {
    current: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    lastPlayedDate: {
      type: Date,
      default: null
    },
    totalWins: {
      type: Number,
      default: 0
    }
  },

  // Buddy Connect System
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  connectionRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  // Skip hashing for Google-authenticated users or unchanged passwords
  if (!this.isModified('password') || !this.password || this.authProvider === 'google') return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  if (this.authProvider === 'google' || !this.password) {
    return false; // Google users should login via Google
  }
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);