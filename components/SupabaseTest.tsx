'use client';

import { useState } from 'react';

export function SupabaseTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSupabaseConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      
      setResult(data);
    } catch (err) {
      console.error('Error testing Supabase connection:', err);
      setError('Failed to test Supabase connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-neutral-800">
      <h2 className="text-xl font-semibold mb-4">Test Supabase Connection</h2>
      
      <button
        onClick={testSupabaseConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Result:</h3>
          <pre className="p-3 bg-gray-100 rounded overflow-auto text-sm dark:bg-neutral-900">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 