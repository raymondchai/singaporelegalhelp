'use client';

import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, Clock, BookOpen, GraduationCap, Calendar } from 'lucide-react';

interface SearchFilters {
  category?: string;
  difficulty?: string;
  content_type?: 'article' | 'qa' | 'all';
  reading_time?: string;
  date_range?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  resultCount?: number;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'Easy to understand, basic concepts' },
  { value: 'intermediate', label: 'Intermediate', description: 'Moderate complexity, some legal knowledge helpful' },
  { value: 'advanced', label: 'Advanced', description: 'Complex topics, legal expertise recommended' }
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Content', description: 'Articles and Q&As' },
  { value: 'article', label: 'Articles', description: 'Comprehensive legal guides' },
  { value: 'qa', label: 'Q&As', description: 'Quick answers to common questions' }
];

const READING_TIME_OPTIONS = [
  { value: 'all', label: 'Any Length', description: 'All reading times' },
  { value: '0-10', label: 'Quick Read', description: 'Under 10 minutes' },
  { value: '10-20', label: 'Medium Read', description: '10-20 minutes' },
  { value: '20-30', label: 'Long Read', description: '20+ minutes' }
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time', description: 'No date filter' },
  { value: 'week', label: 'Past Week', description: 'Last 7 days' },
  { value: 'month', label: 'Past Month', description: 'Last 30 days' },
  { value: 'quarter', label: 'Past Quarter', description: 'Last 3 months' },
  { value: 'year', label: 'Past Year', description: 'Last 12 months' }
];

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  resultCount
}: AdvancedSearchFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.difficulty && filters.difficulty !== 'all') count++;
    if (filters.content_type && filters.content_type !== 'all') count++;
    if (filters.reading_time && filters.reading_time !== 'all') count++;
    if (filters.date_range && filters.date_range !== 'all') count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === 'all' ? undefined : value
    };
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex items-center gap-3">
          {resultCount !== undefined && (
            <span className="text-sm text-gray-600">
              {resultCount.toLocaleString()} results
            </span>
          )}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Practice Area Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <BookOpen className="w-4 h-4" />
              Practice Area
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                onClick={() => updateFilter('category', 'all')}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  !filters.category || filters.category === 'all'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">All Areas</div>
                <div className="text-xs text-gray-500">No filter</div>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => updateFilter('category', category.name)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    filters.category === category.name
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{category.name}</div>
                  <div className="text-xs text-gray-500 truncate">{category.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Type Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <BookOpen className="w-4 h-4" />
              Content Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('content_type', option.value as any)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    (!filters.content_type && option.value === 'all') || filters.content_type === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <GraduationCap className="w-4 h-4" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => updateFilter('difficulty', 'all')}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  !filters.difficulty || filters.difficulty === 'all'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">All Levels</div>
                <div className="text-xs text-gray-500">No filter</div>
              </button>
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('difficulty', option.value)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    filters.difficulty === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reading Time Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Clock className="w-4 h-4" />
              Reading Time
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {READING_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('reading_time', option.value)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    (!filters.reading_time && option.value === 'all') || filters.reading_time === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4" />
              Date Published
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {DATE_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('date_range', option.value)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    (!filters.date_range && option.value === 'all') || filters.date_range === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
