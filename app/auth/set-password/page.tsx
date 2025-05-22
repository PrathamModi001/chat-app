'use client';

import { useState, useEffect, Suspense } from 'react';
import { FaLock } from 'react-icons/fa';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

// This is the new component that will contain the form logic
function SetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const { setPassword: setUserPassword, loading } = useAuth();

  useEffect(() => {
    if (!email) {
      setError('Email is required. Please try signing up again.');
      setValidatingToken(false);
      return;
    }

    if (!token) {
      setError('Invalid or missing token. Please use the link from your email.');
      setValidatingToken(false);
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        const response = await fetch('/api/auth/validate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Invalid token');
        }
        
        setTokenValid(true);
      } catch (err: any) {
        setError(err.message || 'Token validation failed');
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [email, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setError('');
    
    try {
      if (!email || !token) {
        throw new Error('Email and token are required');
      }
      
      await setUserPassword(email, password, token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  if (validatingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Periskope</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Validating your request...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Periskope</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Set your password</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-700 dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="text-center">
              <div className="mb-4 rounded bg-green-100 p-3 text-green-700 dark:bg-green-900 dark:text-green-100">
                Password set successfully! Redirecting to login...
              </div>
            </div>
          ) : !tokenValid ? (
            <div className="text-center">
              <div className="mb-4 rounded bg-red-100 p-3 text-red-700 dark:bg-red-900 dark:text-red-100">
                Invalid or expired token. Please request a new password reset.
              </div>
              <Link href="/signup" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
                Back to signup
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {email && (
                <div className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Setting password for: <span className="font-medium">{email}</span>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 pl-10 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="Create password"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 pl-10 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="Confirm password"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-md bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {loading ? 'Setting password...' : 'Set Password'}
              </button>
            </form>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// This is the page component that wraps SetPasswordForm with Suspense
export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading page...</div>}> 
      <SetPasswordForm />
    </Suspense>
  );
} 