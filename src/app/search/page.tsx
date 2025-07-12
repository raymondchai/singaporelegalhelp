'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GlobalSearch from '@/components/search/GlobalSearch';
import { PageLayout } from '@/components/layouts/page-layout';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [popularSearchQuery, setPopularSearchQuery] = useState('');
  const [urlQuery, setUrlQuery] = useState('');

  // Handle URL parameters on page load
  useEffect(() => {
    const queryParam = searchParams?.get('q');
    if (queryParam) {
      setUrlQuery(queryParam);
      // Clear popular search query if URL query exists
      setPopularSearchQuery('');
    }
  }, [searchParams]);

  const handlePopularSearch = (term: string) => {
    setPopularSearchQuery(term);
    setUrlQuery(''); // Clear URL query when popular search is clicked
  };

  const breadcrumbs = [
    { name: 'Search', href: '/search', current: true }
  ];

  return (
    <PageLayout
      title="Search Legal Content"
      subtitle="Find comprehensive legal articles and expert Q&As across all Singapore legal practice areas"
      breadcrumbs={breadcrumbs}
      showNavigation={true}
      showHeader={true}
      containerClassName="max-w-6xl"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Search Legal Content
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find comprehensive legal articles and expert Q&As across all Singapore legal practice areas
          </p>
        </div>

        {/* Global Search Component */}
        <GlobalSearch
          initialQuery={urlQuery || popularSearchQuery}
          onQueryChange={() => {
            setPopularSearchQuery('');
            setUrlQuery('');
          }}
        />

        {/* Popular Searches */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Popular Searches</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {[
              'company incorporation',
              'employment termination',
              'property purchase',
              'divorce procedure',
              'criminal defense',
              'work permit',
              'contract disputes',
              'intellectual property',
              'tax compliance',
              'immigration law',
              'family law',
              'employment rights'
            ].map((term) => (
              <button
                key={term}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-full text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
                onClick={() => handlePopularSearch(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Search Tips */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Search Tips</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔍 Search Techniques</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use specific legal terms for better results</li>
                <li>• Try different keywords if no results found</li>
                <li>• Use filters to narrow down by practice area</li>
                <li>• Search works across article titles and content</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📚 Content Types</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Articles:</strong> Comprehensive legal guides</li>
                <li>• <strong>Q&As:</strong> Quick answers to common questions</li>
                <li>• Filter by difficulty: Beginner, Intermediate, Advanced</li>
                <li>• All content reviewed by legal experts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function SearchPage() {
  return <SearchPageContent />;
}
