'use client';

import { getCurrentUser, isAuthenticated, logout } from '@/utils/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (isAuthenticated()) {
        const data = await getCurrentUser();
        setUser(data.user);
      }
    } catch (error) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] text-[#cfcfcf]">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-4xl font-bold leading-10 tracking-tight text-white">
            Portfolio Platform
          </h1>
          <p className="max-w-md text-lg leading-8 text-gray-400">
            Create and share your portfolio. View profiles, like projects, and connect with others.
          </p>

          {user ? (
            <div className="flex flex-col gap-4 w-full mt-8">
              <div className="p-4 bg-[#1d1d1d] border border-[#ffffff20] rounded-lg">
                <p className="text-white mb-2">Welcome back, <span className="font-semibold">{user.name}</span>!</p>
                <div className="flex gap-3 mt-4">
                  <Link
                    href={`/profile/${user.username || user.id}`}
                    className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-center"
                  >
                    View My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-[#1d1d1d] border border-[#ffffff20] text-white rounded-lg hover:bg-[#272727] transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-base font-medium sm:flex-row mt-8">
              <Link
                href="/login"
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#2563eb] px-5 text-white transition-colors hover:bg-[#1d4ed8] md:w-[158px]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex h-12 w-full items-center justify-center rounded-full border border-[#ffffff20] px-5 text-white transition-colors hover:bg-[#1d1d1d] md:w-[158px]"
              >
                Sign Up
              </Link>
            </div>
          )}

          <div className="mt-12 w-full">
            <h2 className="text-2xl font-semibold text-white mb-4">Explore Portfolios</h2>
            <p className="text-gray-400 mb-4">
              Visit profiles using: <code className="bg-[#1d1d1d] px-2 py-1 rounded">https://folks-valley-web.vercel.app/profile/username</code>
            </p>
            <p className="text-sm text-gray-500">
              Sign in to like, comment, and follow other users!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
