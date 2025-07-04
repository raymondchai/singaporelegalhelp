'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection from client...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

      // Fetch all categories
      const { data, error } = await supabase
        .from('legal_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      console.log('Categories query result:', { data, error })

      if (error) {
        setError(error.message)
        console.error('Supabase error:', error)
      } else {
        setCategories(data || [])
        console.log('Categories set:', data?.length || 0)
      }
    } catch (err) {
      console.error('Catch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug Page</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Environment Variables:</h2>
        <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-semibold">Error:</h2>
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Categories Found: {categories.length}</h2>
      </div>

      <div className="grid gap-4">
        {categories.map((category, index) => (
          <div key={category.id || index} className="p-4 border rounded">
            <h3 className="font-semibold">{category.name}</h3>
            <p className="text-sm text-gray-600">{category.description}</p>
            <p className="text-xs text-gray-500">
              ID: {category.id} | Active: {category.is_active ? 'Yes' : 'No'} | Order: {category.sort_order}
            </p>
          </div>
        ))}
      </div>

      {categories.length === 0 && !error && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          No categories found, but no error occurred.
        </div>
      )}
    </div>
  )
}
