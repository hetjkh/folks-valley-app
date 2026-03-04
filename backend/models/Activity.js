const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['follow', 'like', 'comment', 'project_created', 'profile_updated'],
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for efficient queries
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ targetUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
