'use client';

import { useState, useEffect } from 'react';
import { Clock, Star, Trash2, Edit2, Search, X } from 'lucide-react';

interface SearchHistoryEntry {
  id: string;
  query: string;
  results_count: number;
  filters_used?: Record<string, any>;
  search_timestamp: string;
  is_saved: boolean;
  saved_name?: string;
}

interface SearchHistoryProps {
  onQuerySelect: (query: string) => void;
  className?: string;
}

export default function SearchHistory({ onQuerySelect, className = '' }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [savedSearches, setSavedSearches] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadSearchHistory();
    loadSavedSearches();
  }, []);

  const loadSearchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search/history?limit=20', {
        headers: {
          'x-user-id': 'current-user-id' // This should come from auth context
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await fetch('/api/search/history?saved_only=true', {
        headers: {
          'x-user-id': 'current-user-id' // This should come from auth context
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const saveSearch = async (entry: SearchHistoryEntry) => {
    try {
      const response = await fetch('/api/search/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user-id'
        },
        body: JSON.stringify({
          id: entry.id,
          is_saved: true,
          saved_name: entry.query
        })
      });

      if (response.ok) {
        loadSearchHistory();
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const unsaveSearch = async (entry: SearchHistoryEntry) => {
    try {
      const response = await fetch('/api/search/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user-id'
        },
        body: JSON.stringify({
          id: entry.id,
          is_saved: false,
          saved_name: null
        })
      });

      if (response.ok) {
        loadSearchHistory();
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Failed to unsave search:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/search/history?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': 'current-user-id'
        }
      });

      if (response.ok) {
        loadSearchHistory();
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Failed to delete search entry:', error);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all search history? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/search/history?clear_all=true', {
        method: 'DELETE',
        headers: {
          'x-user-id': 'current-user-id'
        }
      });

      if (response.ok) {
        loadSearchHistory();
      }
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  const updateSavedName = async (id: string, newName: string) => {
    try {
      const response = await fetch('/api/search/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user-id'
        },
        body: JSON.stringify({
          id,
          saved_name: newName
        })
      });

      if (response.ok) {
        setEditingId(null);
        setEditName('');
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Failed to update saved search name:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderHistoryEntry = (entry: SearchHistoryEntry, isSaved: boolean = false) => (
    <div key={entry.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group">
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onQuerySelect(entry.query)}
          className="text-left w-full"
        >
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {editingId === entry.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => updateSavedName(entry.id, editName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateSavedName(entry.id, editName);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                    setEditName('');
                  }
                }}
                className="flex-1 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-gray-900 truncate">
                {isSaved && entry.saved_name ? entry.saved_name : entry.query}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(entry.search_timestamp)}
            </span>
            <span>{entry.results_count} results</span>
            {entry.filters_used && Object.keys(entry.filters_used).length > 0 && (
              <span>With filters</span>
            )}
          </div>
        </button>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isSaved ? (
          <>
            <button
              onClick={() => {
                setEditingId(entry.id);
                setEditName(entry.saved_name || entry.query);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Rename"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => unsaveSearch(entry)}
              className="p-1 text-gray-400 hover:text-yellow-600 rounded"
              title="Remove from saved"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          </>
        ) : (
          <button
            onClick={() => saveSearch(entry)}
            className="p-1 text-gray-400 hover:text-yellow-600 rounded"
            title="Save search"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => deleteEntry(entry.id)}
          className="p-1 text-gray-400 hover:text-red-600 rounded"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('recent')}
            className={`text-sm font-medium ${
              activeTab === 'recent' 
                ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recent Searches
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`text-sm font-medium ${
              activeTab === 'saved' 
                ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Saved Searches
          </button>
        </div>
        
        {activeTab === 'recent' && history.length > 0 && (
          <button
            onClick={clearAllHistory}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading search history...
          </div>
        ) : activeTab === 'recent' ? (
          history.length > 0 ? (
            <div className="p-2">
              {history.map(entry => renderHistoryEntry(entry, false))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No recent searches found
            </div>
          )
        ) : (
          savedSearches.length > 0 ? (
            <div className="p-2">
              {savedSearches.map(entry => renderHistoryEntry(entry, true))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No saved searches found
            </div>
          )
        )}
      </div>
    </div>
  );
}
