'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import SearchResultCard from './SearchResultCard';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'qa';
  category_name: string;
  category_id: string;
  difficulty?: string;
  relevance_score: number;
  highlight?: string;
  created_at: string;
}

interface HeaderSearchProps {
  placeholder?: string;
  className?: string;
}

export default function HeaderSearch({ 
  placeholder = "Search legal content...",
  className = ""
}: HeaderSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform quick search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performQuickSearch(debouncedQuery);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [debouncedQuery]);

  const performQuickSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        limit: '5' // Limit to 5 results for header
      });

      const response = await fetch(`/api/search/global?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setResults(data.results);
        setShowResults(data.results.length > 0);
      } else {
        console.error('Search error:', data.error);
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
      setQuery('');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
  };

  const handleViewAllResults = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) {
                setShowResults(true);
              }
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
      </form>

      {/* Quick Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <>
              <div className="p-2 space-y-1">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="p-3 hover:bg-gray-50 rounded-md cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            result.type === 'article' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {result.type === 'article' ? 'Article' : 'Q&A'}
                          </span>
                          <span className="text-xs text-gray-500">{result.category_name}</span>
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {result.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {result.content.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* View All Results Button */}
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={handleViewAllResults}
                  className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all results for "{query}"
                </button>
              </div>
            </>
          ) : query.length >= 2 && !loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
