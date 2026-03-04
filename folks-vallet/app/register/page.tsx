'use client';

import { getCurrentUser, isAuthenticated, registerUser } from '@/utils/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (isAuthenticated()) {
        await getCurrentUser();
        router.push('/');
        return;
      }
    } catch (error) {
      // Not authenticated
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate username format
    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      setError('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    if (username.length < 3 || username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerUser(name, username.toLowerCase(), email, password, confirmPassword);
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#080808] text-[#cfcfcf]">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Sign up to get started</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#1d1d1d] border border-[#ffffff20] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#2563eb]"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full px-4 py-3 bg-[#1d1d1d] border border-[#ffffff20] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#2563eb]"
              placeholder="Enter your username"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Only lowercase letters, numbers, and underscores
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#1d1d1d] border border-[#ffffff20] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#2563eb]"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1d1d1d] border border-[#ffffff20] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#2563eb]"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1d1d1d] border border-[#ffffff20] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#2563eb]"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2563eb] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#2563eb] hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
