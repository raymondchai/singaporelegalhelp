'use client';

import Link from 'next/link';
import { FileText, MessageCircle, Clock, Star } from 'lucide-react';

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

interface SearchResultCardProps {
  result: SearchResult;
  onResultClick?: (result: SearchResult) => void;
}

export default function SearchResultCard({ result, onResultClick }: SearchResultCardProps) {
  const getResultUrl = () => {
    const categorySlug = result.category_name.toLowerCase().replace(/\s+/g, '-');
    if (result.type === 'article') {
      return `/legal-categories/${categorySlug}/articles/${result.id}`;
    } else {
      return `/legal-categories/${categorySlug}/qa/${result.id}`;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClick = () => {
    if (onResultClick) {
      onResultClick(result);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Result Type and Category */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {result.type === 'article' ? (
                <FileText className="w-4 h-4 text-blue-600" />
              ) : (
                <MessageCircle className="w-4 h-4 text-green-600" />
              )}
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                result.type === 'article' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {result.type === 'article' ? 'Article' : 'Q&A'}
              </span>
            </div>
            
            <span className="text-sm text-gray-500">{result.category_name}</span>
            
            {result.difficulty && (
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(result.difficulty)}`}>
                {result.difficulty}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors">
            <Link href={getResultUrl()} onClick={handleClick}>
              {result.title}
            </Link>
          </h3>
          
          {/* Content Preview */}
          <div className="text-gray-600 text-sm mb-3">
            {result.highlight ? (
              <div 
                dangerouslySetInnerHTML={{ __html: result.highlight }} 
                className="search-highlight"
              />
            ) : (
              <p>{result.content.substring(0, 200)}...</p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(result.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>Relevance: {(result.relevance_score * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="ml-4 flex-shrink-0">
          <Link
            href={getResultUrl()}
            onClick={handleClick}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
}

// CSS for search highlighting (add to global styles)
export const searchHighlightStyles = `
.search-highlight mark,
.search-highlight b {
  background-color: #fef3c7;
  color: #92400e;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}
`;
