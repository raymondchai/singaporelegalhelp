'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import SearchResultCard from './SearchResultCard';
import AdvancedSearchFilters from './AdvancedSearchFilters';

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

interface SearchFilters {
  category?: string;
  difficulty?: string;
  content_type?: 'article' | 'qa' | 'all';
  reading_time?: string;
  date_range?: string;
}

interface SearchPagination {
  current_page: number;
  total_pages: number;
  total_results: number;
  results_per_page: number;
  has_next: boolean;
  has_prev: boolean;
  next_page: number | null;
  prev_page: number | null;
}

interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  current_page: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
  results_per_page: number;
  query: string;
  response_time_ms: number;
  pagination: SearchPagination;
  filters: SearchFilters;
  error?: string;
}

interface GlobalSearchProps {
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
}

export default function GlobalSearch({ initialQuery = '', onQueryChange }: GlobalSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    content_type: 'all'
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [pagination, setPagination] = useState<SearchPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(20);

  const debouncedQuery = useDebounce(query, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle initial query
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setCurrentPage(1); // Reset to first page on new search
      performSearch(debouncedQuery, 1);
    } else {
      setResults([]);
      setTotalCount(0);
      setPagination(null);
    }
  }, [debouncedQuery, filters]);

  // Handle page changes
  useEffect(() => {
    if (debouncedQuery.length >= 2 && currentPage > 1) {
      performSearch(debouncedQuery, currentPage);
    }
  }, [currentPage]);

  // Get search suggestions
  useEffect(() => {
    if (query.length >= 2) {
      getSuggestions(query);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const performSearch = async (searchQuery: string, page: number = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * resultsPerPage;
      const params = new URLSearchParams({
        query: searchQuery,
        limit: resultsPerPage.toString(),
        offset: offset.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.content_type && { content_type: filters.content_type }),
        ...(filters.reading_time && { reading_time: filters.reading_time }),
        ...(filters.date_range && { date_range: filters.date_range })
      });

      const response = await fetch(`/api/search/global?${params}`);
      const data: SearchResponse = await response.json();

      if (response.ok) {
        setResults(data.results);
        setTotalCount(data.total_count);
        setResponseTime(data.response_time_ms);
        setPagination(data.pagination);
      } else {
        console.error('Search error:', data.error);
        setResults([]);
        setTotalCount(0);
        setPagination(null);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setTotalCount(0);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch('/api/search/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions?.length > 0);
    } catch (error) {
      console.error('Suggestions failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setTotalCount(0);
    setFilters({ content_type: 'all' });
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const newQuery = e.target.value;
              setQuery(newQuery);
              setShowSuggestions(newQuery.length >= 2);
              onQueryChange?.(newQuery);
            }}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search legal articles and Q&As..."
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              >
                <Search className="inline w-4 h-4 mr-2 text-gray-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}


      </div>

      {/* Advanced Search Filters */}
      <div className="mt-4">
        <AdvancedSearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters({})}
          resultCount={totalCount}
        />
      </div>

      {/* Search Results */}
      {query.length >= 2 && (
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto" />
              <p className="mt-2 text-gray-600">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Found {totalCount} result{totalCount !== 1 ? 's' : ''} for "{query}"
                </p>
                <p className="text-xs text-gray-500">
                  {responseTime}ms
                </p>
              </div>
              
              {results.map((result) => (
                <SearchResultCard
                  key={`${result.type}-${result.id}`}
                  result={result}
                  onResultClick={(clickedResult) => {
                    // Track result click for analytics
                    fetch('/api/search/analytics', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        query: query.trim(),
                        clicked_result_id: clickedResult.id,
                        clicked_result_type: clickedResult.type
                      })
                    }).catch(console.error);
                  }}
                />
              ))}

              {/* Pagination Controls */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      Showing {((pagination.current_page - 1) * pagination.results_per_page) + 1} to{' '}
                      {Math.min(pagination.current_page * pagination.results_per_page, pagination.total_results)} of{' '}
                      {pagination.total_results} results
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(pagination.prev_page!)}
                      disabled={!pagination.has_prev}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.current_page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.current_page >= pagination.total_pages - 2) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = pagination.current_page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              pageNum === pagination.current_page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(pagination.next_page!)}
                      disabled={!pagination.has_next}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : query.length >= 2 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No results found for "{query}"</p>
              <p className="text-sm text-gray-500 mt-1">
                Try different keywords or remove filters
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
