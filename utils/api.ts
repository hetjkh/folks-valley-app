import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.13:3000/api';

export interface User {
  id: string;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  profilePicture?: string | null;
  bannerImage?: string | null;
  about?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    telegram?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Store token securely
export const storeToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync('auth_token', token);
};

// Get token from secure store
export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('auth_token');
};

// Remove token
export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('auth_token');
};

// API call helper
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

// Register user
export const registerUser = async (
  name: string,
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> => {
  const data = await apiCall('/register', {
    method: 'POST',
    body: JSON.stringify({ name, username, email, password, confirmPassword }),
  });

  if (data.token) {
    await storeToken(data.token);
  }

  return data;
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const data = await apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    await storeToken(data.token);
  }

  return data;
};

// Get current user
export const getCurrentUser = async (): Promise<{ user: User }> => {
  return await apiCall('/user', {
    method: 'GET',
  });
};

// Logout
export const logout = async (): Promise<void> => {
  await removeToken();
};

// Upload profile picture
export const uploadProfilePicture = async (imageBase64: string): Promise<{ profilePicture: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/upload-profile-picture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }

  return data;
};

// Upload banner image
export const uploadBannerImage = async (imageBase64: string): Promise<{ bannerImage: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/upload-banner-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }

  return data;
};

// Update user profile
export const updateUserProfile = async (name?: string, firstName?: string, lastName?: string, phone?: string, about?: string, socialLinks?: User['socialLinks']): Promise<{ user: User }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const body: any = {};
  if (name !== undefined) body.name = name;
  if (firstName !== undefined) body.firstName = firstName;
  if (lastName !== undefined) body.lastName = lastName;
  if (phone !== undefined) body.phone = phone;
  if (about !== undefined) body.about = about;
  if (socialLinks !== undefined) body.socialLinks = socialLinks;

  const response = await fetch(`${API_URL}/user/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Update failed');
  }

  return data;
};

// Project interfaces and API
export interface Project {
  _id: string;
  userId: string;
  title: string;
  image?: string | null;
  technologies: string[];
  url?: string | null;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all projects
export const getProjects = async (): Promise<{ projects: Project[]; categories: string[] }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/projects`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch projects');
  }

  return data;
};

// Create a new project
export const createProject = async (title?: string, technologies?: string[], category?: string): Promise<{ project: Project }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ title, technologies, category }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create project');
  }

  return data;
};

// Upload project image
export const uploadProjectImage = async (projectId: string, imageBase64: string): Promise<{ image: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/projects/${projectId}/upload-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }

  return data;
};

// Update project details
export const updateProject = async (projectId: string, title?: string, technologies?: string[], url?: string, category?: string): Promise<{ project: Project }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ title, technologies, url, category }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Update failed');
  }

  return data;
};

// Delete project
export const deleteProject = async (projectId: string): Promise<void> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Delete failed');
  }
};

// ==================== EDUCATION INTERFACES AND API ====================

export interface Education {
  _id: string;
  userId: string;
  degree: string;
  institute: string;
  startYear: string;
  endYear: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all education entries
export const getEducation = async (): Promise<{ education: Education[] }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/education`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch education');
  }

  return data;
};

// Create a new education entry
export const createEducation = async (degree: string, institute: string, startYear: string, endYear: string): Promise<{ education: Education }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/education`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ degree, institute, startYear, endYear }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create education');
  }

  return data;
};

// Update education entry
export const updateEducation = async (educationId: string, degree?: string, institute?: string, startYear?: string, endYear?: string): Promise<{ education: Education }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/education/${educationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ degree, institute, startYear, endYear }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Update failed');
  }

  return data;
};

// Delete education entry
export const deleteEducation = async (educationId: string): Promise<void> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/education/${educationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Delete failed');
  }
};

// ==================== EXPERIENCE INTERFACES AND API ====================

export interface Experience {
  _id: string;
  userId: string;
  position: string;
  company: string;
  duration: string;
  location?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all experience entries
export const getExperience = async (): Promise<{ experience: Experience[] }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/experience`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch experience');
  }

  return data;
};

// Create a new experience entry
export const createExperience = async (position: string, company: string, duration: string, location?: string, type?: string): Promise<{ experience: Experience }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/experience`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ position, company, duration, location, type }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create experience');
  }

  return data;
};

// Update experience entry
export const updateExperience = async (experienceId: string, position?: string, company?: string, duration?: string, location?: string, type?: string): Promise<{ experience: Experience }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/experience/${experienceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ position, company, duration, location, type }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Update failed');
  }

  return data;
};

// Delete experience entry
export const deleteExperience = async (experienceId: string): Promise<void> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/experience/${experienceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Delete failed');
  }
};

// ==================== SKILLS INTERFACES AND API ====================

export interface Skill {
  _id: string;
  userId: string;
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  createdAt?: string;
  updatedAt?: string;
}

// Get all skills
export const getSkills = async (): Promise<{ skills: Skill[] }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/skills`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch skills');
  }

  return data;
};

// Create a new skill
export const createSkill = async (name: string, proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'): Promise<{ skill: Skill }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, proficiency }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create skill');
  }

  return data;
};

// Update skill
export const updateSkill = async (skillId: string, name?: string, proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'): Promise<{ skill: Skill }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/skills/${skillId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, proficiency }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Update failed');
  }

  return data;
};

// Delete skill
export const deleteSkill = async (skillId: string): Promise<void> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/skills/${skillId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Delete failed');
  }
};

// ==================== SOCIAL FEATURES API ====================

// Follow user
export const followUser = async (userId: string): Promise<{ message: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/users/${userId}/follow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to follow user');
  }

  return data;
};

// Unfollow user
export const unfollowUser = async (userId: string): Promise<{ message: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/users/${userId}/unfollow`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to unfollow user');
  }

  return data;
};

// Check follow status
export const getFollowStatus = async (userId: string): Promise<{ isFollowing: boolean }> => {
  const token = await getToken();
  if (!token) {
    return { isFollowing: false };
  }

  const response = await fetch(`${API_URL}/users/${userId}/follow-status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data;
};

// Get followers
export interface Follower {
  id: string;
  name: string;
  username?: string;
  profilePicture?: string | null;
  followedAt: string;
}

export const getFollowers = async (userId: string): Promise<{ followers: Follower[] }> => {
  const response = await fetch(`${API_URL}/users/${userId}/followers`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch followers');
  }
  return data;
};

// Get following
export interface Following {
  id: string;
  name: string;
  username?: string;
  profilePicture?: string | null;
  followedAt: string;
}

export const getFollowing = async (userId: string): Promise<{ following: Following[] }> => {
  const response = await fetch(`${API_URL}/users/${userId}/following`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch following');
  }
  return data;
};

// Get follow stats
export const getFollowStats = async (userId: string): Promise<{ followersCount: number; followingCount: number }> => {
  const response = await fetch(`${API_URL}/users/${userId}/follow-stats`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch stats');
  }
  return data;
};

// Like project
export const likeProject = async (projectId: string): Promise<{ message: string; likeCount: number }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/projects/${projectId}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to like project');
  }

  return data;
};

// Unlike project
export const unlikeProject = async (projectId: string): Promise<{ message: string; likeCount: number }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/projects/${projectId}/like`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to unlike project');
  }

  return data;
};

// Check like status
export const getLikeStatus = async (projectId: string): Promise<{ isLiked: boolean }> => {
  const token = await getToken();
  if (!token) {
    return { isLiked: false };
  }

  const response = await fetch(`${API_URL}/projects/${projectId}/like-status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data;
};

// Get project likes count
export const getProjectLikes = async (projectId: string): Promise<{ likeCount: number }> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/likes`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch likes');
  }
  return data;
};

// Get users who liked a project
export interface ProjectLikeUser {
  id: string;
  name: string;
  username?: string;
  profilePicture?: string | null;
  likedAt: string;
}

export const getProjectLikesUsers = async (projectId: string): Promise<{ users: ProjectLikeUser[]; total: number }> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/likes/users`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch likes users');
  }
  return data;
};

// Comment on project
export interface Comment {
  _id: string;
  userId: {
    id: string;
    name: string;
    username?: string;
    profilePicture?: string | null;
  };
  text: string;
  createdAt: string;
}

export const addComment = async (projectId: string, text: string): Promise<{ message: string; comment: Comment }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/projects/${projectId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to add comment');
  }

  return data;
};

// Get project comments
export const getProjectComments = async (projectId: string): Promise<{ comments: Comment[] }> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/comments`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch comments');
  }
  return data;
};

// Delete comment
export const deleteComment = async (commentId: string): Promise<{ message: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete comment');
  }

  return data;
};

// Get activity feed
export interface Activity {
  _id: string;
  userId: {
    id: string;
    name: string;
    username?: string;
    profilePicture?: string | null;
  };
  type: 'follow' | 'like' | 'comment' | 'project_created' | 'profile_updated';
  targetUserId?: {
    id: string;
    name: string;
    username?: string;
    profilePicture?: string | null;
  };
  projectId?: {
    _id: string;
    title: string;
    image?: string | null;
  };
  createdAt: string;
}

export const getActivityFeed = async (limit: number = 20, page: number = 1): Promise<{ activities: Activity[] }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/activity?limit=${limit}&page=${page}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch activity feed');
  }

  return data;
};

// ==================== PORTFOLIO FEED API ====================

// Portfolio feed interfaces
export interface PortfolioFeedItem {
  user: {
    id: string;
    name: string;
    username?: string;
    profilePicture?: string | null;
    bannerImage?: string | null;
    about?: string;
  };
  projects: Array<{
    _id: string;
    title: string;
    image?: string | null;
  }>;
  stats: {
    projectsCount: number;
    educationCount: number;
    experienceCount: number;
    skillsCount: number;
    likesCount: number;
    commentsCount: number;
  };
}

export interface PortfolioFeedResponse {
  portfolios: PortfolioFeedItem[];
  page: number;
  limit: number;
  hasMore: boolean;
}

// Get portfolio feed
export const getPortfolioFeed = async (page: number = 1, limit: number = 10): Promise<PortfolioFeedResponse> => {
  const response = await fetch(`${API_URL}/feed/portfolios?page=${page}&limit=${limit}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch portfolio feed');
  }
  return data;
};

// Like a portfolio
export const likePortfolio = async (userId: string): Promise<{ message: string; likeCount: number }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/portfolios/${userId}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to like portfolio');
  }

  return data;
};

// Unlike a portfolio
export const unlikePortfolio = async (userId: string): Promise<{ message: string; likeCount: number }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/portfolios/${userId}/like`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to unlike portfolio');
  }

  return data;
};

// Check if portfolio is liked
export const getPortfolioLikeStatus = async (userId: string): Promise<{ isLiked: boolean }> => {
  const token = await getToken();
  if (!token) {
    return { isLiked: false };
  }

  const response = await fetch(`${API_URL}/portfolios/${userId}/like-status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data;
};

// Get portfolio likes count
export const getPortfolioLikes = async (userId: string): Promise<{ likeCount: number }> => {
  const response = await fetch(`${API_URL}/portfolios/${userId}/likes`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch likes');
  }
  return data;
};

// Portfolio comment interface
export interface PortfolioComment {
  _id: string;
  userId: {
    id: string;
    name: string;
    username?: string;
    profilePicture?: string | null;
  };
  text: string;
  createdAt: string;
}

// Comment on a portfolio
export const addPortfolioComment = async (userId: string, text: string): Promise<{ message: string; comment: PortfolioComment }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/portfolios/${userId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to add comment');
  }

  return data;
};

// Get portfolio comments
export const getPortfolioComments = async (userId: string): Promise<{ comments: PortfolioComment[] }> => {
  const response = await fetch(`${API_URL}/portfolios/${userId}/comments`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch comments');
  }
  return data;
};

// Delete portfolio comment
export const deletePortfolioComment = async (commentId: string): Promise<{ message: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/portfolios/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete comment');
  }

  return data;
};

// ==================== ANALYTICS API ====================

// Track profile view
export const trackView = async (userId: string, projectId?: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/analytics/track-view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, projectId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to track view');
  }

  return data;
};

// Get analytics data
export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  viewsByDay: Array<{ _id: string; count: number }>;
  viewsByDevice: Array<{ _id: string; count: number }>;
  viewsByReferrer: Array<{ _id: string; count: number }>;
  popularProjects: Array<{ projectId: string; title: string; views: number }>;
  period: string;
}

export const getAnalytics = async (period: 'day' | 'week' | 'month' = 'week', projectId?: string): Promise<AnalyticsData> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${API_URL}/analytics?period=${period}${projectId ? `&projectId=${projectId}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch analytics');
  }

  return data;
};

// Export analytics data
export const getAnalyticsExport = async (period: 'day' | 'week' | 'month' = 'month'): Promise<{ data: any[]; period: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/analytics/export?period=${period}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to export analytics');
  }

  return data;
};
