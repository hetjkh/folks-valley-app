const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  technologies: [{
    type: String,
    trim: true,
  }],
  url: {
    type: String,
    default: null,
    trim: true,
  },
  category: {
    type: String,
    default: 'Uncategorized',
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Project', projectSchema);

