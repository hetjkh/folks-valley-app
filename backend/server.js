const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('./config/cloudinary');
const User = require('./models/User');
const Project = require('./models/Project');
const Education = require('./models/Education');
const Experience = require('./models/Experience');
const Skill = require('./models/Skill');
const Follow = require('./models/Follow');
const Like = require('./models/Like');
const Comment = require('./models/Comment');
const Activity = require('./models/Activity');
const ProfileView = require('./models/ProfileView');
const PortfolioLike = require('./models/PortfolioLike');
const PortfolioComment = require('./models/PortfolioComment');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Connect to MongoDB
connectDB();

// Middleware
app.set('trust proxy', true); // Trust proxy to get real IP addresses
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Simple hello API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'hello i am api' });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate username format
    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      return res.status(400).json({ error: 'Username can only contain lowercase letters, numbers, and underscores' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    // Check if user already exists (email or username)
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUserByUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user endpoint (protected)
app.get('/api/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Fetching user data for userId:', decoded.userId);
    console.log('User data from DB:', {
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        about: user.about,
        socialLinks: user.socialLinks || {},
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (imageBase64, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      `data:image/jpeg;base64,${imageBase64}`,
      {
        folder: folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
  });
};

// Upload profile picture endpoint
app.post('/api/upload-profile-picture', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(imageBase64, 'profile-pictures');
    console.log('Profile picture uploaded to Cloudinary:', imageUrl);

    // Update user in database
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { profilePicture: imageUrl },
      { new: true }
    ).select('-password');

    console.log('Profile picture saved to database for userId:', decoded.userId);

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Upload banner image endpoint
app.post('/api/upload-banner-image', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(imageBase64, 'banner-images');
    console.log('Banner image uploaded to Cloudinary:', imageUrl);

    // Update user in database
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { bannerImage: imageUrl },
      { new: true }
    ).select('-password');

    console.log('Banner image saved to database for userId:', decoded.userId);

    res.json({
      message: 'Banner image uploaded successfully',
      bannerImage: user.bannerImage,
    });
  } catch (error) {
    console.error('Upload banner image error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Update user profile endpoint
app.put('/api/user/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, firstName, lastName, phone, about, socialLinks } = req.body;

    console.log('Update request received:', { userId: decoded.userId, body: req.body });

    // Get current user data first
    const currentUser = await User.findById(decoded.userId).select('-password');
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Current user data:', {
      name: currentUser.name,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phone: currentUser.phone,
    });

    const updateData = {};
    // Only update fields that are explicitly provided (not undefined)
    // This preserves existing data if a field is not included in the request
    if (name !== undefined && name !== null) updateData.name = name;
    if (firstName !== undefined && firstName !== null) updateData.firstName = firstName;
    if (lastName !== undefined && lastName !== null) updateData.lastName = lastName;
    if (phone !== undefined && phone !== null) updateData.phone = phone;
    if (about !== undefined && about !== null) updateData.about = about;
    if (socialLinks !== undefined && socialLinks !== null) {
      // Merge with existing socialLinks to preserve other fields
      const existingSocialLinks = currentUser.socialLinks || {};
      updateData.socialLinks = {
        ...existingSocialLinks,
        ...socialLinks,
      };
    }

    console.log('Update data to save:', updateData);

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User updated successfully:', {
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        about: user.about,
        socialLinks: user.socialLinks || {},
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error during update' });
  }
});

// Get all projects for a user
app.get('/api/projects', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const projects = await Project.find({ userId: decoded.userId }).sort({ createdAt: -1 });

    // Get unique categories from projects
    const categories = [...new Set(projects.map(p => p.category || 'Uncategorized'))];

    res.json({ projects, categories });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Create a new project
app.post('/api/projects', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { title, technologies, category } = req.body;

    const project = new Project({
      userId: decoded.userId,
      title: title || 'New Project',
      technologies: technologies || [],
      category: category || 'Uncategorized',
    });

    console.log('Creating project:', { userId: decoded.userId, title: project.title, category: project.category });
    await project.save();
    console.log('Project saved to database:', { projectId: project._id, title: project.title });
    res.json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error during project creation' });
  }
});

// Update project image
app.post('/api/projects/:id/upload-image', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(imageBase64, 'project-images');

    // Update project in database
    const project = await Project.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      { image: imageUrl },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      message: 'Project image uploaded successfully',
      image: project.image,
    });
  } catch (error) {
    console.error('Upload project image error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Helper function to fetch website preview image from Open Graph tags
async function fetchWebsitePreviewImage(url) {
  return new Promise((resolve) => {
    try {
      // Ensure URL has protocol
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
      }

      const urlObj = new URL(fullUrl);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + (urlObj.search || ''),
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
      };

      const req = client.request(options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location;
          // Resolve relative redirects
          let absoluteRedirect = redirectUrl;
          if (redirectUrl.startsWith('/')) {
            absoluteRedirect = urlObj.origin + redirectUrl;
          } else if (!redirectUrl.startsWith('http')) {
            absoluteRedirect = urlObj.origin + '/' + redirectUrl;
          }
          // Recursively fetch (with max depth to prevent infinite loops)
          return fetchWebsitePreviewImage(absoluteRedirect).then(resolve).catch(() => resolve(null));
        }

        if (res.statusCode !== 200) {
          console.error(`Failed to fetch URL: ${res.statusCode}`);
          resolve(null);
          return;
        }

        let html = '';
        const maxSize = 100000; // 100KB limit
        
        res.on('data', (chunk) => {
          html += chunk.toString();
          // Stop reading after maxSize to avoid memory issues
          if (html.length > maxSize) {
            res.destroy();
            parseHTML(html, fullUrl, resolve);
          }
        });
        
        res.on('end', () => {
          parseHTML(html, fullUrl, resolve);
        });

        res.on('error', (error) => {
          console.error('Error reading response:', error);
          resolve(null);
        });
      });

      req.on('error', (error) => {
        console.error('Error fetching URL:', error.message);
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('Request timeout for:', fullUrl);
        resolve(null);
      });

      req.setTimeout(10000);
      req.end();
    } catch (error) {
      console.error('Error parsing URL:', error.message);
      resolve(null);
    }
  });
}

// Helper function to parse HTML and extract Open Graph image
function parseHTML(html, baseUrl, resolve) {
  try {
    const base = new URL(baseUrl);
    
    // Helper to convert relative URLs to absolute
    const toAbsoluteUrl = (url) => {
      if (!url) return null;
      
      // Already absolute
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // Protocol-relative URL
      if (url.startsWith('//')) {
        return base.protocol + url;
      }
      
      // Absolute path
      if (url.startsWith('/')) {
        return base.origin + url;
      }
      
      // Relative path
      return base.origin + '/' + url;
    };

    // Try multiple patterns for og:image
    const ogPatterns = [
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
      /<meta\s+property=["']og:image:secure_url["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image:secure_url["']/i,
    ];

    for (const pattern of ogPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const absoluteUrl = toAbsoluteUrl(match[1]);
        if (absoluteUrl) {
          resolve(absoluteUrl);
          return;
        }
      }
    }

    // Fallback: Try twitter:image
    const twitterPatterns = [
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
      /<meta\s+name=["']twitter:image:src["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image:src["']/i,
    ];

    for (const pattern of twitterPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const absoluteUrl = toAbsoluteUrl(match[1]);
        if (absoluteUrl) {
          resolve(absoluteUrl);
          return;
        }
      }
    }

    // Last resort: Try to find any large image in the page
    const imageMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    for (const match of imageMatches) {
      if (match[1]) {
        const absoluteUrl = toAbsoluteUrl(match[1]);
        if (absoluteUrl && (absoluteUrl.includes('og') || absoluteUrl.includes('preview') || absoluteUrl.includes('share'))) {
          resolve(absoluteUrl);
          return;
        }
      }
    }

    resolve(null);
  } catch (error) {
    console.error('Error parsing HTML:', error.message);
    resolve(null);
  }
}

// Update project details
app.put('/api/projects/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;
    const { title, technologies, url, category } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (technologies !== undefined) updateData.technologies = technologies;
    if (category !== undefined) updateData.category = category || 'Uncategorized';
    if (url !== undefined) {
      updateData.url = url;
      
      // If URL is provided and project doesn't have an image, fetch preview
      const existingProject = await Project.findById(id);
      if (url && url.trim() && (!existingProject || !existingProject.image)) {
        try {
          // Fetch website preview image
          const previewImageUrl = await fetchWebsitePreviewImage(url);
          if (previewImageUrl) {
            // Upload the preview image to Cloudinary
            try {
              // Ensure the image URL is absolute
              let absoluteImageUrl = previewImageUrl;
              if (previewImageUrl.startsWith('//')) {
                absoluteImageUrl = 'https:' + previewImageUrl;
              } else if (previewImageUrl.startsWith('/')) {
                try {
                  const base = new URL(url);
                  absoluteImageUrl = base.origin + previewImageUrl;
                } catch (e) {
                  console.error('Error constructing absolute URL:', e);
                  // Skip if we can't construct absolute URL
                  throw new Error('Cannot construct absolute image URL');
                }
              }

              // Download the image and upload to Cloudinary
              const imageResponse = await new Promise((resolve, reject) => {
                try {
                  const urlObj = new URL(absoluteImageUrl);
                  const client = urlObj.protocol === 'https:' ? https : http;
                  
                  const req = client.get(urlObj.href, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    timeout: 10000,
                  }, (res) => {
                    if (res.statusCode !== 200) {
                      reject(new Error(`Failed to download image: ${res.statusCode}`));
                      return;
                    }
                    
                    // Check content type
                    const contentType = res.headers['content-type'] || '';
                    if (!contentType.startsWith('image/')) {
                      reject(new Error('URL does not point to an image'));
                      return;
                    }
                    
                    const chunks = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(chunks)));
                    res.on('error', reject);
                  });
                  
                  req.on('error', reject);
                  req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                  });
                  
                  req.setTimeout(10000);
                } catch (urlError) {
                  reject(new Error(`Invalid image URL: ${urlError.message}`));
                }
              });

              // Convert to base64
              const base64Image = imageResponse.toString('base64');
              // Determine content type from response or default to jpeg
              const dataUri = `data:image/jpeg;base64,${base64Image}`;
              
              // Upload to Cloudinary
              const cloudinaryResult = await cloudinary.uploader.upload(dataUri, {
                folder: 'project-previews',
                resource_type: 'image',
              });
              
              updateData.image = cloudinaryResult.secure_url;
            } catch (uploadError) {
              console.error('Error uploading preview image to Cloudinary:', uploadError.message);
              // Silently fail - don't set image if download/upload fails
              // The URL will still be saved, but no preview image
            }
          }
        } catch (previewError) {
          console.error('Error fetching preview image:', previewError);
          // Continue without preview image
        }
      }
    }

    console.log('Updating project:', { projectId: id, userId: decoded.userId, updateData });
    
    const project = await Project.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      updateData,
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('Project updated in database:', { projectId: project._id, title: project.title });

    res.json({
      message: 'Project updated successfully',
      project: project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error during update' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const project = await Project.findOneAndDelete({ _id: id, userId: decoded.userId });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

// ==================== EDUCATION ENDPOINTS ====================

// Get all education entries for a user
app.get('/api/education', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const education = await Education.find({ userId: decoded.userId }).sort({ startYear: -1 });

    res.json({ education });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Create a new education entry
app.post('/api/education', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { degree, institute, startYear, endYear } = req.body;

    const education = new Education({
      userId: decoded.userId,
      degree: degree || '',
      institute: institute || '',
      startYear: startYear || '',
      endYear: endYear || '',
    });

    console.log('Creating education:', { userId: decoded.userId, degree, institute, startYear, endYear });
    await education.save();
    console.log('Education saved to database:', { educationId: education._id, degree: education.degree });
    res.json({ education });
  } catch (error) {
    console.error('Create education error:', error);
    res.status(500).json({ error: 'Server error during education creation' });
  }
});

// Update education entry
app.put('/api/education/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;
    const { degree, institute, startYear, endYear } = req.body;

    const updateData = {};
    if (degree !== undefined) updateData.degree = degree;
    if (institute !== undefined) updateData.institute = institute;
    if (startYear !== undefined) updateData.startYear = startYear;
    if (endYear !== undefined) updateData.endYear = endYear;

    console.log('Updating education:', { educationId: id, userId: decoded.userId, updateData });
    
    const education = await Education.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      updateData,
      { new: true }
    );

    if (!education) {
      return res.status(404).json({ error: 'Education entry not found' });
    }

    console.log('Education updated in database:', { educationId: education._id, degree: education.degree });

    res.json({
      message: 'Education updated successfully',
      education: education,
    });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ error: 'Server error during update' });
  }
});

// Delete education entry
app.delete('/api/education/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const education = await Education.findOneAndDelete({ _id: id, userId: decoded.userId });

    if (!education) {
      return res.status(404).json({ error: 'Education entry not found' });
    }

    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

// ==================== EXPERIENCE ENDPOINTS ====================

// Get all experience entries for a user
app.get('/api/experience', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const experience = await Experience.find({ userId: decoded.userId }).sort({ createdAt: -1 });

    res.json({ experience });
  } catch (error) {
    console.error('Get experience error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Create a new experience entry
app.post('/api/experience', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { position, company, duration, location, type } = req.body;

    const experience = new Experience({
      userId: decoded.userId,
      position: position || '',
      company: company || '',
      duration: duration || '',
      location: location || '',
      type: type || '',
    });

    console.log('Creating experience:', { userId: decoded.userId, position, company, duration });
    await experience.save();
    console.log('Experience saved to database:', { experienceId: experience._id, position: experience.position });
    res.json({ experience });
  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json({ error: 'Server error during experience creation' });
  }
});

// Update experience entry
app.put('/api/experience/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;
    const { position, company, duration, location, type } = req.body;

    const updateData = {};
    if (position !== undefined) updateData.position = position;
    if (company !== undefined) updateData.company = company;
    if (duration !== undefined) updateData.duration = duration;
    if (location !== undefined) updateData.location = location;
    if (type !== undefined) updateData.type = type;

    console.log('Updating experience:', { experienceId: id, userId: decoded.userId, updateData });
    
    const experience = await Experience.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      updateData,
      { new: true }
    );

    if (!experience) {
      return res.status(404).json({ error: 'Experience entry not found' });
    }

    console.log('Experience updated in database:', { experienceId: experience._id, position: experience.position });

    res.json({
      message: 'Experience updated successfully',
      experience: experience,
    });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ error: 'Server error during update' });
  }
});

// Delete experience entry
app.delete('/api/experience/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const experience = await Experience.findOneAndDelete({ _id: id, userId: decoded.userId });

    if (!experience) {
      return res.status(404).json({ error: 'Experience entry not found' });
    }

    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

// ==================== SKILLS ENDPOINTS ====================

// Get all skills for a user
app.get('/api/skills', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const skills = await Skill.find({ userId: decoded.userId }).sort({ createdAt: -1 });

    res.json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Create a new skill
app.post('/api/skills', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, proficiency } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const skill = new Skill({
      userId: decoded.userId,
      name: name.trim(),
      proficiency: proficiency || 'Intermediate',
    });

    await skill.save();
    res.json({ skill });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Server error during skill creation' });
  }
});

// Update skill
app.put('/api/skills/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;
    const { name, proficiency } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (proficiency !== undefined) updateData.proficiency = proficiency;

    const skill = await Skill.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      updateData,
      { new: true }
    );

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({
      message: 'Skill updated successfully',
      skill: skill,
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Server error during update' });
  }
});

// Delete skill
app.delete('/api/skills/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const skill = await Skill.findOneAndDelete({ _id: id, userId: decoded.userId });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

// ==================== PUBLIC PROFILE ENDPOINT ====================

// Get public user profile by ID (no authentication required) - kept for backward compatibility
app.get('/api/public/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Get user (excluding password)
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's projects, education, experience, and skills
    const [projects, education, experience, skills] = await Promise.all([
      Project.find({ userId: id }).sort({ createdAt: -1 }),
      Education.find({ userId: id }).sort({ startYear: -1 }),
      Experience.find({ userId: id }).sort({ createdAt: -1 }),
      Skill.find({ userId: id }).sort({ createdAt: -1 }),
    ]);

    // Return public profile data
    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        about: user.about,
        socialLinks: user.socialLinks || {},
      },
      projects,
      education,
      experience,
      skills,
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

// Get public user profile by username (no authentication required)
app.get('/api/public/username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user by username (excluding password)
    const user = await User.findOne({ username: username.toLowerCase() }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's projects, education, experience, and skills
    const [projects, education, experience, skills] = await Promise.all([
      Project.find({ userId: user._id }).sort({ createdAt: -1 }),
      Education.find({ userId: user._id }).sort({ startYear: -1 }),
      Experience.find({ userId: user._id }).sort({ createdAt: -1 }),
      Skill.find({ userId: user._id }).sort({ createdAt: -1 }),
    ]);

    // Return public profile data
    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        about: user.about,
        socialLinks: user.socialLinks || {},
      },
      projects,
      education,
      experience,
      skills,
    });
  } catch (error) {
    console.error('Get public profile by username error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

// ==================== SOCIAL FEATURES ENDPOINTS ====================

// Helper function to create activity
const createActivity = async (userId, type, targetUserId = null, projectId = null, commentId = null, metadata = {}) => {
  try {
    const activity = new Activity({
      userId,
      type,
      targetUserId,
      projectId,
      commentId,
      metadata,
    });
    await activity.save();
  } catch (error) {
    console.error('Error creating activity:', error);
  }
};

// Follow user
app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    if (decoded.userId === id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if user exists
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ followerId: decoded.userId, followingId: id });
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    const follow = new Follow({
      followerId: decoded.userId,
      followingId: id,
    });
    await follow.save();

    // Create activity
    await createActivity(decoded.userId, 'follow', id);

    res.json({ message: 'Successfully followed user', follow });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Server error during follow' });
  }
});

// Unfollow user
app.delete('/api/users/:id/unfollow', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const follow = await Follow.findOneAndDelete({ followerId: decoded.userId, followingId: id });
    if (!follow) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Server error during unfollow' });
  }
});

// Check if following a user
app.get('/api/users/:id/follow-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.json({ isFollowing: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const follow = await Follow.findOne({ followerId: decoded.userId, followingId: id });
    res.json({ isFollowing: !!follow });
  } catch (error) {
    res.json({ isFollowing: false });
  }
});

// Get followers list
app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const { id } = req.params;
    const followers = await Follow.find({ followingId: id })
      .populate('followerId', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      followers: followers.map(f => ({
        id: f.followerId._id,
        name: f.followerId.name,
        username: f.followerId.username,
        profilePicture: f.followerId.profilePicture,
        followedAt: f.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Server error fetching followers' });
  }
});

// Get following list
app.get('/api/users/:id/following', async (req, res) => {
  try {
    const { id } = req.params;
    const following = await Follow.find({ followerId: id })
      .populate('followingId', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      following: following.map(f => ({
        id: f.followingId._id,
        name: f.followingId.name,
        username: f.followingId.username,
        profilePicture: f.followingId.profilePicture,
        followedAt: f.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Server error fetching following' });
  }
});

// Get follower/following counts
app.get('/api/users/:id/follow-stats', async (req, res) => {
  try {
    const { id } = req.params;
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: id }),
      Follow.countDocuments({ followerId: id }),
    ]);

    res.json({ followersCount, followingCount });
  } catch (error) {
    console.error('Get follow stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// Like project
app.post('/api/projects/:id/like', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    // Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if already liked
    const existingLike = await Like.findOne({ userId: decoded.userId, projectId: id });
    if (existingLike) {
      return res.status(400).json({ error: 'Already liked this project' });
    }

    // Create like
    const like = new Like({
      userId: decoded.userId,
      projectId: id,
    });
    await like.save();

    // Create activity
    await createActivity(decoded.userId, 'like', project.userId, id);

    // Get updated like count
    const likeCount = await Like.countDocuments({ projectId: id });

    res.json({ message: 'Project liked successfully', like, likeCount });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Server error during like' });
  }
});

// Unlike project
app.delete('/api/projects/:id/like', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const like = await Like.findOneAndDelete({ userId: decoded.userId, projectId: id });
    if (!like) {
      return res.status(404).json({ error: 'Like not found' });
    }

    // Get updated like count
    const likeCount = await Like.countDocuments({ projectId: id });

    res.json({ message: 'Project unliked successfully', likeCount });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ error: 'Server error during unlike' });
  }
});

// Check if project is liked
app.get('/api/projects/:id/like-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.json({ isLiked: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const like = await Like.findOne({ userId: decoded.userId, projectId: id });
    res.json({ isLiked: !!like });
  } catch (error) {
    res.json({ isLiked: false });
  }
});

// Get project likes count
app.get('/api/projects/:id/likes', async (req, res) => {
  try {
    const { id } = req.params;
    const likeCount = await Like.countDocuments({ projectId: id });
    res.json({ likeCount });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ error: 'Server error fetching likes' });
  }
});

// Get users who liked a project
app.get('/api/projects/:id/likes/users', async (req, res) => {
  try {
    const { id } = req.params;
    const likes = await Like.find({ projectId: id })
      .populate('userId', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(100);
    
    const users = likes.map(like => ({
      id: like.userId._id,
      name: like.userId.name,
      username: like.userId.username,
      profilePicture: like.userId.profilePicture,
      likedAt: like.createdAt,
    }));
    
    res.json({ users, total: users.length });
  } catch (error) {
    console.error('Get likes users error:', error);
    res.status(500).json({ error: 'Server error fetching likes users' });
  }
});

// Comment on project
app.post('/api/projects/:id/comment', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create comment
    const comment = new Comment({
      userId: decoded.userId,
      projectId: id,
      text: text.trim(),
    });
    await comment.save();

    // Populate user info
    await comment.populate('userId', 'name username profilePicture');

    // Create activity
    await createActivity(decoded.userId, 'comment', project.userId, id, comment._id);

    res.json({
      message: 'Comment added successfully',
      comment: {
        _id: comment._id,
        userId: comment.userId,
        projectId: comment.projectId,
        text: comment.text,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Server error during comment' });
  }
});

// Get project comments
app.get('/api/projects/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ projectId: id })
      .populate('userId', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      comments: comments.map(c => ({
        _id: c._id,
        userId: {
          id: c.userId._id,
          name: c.userId.name,
          username: c.userId.username,
          profilePicture: c.userId.profilePicture,
        },
        text: c.text,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error fetching comments' });
  }
});

// Delete comment
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error during delete' });
  }
});

// Get activity feed
app.get('/api/activity', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    // Get activities for users that the current user follows, plus their own activities
    const followingIds = await Follow.find({ followerId: decoded.userId }).distinct('followingId');
    const userIds = [decoded.userId, ...followingIds];

    const activities = await Activity.find({ userId: { $in: userIds } })
      .populate('userId', 'name username profilePicture')
      .populate('targetUserId', 'name username profilePicture')
      .populate('projectId', 'title image')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    res.json({ activities });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Server error fetching activity' });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// Track profile view
app.post('/api/analytics/track-view', async (req, res) => {
  try {
    const { userId, projectId } = req.body;
    
    // Get IP address (handle various proxy scenarios)
    let ipAddress = req.ip || 
                    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                    req.headers['x-real-ip'] || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress ||
                    null;
    
    // Clean up IP address (remove IPv6 prefix if present)
    if (ipAddress && ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.substring(7);
    }
    
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers.referer || req.headers.referrer || null;

    // Detect device type
    let device = 'unknown';
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      device = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      device = 'tablet';
    } else if (/desktop|windows|mac|linux/i.test(userAgent)) {
      device = 'desktop';
    }

    const view = new ProfileView({
      userId,
      projectId: projectId || null,
      ipAddress,
      userAgent,
      referrer,
      device,
      viewedAt: new Date(),
    });

    await view.save();
    res.json({ message: 'View tracked successfully' });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Server error tracking view' });
  }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const period = req.query.period || 'week'; // day, week, month
    const projectId = req.query.projectId || null;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (period === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Build query
    const query = { userId, viewedAt: { $gte: startDate } };
    if (projectId) {
      query.projectId = projectId;
    } else {
      query.projectId = null; // Only profile views
    }

    // Get total views
    const totalViews = await ProfileView.countDocuments(query);

    // Get views by day
    const viewsByDay = await ProfileView.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get views by device
    const viewsByDevice = await ProfileView.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get views by referrer (traffic sources)
    const viewsByReferrer = await ProfileView.aggregate([
      { $match: { ...query, referrer: { $ne: null } } },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$referrer', regex: /localhost|127\.0\.0\.1/ } },
              'Direct',
              {
                $cond: [
                  { $regexMatch: { input: '$referrer', regex: /google|bing|yahoo/ } },
                  'Search Engine',
                  {
                    $cond: [
                      { $regexMatch: { input: '$referrer', regex: /facebook|twitter|instagram|linkedin/ } },
                      'Social Media',
                      'Other',
                    ],
                  },
                ],
              },
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get unique visitors
    const uniqueVisitors = await ProfileView.distinct('ipAddress', query).then(ips => ips.length);

    // Get popular projects (if projectId is null, get top viewed projects)
    let popularProjects = [];
    if (!projectId) {
      popularProjects = await ProfileView.aggregate([
        { $match: { userId, viewedAt: { $gte: startDate }, projectId: { $ne: null } } },
        {
          $group: {
            _id: '$projectId',
            views: { $sum: 1 },
          },
        },
        { $sort: { views: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: '$project' },
        {
          $project: {
            projectId: '$_id',
            title: '$project.title',
            views: 1,
          },
        },
      ]);
    }

    res.json({
      totalViews,
      uniqueVisitors,
      viewsByDay,
      viewsByDevice,
      viewsByReferrer,
      popularProjects,
      period,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

// Export analytics data
app.get('/api/analytics/export', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const period = req.query.period || 'month';

    const now = new Date();
    let startDate = new Date();
    if (period === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const views = await ProfileView.find({
      userId,
      viewedAt: { $gte: startDate },
    })
      .populate('projectId', 'title')
      .sort({ viewedAt: -1 })
      .lean();

    const csvData = views.map(view => ({
      date: view.viewedAt.toISOString(),
      project: view.projectId?.title || 'Profile',
      device: view.device,
      referrer: view.referrer || 'Direct',
      ipAddress: view.ipAddress,
    }));

    res.json({ data: csvData, period });
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Server error exporting analytics' });
  }
});

// ==================== PORTFOLIO FEED ENDPOINTS ====================

// Get all portfolios for feed
app.get('/api/feed/portfolios', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get all users with their basic info
    const users = await User.find()
      .select('name username profilePicture bannerImage about')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get projects count and first project image for each user
    const portfolios = await Promise.all(
      users.map(async (user) => {
        const [projects, education, experience, skills, likeCount, commentCount] = await Promise.all([
          Project.find({ userId: user._id }).limit(3).select('title image').lean(),
          Education.find({ userId: user._id }).countDocuments(),
          Experience.find({ userId: user._id }).countDocuments(),
          Skill.find({ userId: user._id }).countDocuments(),
          PortfolioLike.countDocuments({ portfolioUserId: user._id }),
          PortfolioComment.countDocuments({ portfolioUserId: user._id }),
        ]);

        return {
          user: {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture,
            bannerImage: user.bannerImage,
            about: user.about,
          },
          projects: projects.slice(0, 3),
          stats: {
            projectsCount: projects.length,
            educationCount: education,
            experienceCount: experience,
            skillsCount: skills,
            likesCount: likeCount,
            commentsCount: commentCount,
          },
        };
      })
    );

    res.json({
      portfolios,
      page,
      limit,
      hasMore: portfolios.length === limit,
    });
  } catch (error) {
    console.error('Get portfolios feed error:', error);
    res.status(500).json({ error: 'Server error fetching portfolios' });
  }
});

// Like a portfolio
app.post('/api/portfolios/:userId/like', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId } = req.params;

    if (decoded.userId === userId) {
      return res.status(400).json({ error: 'Cannot like your own portfolio' });
    }

    // Check if already liked
    const existingLike = await PortfolioLike.findOne({
      userId: decoded.userId,
      portfolioUserId: userId,
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Portfolio already liked' });
    }

    // Create like
    const like = new PortfolioLike({
      userId: decoded.userId,
      portfolioUserId: userId,
    });
    await like.save();

    // Create activity
    await createActivity(decoded.userId, 'portfolio_like', userId);

    const likeCount = await PortfolioLike.countDocuments({ portfolioUserId: userId });

    res.json({
      message: 'Portfolio liked successfully',
      likeCount,
    });
  } catch (error) {
    console.error('Like portfolio error:', error);
    res.status(500).json({ error: 'Server error liking portfolio' });
  }
});

// Unlike a portfolio
app.delete('/api/portfolios/:userId/like', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId } = req.params;

    await PortfolioLike.findOneAndDelete({
      userId: decoded.userId,
      portfolioUserId: userId,
    });

    const likeCount = await PortfolioLike.countDocuments({ portfolioUserId: userId });

    res.json({
      message: 'Portfolio unliked successfully',
      likeCount,
    });
  } catch (error) {
    console.error('Unlike portfolio error:', error);
    res.status(500).json({ error: 'Server error unliking portfolio' });
  }
});

// Check if portfolio is liked
app.get('/api/portfolios/:userId/like-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.json({ isLiked: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId } = req.params;

    const like = await PortfolioLike.findOne({
      userId: decoded.userId,
      portfolioUserId: userId,
    });

    res.json({ isLiked: !!like });
  } catch (error) {
    res.json({ isLiked: false });
  }
});

// Get portfolio likes count
app.get('/api/portfolios/:userId/likes', async (req, res) => {
  try {
    const { userId } = req.params;
    const likeCount = await PortfolioLike.countDocuments({ portfolioUserId: userId });
    res.json({ likeCount });
  } catch (error) {
    console.error('Get portfolio likes error:', error);
    res.status(500).json({ error: 'Server error fetching likes' });
  }
});

// Comment on a portfolio
app.post('/api/portfolios/:userId/comment', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    if (decoded.userId === userId) {
      return res.status(400).json({ error: 'Cannot comment on your own portfolio' });
    }

    // Create comment
    const comment = new PortfolioComment({
      userId: decoded.userId,
      portfolioUserId: userId,
      text: text.trim(),
    });
    await comment.save();

    // Populate user info
    await comment.populate('userId', 'name username profilePicture');

    // Create activity
    await createActivity(decoded.userId, 'portfolio_comment', userId, null, comment._id);

    res.json({
      message: 'Comment added successfully',
      comment: {
        _id: comment._id,
        userId: {
          id: comment.userId._id,
          name: comment.userId.name,
          username: comment.userId.username,
          profilePicture: comment.userId.profilePicture,
        },
        text: comment.text,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error('Comment on portfolio error:', error);
    res.status(500).json({ error: 'Server error adding comment' });
  }
});

// Get portfolio comments
app.get('/api/portfolios/:userId/comments', async (req, res) => {
  try {
    const { userId } = req.params;
    const comments = await PortfolioComment.find({ portfolioUserId: userId })
      .populate('userId', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedComments = comments.map(comment => ({
      _id: comment._id,
      userId: {
        id: comment.userId._id,
        name: comment.userId.name,
        username: comment.userId.username,
        profilePicture: comment.userId.profilePicture,
      },
      text: comment.text,
      createdAt: comment.createdAt,
    }));

    res.json({ comments: formattedComments });
  } catch (error) {
    console.error('Get portfolio comments error:', error);
    res.status(500).json({ error: 'Server error fetching comments' });
  }
});

// Delete portfolio comment
app.delete('/api/portfolios/comments/:commentId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { commentId } = req.params;

    const comment = await PortfolioComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await PortfolioComment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio comment error:', error);
    res.status(500).json({ error: 'Server error deleting comment' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://192.168.1.8:${PORT}`);
  console.log(`API endpoint: http://192.168.1.8:${PORT}/api/hello`);
  console.log(`Make sure your phone is on the same WiFi network!`);
});

