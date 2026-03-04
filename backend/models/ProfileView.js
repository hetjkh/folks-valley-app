const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for anonymous viewers
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  referrer: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  device: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null, // null for profile views, set for project views
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
profileViewSchema.index({ userId: 1, viewedAt: -1 });
profileViewSchema.index({ userId: 1, projectId: 1, viewedAt: -1 });
profileViewSchema.index({ viewedAt: -1 });

module.exports = mongoose.model('ProfileView', profileViewSchema);
