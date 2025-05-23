'use client';

import { useState, useEffect, Suspense } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
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
      <div className="flex min-h-screen bg-[#14213b] justify-center items-center">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold">
                P
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-6">Periskope</h1>
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
            </div>
            <p className="mt-4 text-center text-gray-600">Validating your request...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#14213b] justify-center items-center">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <Link href="/" className="flex items-center text-gray-700 mb-6 hover:text-gray-900">
            <FaArrowLeft className="mr-2" />
            <span>Back to home</span>
          </Link>
          
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold">
              P
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">Set Your Password</h2>
          <p className="text-gray-600 text-center mb-8">Create a secure password for your account</p>
          
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-red-600 text-center">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="text-center">
              <div className="mb-6 rounded-md bg-green-50 p-4 text-green-600">
                Password set successfully! Redirecting to login...
              </div>
            </div>
          ) : !tokenValid ? (
            <div className="text-center">
              <div className="mb-6 rounded-md bg-red-50 p-4 text-red-600">
                Invalid or expired token. Please request a new password reset.
              </div>
              <Link href="/signup" className="text-center block text-green-600 font-medium hover:text-green-700">
                Back to signup
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                {email && (
                  <div className="mb-6 text-center text-gray-600">
                    Setting password for: <span className="font-medium">{email}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-500"
                    placeholder="Create a password"
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-500"
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Setting password...' : 'Set Password'}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <Link href="/login" className="text-green-600 font-medium hover:text-green-700">
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// This is the page component that wraps SetPasswordForm with Suspense
export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#14213b] justify-center items-center">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold">
                P
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-6">Periskope</h1>
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    }> 
      <SetPasswordForm />
    </Suspense>
  );
} 