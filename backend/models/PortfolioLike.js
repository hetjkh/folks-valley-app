const mongoose = require('mongoose');

const portfolioLikeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  portfolioUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Prevent duplicate likes
portfolioLikeSchema.index({ userId: 1, portfolioUserId: 1 }, { unique: true });

module.exports = mongoose.model('PortfolioLike', portfolioLikeSchema);
