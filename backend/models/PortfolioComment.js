const mongoose = require('mongoose');

const portfolioCommentSchema = new mongoose.Schema({
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
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PortfolioComment', portfolioCommentSchema);
