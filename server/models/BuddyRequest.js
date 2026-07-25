import mongoose from 'mongoose';

const buddyRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
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
  },
  respondedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Create compound index to prevent duplicate requests
buddyRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true, sparse: true });

export default mongoose.model('BuddyRequest', buddyRequestSchema);
