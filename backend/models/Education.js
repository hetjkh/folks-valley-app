const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  degree: {
    type: String,
    required: true,
    trim: true,
  },
  institute: {
    type: String,
    required: true,
    trim: true,
  },
  startYear: {
    type: String,
    required: true,
    trim: true,
  },
  endYear: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Education', educationSchema);

