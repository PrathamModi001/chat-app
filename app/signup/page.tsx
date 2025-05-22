'use client';

import { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signup, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await signup(email, name, phone);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto flex flex-col justify-center p-6">
        <Link href="/" className="flex items-center text-gray-600 mb-8 hover:text-gray-800">
          <FaArrowLeft className="mr-2" />
          <span>Back to home</span>
        </Link>
        
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">
            P
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">Periskope</h1>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create your account</h2>
        <p className="text-gray-600 mb-8">Join Periskope to start messaging</p>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-red-600 border border-red-200">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="text-center">
              <div className="mb-4 rounded bg-green-50 p-4 text-green-700 border border-green-200">
                <h3 className="font-bold mb-2">Account Created Successfully!</h3>
                <p>We've sent an email to <strong>{email}</strong> with instructions to set your password.</p>
                <p className="mt-2">Please check your inbox and follow the link to complete your registration.</p>
              </div>
              <Link 
                href="/login" 
                className="block w-full py-2.5 mt-4 text-center bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
        
        {!success && (
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 font-medium hover:text-green-800">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
} 