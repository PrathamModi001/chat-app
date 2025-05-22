'use client';

import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not authenticated and not loading, redirect to login
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // If still loading or no user, show loading state
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Profile</h1>
          <Link 
            href="/chats" 
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Back to Chats
          </Link>
        </div>
      </header>
      
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{user.fullName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</h3>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</h3>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{user.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
              <button
                onClick={logout}
                className="w-full rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 