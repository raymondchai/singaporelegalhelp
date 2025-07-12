'use client';

import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchTerm {
  id: string;
  type: 'must' | 'should' | 'must_not';
  field: 'all' | 'title' | 'content' | 'category';
  value: string;
  operator: 'contains' | 'exact' | 'starts_with' | 'ends_with';
}

interface AdvancedSearchBuilderProps {
  onQueryChange: (query: string, terms: SearchTerm[]) => void;
  className?: string;
}

export default function AdvancedSearchBuilder({ onQueryChange, className = '' }: AdvancedSearchBuilderProps) {
  const [terms, setTerms] = useState<SearchTerm[]>([
    {
      id: '1',
      type: 'must',
      field: 'all',
      value: '',
      operator: 'contains'
    }
  ]);
  const [showHelp, setShowHelp] = useState(false);

  const addTerm = () => {
    const newTerm: SearchTerm = {
      id: Date.now().toString(),
      type: 'must',
      field: 'all',
      value: '',
      operator: 'contains'
    };
    setTerms([...terms, newTerm]);
  };

  const removeTerm = (id: string) => {
    if (terms.length > 1) {
      setTerms(terms.filter(term => term.id !== id));
    }
  };

  const updateTerm = (id: string, updates: Partial<SearchTerm>) => {
    setTerms(terms.map(term => 
      term.id === id ? { ...term, ...updates } : term
    ));
  };

  const buildQuery = () => {
    const queryParts: string[] = [];
    
    terms.forEach(term => {
      if (!term.value.trim()) return;
      
      let searchValue = term.value.trim();
      
      // Handle different operators
      switch (term.operator) {
        case 'exact':
          searchValue = `"${searchValue}"`;
          break;
        case 'starts_with':
          searchValue = `${searchValue}*`;
          break;
        case 'ends_with':
          searchValue = `*${searchValue}`;
          break;
        // 'contains' is default, no modification needed
      }
      
      // Handle field-specific search
      if (term.field !== 'all') {
        searchValue = `${term.field}:${searchValue}`;
      }
      
      // Handle boolean operators
      switch (term.type) {
        case 'must':
          queryParts.push(`+${searchValue}`);
          break;
        case 'should':
          queryParts.push(searchValue);
          break;
        case 'must_not':
          queryParts.push(`-${searchValue}`);
          break;
      }
    });
    
    const finalQuery = queryParts.join(' ');
    onQueryChange(finalQuery, terms);
  };

  // Update query whenever terms change
  React.useEffect(() => {
    buildQuery();
  }, [terms]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'must': return 'Must contain';
      case 'should': return 'Should contain';
      case 'must_not': return 'Must not contain';
      default: return type;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'all': return 'All fields';
      case 'title': return 'Title only';
      case 'content': return 'Content only';
      case 'category': return 'Category only';
      default: return field;
    }
  };

  const getOperatorLabel = (operator: string) => {
    switch (operator) {
      case 'contains': return 'Contains';
      case 'exact': return 'Exact phrase';
      case 'starts_with': return 'Starts with';
      case 'ends_with': return 'Ends with';
      default: return operator;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Advanced Search Builder</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h4 className="font-medium text-blue-900 mb-2">Search Tips:</h4>
            <ul className="space-y-1 text-blue-800">
              <li>• <strong>Must contain:</strong> Results must include this term</li>
              <li>• <strong>Should contain:</strong> Results preferably include this term</li>
              <li>• <strong>Must not contain:</strong> Results must exclude this term</li>
              <li>• <strong>Exact phrase:</strong> Search for the exact phrase in quotes</li>
              <li>• <strong>Wildcards:</strong> Use * for partial matching</li>
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {terms.map((term, index) => (
            <div key={term.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              {index > 0 && (
                <span className="text-sm font-medium text-gray-500 min-w-[30px]">
                  AND
                </span>
              )}
              
              <select
                value={term.type}
                onChange={(e) => updateTerm(term.id, { type: e.target.value as SearchTerm['type'] })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[140px]"
              >
                <option value="must">Must contain</option>
                <option value="should">Should contain</option>
                <option value="must_not">Must not contain</option>
              </select>
              
              <select
                value={term.field}
                onChange={(e) => updateTerm(term.id, { field: e.target.value as SearchTerm['field'] })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[120px]"
              >
                <option value="all">All fields</option>
                <option value="title">Title only</option>
                <option value="content">Content only</option>
                <option value="category">Category only</option>
              </select>
              
              <select
                value={term.operator}
                onChange={(e) => updateTerm(term.id, { operator: e.target.value as SearchTerm['operator'] })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[120px]"
              >
                <option value="contains">Contains</option>
                <option value="exact">Exact phrase</option>
                <option value="starts_with">Starts with</option>
                <option value="ends_with">Ends with</option>
              </select>
              
              <input
                type="text"
                value={term.value}
                onChange={(e) => updateTerm(term.id, { value: e.target.value })}
                placeholder="Enter search term..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addTerm}
                  className="p-2"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                
                {terms.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTerm(term.id)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Query Preview */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Query:</h4>
          <code className="text-sm text-gray-800 break-all">
            {terms.filter(t => t.value.trim()).length > 0 
              ? terms.filter(t => t.value.trim()).map(term => {
                  let searchValue = term.value.trim();
                  
                  switch (term.operator) {
                    case 'exact':
                      searchValue = `"${searchValue}"`;
                      break;
                    case 'starts_with':
                      searchValue = `${searchValue}*`;
                      break;
                    case 'ends_with':
                      searchValue = `*${searchValue}`;
                      break;
                  }
                  
                  if (term.field !== 'all') {
                    searchValue = `${term.field}:${searchValue}`;
                  }
                  
                  switch (term.type) {
                    case 'must':
                      return `+${searchValue}`;
                    case 'should':
                      return searchValue;
                    case 'must_not':
                      return `-${searchValue}`;
                    default:
                      return searchValue;
                  }
                }).join(' ')
              : 'Enter search terms to see the generated query'
            }
          </code>
        </div>

        {/* Quick Examples */}
        <div className="mt-4 text-xs text-gray-600">
          <h4 className="font-medium mb-1">Quick Examples:</h4>
          <ul className="space-y-1">
            <li>• <code>+employment -termination</code> - Must contain "employment" but not "termination"</li>
            <li>• <code>"company incorporation"</code> - Exact phrase search</li>
            <li>• <code>title:contract content:dispute</code> - "contract" in title and "dispute" in content</li>
            <li>• <code>employ*</code> - Words starting with "employ" (employment, employee, etc.)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
