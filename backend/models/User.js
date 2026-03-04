const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  firstName: {
    type: String,
    trim: true,
    default: '',
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  bannerImage: {
    type: String,
    default: null,
  },
  about: {
    type: String,
    default: '',
  },
  socialLinks: {
    twitter: {
      type: String,
      default: '',
      trim: true,
    },
    linkedin: {
      type: String,
      default: '',
      trim: true,
    },
    telegram: {
      type: String,
      default: '',
      trim: true,
    },
    facebook: {
      type: String,
      default: '',
      trim: true,
    },
    instagram: {
      type: String,
      default: '',
      trim: true,
    },
    whatsapp: {
      type: String,
      default: '',
      trim: true,
    },
    github: {
      type: String,
      default: '',
      trim: true,
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);

