const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
}, {
  timestamps: true,
});

// Prevent duplicate likes
likeSchema.index({ userId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
