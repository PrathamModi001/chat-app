import Link from 'next/link';
import Image from 'next/image';
import { FaComments, FaUserFriends, FaMobile, FaShieldAlt } from 'react-icons/fa';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">P</div>
            <h1 className="text-2xl font-semibold text-gray-800">Periskope</h1>
          </div>
          <div className="flex space-x-3">
            <Link 
              href="/login" 
              className="px-4 py-2 text-gray-700 rounded hover:bg-gray-100 border border-gray-300"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Business messaging that connects and converts</h2>
          <p className="text-lg text-gray-600 mb-8">
            Periskope helps teams communicate with customers and partners through a simple, secure messaging platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/signup" 
              className="px-5 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Get Started
            </Link>
            <Link 
              href="/chats" 
              className="px-5 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium"
            >
              View Demo
            </Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">P</div>
              <span className="font-medium">Periskope Chat</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                <p className="text-gray-800">Hi there! Welcome to Periskope.</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3 ml-auto max-w-xs">
                <p className="text-gray-800">Hello! How can I start using this platform?</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                <p className="text-gray-800">Just sign up to get started with your team!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose Periskope?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <FaComments size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
              <p className="text-gray-600">Connect with your team and customers instantly</p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <FaUserFriends size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-gray-600">Work together seamlessly across departments</p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <FaMobile size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile Ready</h3>
              <p className="text-gray-600">Access your chats from any device, anywhere</p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <FaShieldAlt size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">End-to-end encryption to protect your data</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
