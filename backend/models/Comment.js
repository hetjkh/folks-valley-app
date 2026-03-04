const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
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
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Comment', commentSchema);
