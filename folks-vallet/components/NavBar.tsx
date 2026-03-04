'use client';

import { getCurrentUser, isAuthenticated, logout } from '@/utils/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
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

  // Don't show navbar on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-[#1d1d1d] border-b border-[#ffffff20] px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white hover:text-gray-300 transition-colors">
          Portfolio Platform
        </Link>
        <div className="flex gap-4 items-center">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : user ? (
            <>
              <Link
                href={`/profile/${user.username || user.id}`}
                className="text-gray-300 hover:text-white transition-colors"
              >
                My Profile
              </Link>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300">{user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#1d1d1d] border border-[#ffffff20] text-white rounded-lg hover:bg-[#272727] transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
