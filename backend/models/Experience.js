const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  type: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Experience', experienceSchema);

