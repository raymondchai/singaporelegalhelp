'use client';

import { createClient } from '@supabase/supabase-js';

export default function SimpleTest() {
  const testConnection = () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('Environment check:', {
        url: supabaseUrl ? 'Found' : 'Missing',
        key: supabaseKey ? 'Found' : 'Missing'
      });
      
      if (!supabaseUrl || !supabaseKey) {
        alert('Environment variables not found. Check console for details.');
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      alert('Supabase client created successfully!');
      console.log('Supabase client:', supabase);
    } catch (error) {
      console.error('Connection error:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Supabase Test</h1>
      <div className="space-y-4">
        <button 
          onClick={testConnection} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Connection
        </button>
        <div>
          <a 
            href="/debug" 
            className="text-blue-500 hover:underline"
          >
            ← Back to Debug Page
          </a>
        </div>
      </div>
    </div>
  );
}
