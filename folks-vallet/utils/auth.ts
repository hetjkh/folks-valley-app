const API_URL = 'https://folks-valley-backend.onrender.com/api';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Store token in localStorage
export const storeToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

// Get token from localStorage
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Remove token
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// Register user
export const registerUser = async (
  name: string,
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, username, email, password, confirmPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  if (data.token) {
    storeToken(data.token);
  }

  return data;
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  if (data.token) {
    storeToken(data.token);
  }

  return data;
};

// Get current user
export const getCurrentUser = async (): Promise<{ user: User }> => {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    removeToken();
    throw new Error(data.error || 'Authentication failed');
  }

  return data;
};

// Logout
export const logout = (): void => {
  removeToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

// Track profile view
export const trackView = async (userId: string, projectId?: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/analytics/track-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, projectId }),
    });
    // Silently fail - don't show errors to users
  } catch (error) {
    console.error('Failed to track view:', error);
  }
};
