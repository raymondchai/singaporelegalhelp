'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle, Eye, ThumbsUp, User } from 'lucide-react';
import Link from 'next/link';

interface LegalQA {
  id: string;
  category_id: string;
  user_id: string | null;
  question: string;
  answer: string;
  ai_response: any | null;
  tags: string[];
  difficulty_level: string;
  is_featured: boolean;
  is_public: boolean;
  status: string;
  helpful_votes: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface LegalCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function QADetailPage() {
  const params = useParams();
  const router = useRouter();
  const [qa, setQA] = useState<LegalQA | null>(null);
  const [category, setCategory] = useState<LegalCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params?.slug as string;
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      fetchQA();
    }
  }, [id]);

  const fetchQA = async () => {
    try {
      setLoading(true);
      
      // Fetch the Q&A
      const { data: qaData, error: qaError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .eq('status', 'published')
        .single();

      if (qaError) {
        console.error('Error fetching Q&A:', qaError);
        setError('Q&A not found');
        return;
      }

      setQA(qaData);

      // Fetch the category
      const { data: categoryData, error: categoryError } = await supabase
        .from('legal_categories')
        .select('*')
        .eq('id', qaData.category_id)
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
      } else {
        setCategory(categoryData);
      }

      // Increment view count
      await supabase
        .from('legal_qa')
        .update({ view_count: qaData.view_count + 1 })
        .eq('id', id);

    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load Q&A');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Q&A...</p>
        </div>
      </div>
    );
  }

  if (error || !qa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Q&A Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The Q&A you are looking for does not exist.'}</p>
          <Link 
            href="/legal-categories"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href={`/legal-categories/${slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {category?.name || 'Category'}
          </Link>
        </div>

        {/* Q&A Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <MessageCircle className="w-4 h-4 mr-1" />
              Q&A
            </span>
            
            {category && (
              <span className="text-sm text-gray-600">{category.name}</span>
            )}
            
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(qa.difficulty_level)}`}>
              {qa.difficulty_level}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">{qa.question}</h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {qa.view_count + 1} views
            </div>
            <div className="flex items-center">
              <ThumbsUp className="w-4 h-4 mr-1" />
              {qa.helpful_votes} helpful votes
            </div>
          </div>
        </div>

        {/* Answer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Answer</h2>
          <div className="prose prose-lg max-w-none">
            {qa.answer
              .replace(/\\n/g, '\n') // Convert \\n to actual newlines
              .split('\n')
              .map((paragraph, index) => {
                if (paragraph.trim() === '') return null;

                const trimmedParagraph = paragraph.trim();

                // Handle bold headings **text:**
                if (trimmedParagraph.startsWith('**') && trimmedParagraph.includes(':**')) {
                  const headingText = trimmedParagraph.replace(/\*\*(.*?):\*\*/g, '$1');
                  return (
                    <h3
                      key={`heading-${index}`}
                      className="text-xl font-semibold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2"
                    >
                      {headingText}
                    </h3>
                  );
                }

                // Handle numbered lists
                if (/^\d+\./.test(trimmedParagraph)) {
                  return (
                    <div key={`numbered-${index}`} className="mb-3">
                      <p className="text-gray-700 leading-relaxed pl-4">
                        <span className="font-semibold text-blue-600 mr-2">
                          {trimmedParagraph.match(/^\d+\./)?.[0] || ''}
                        </span>
                        {trimmedParagraph.replace(/^\d+\.\s*/, '')}
                      </p>
                    </div>
                  );
                }

                // Handle bullet points
                if (trimmedParagraph.startsWith('-') || trimmedParagraph.startsWith('•')) {
                  return (
                    <div key={`bullet-${index}`} className="mb-2">
                      <p className="text-gray-700 leading-relaxed pl-6 relative">
                        <span className="absolute left-0 text-blue-600 font-bold">•</span>
                        {trimmedParagraph.replace(/^[-•]\s*/, '')}
                      </p>
                    </div>
                  );
                }

                // Handle bold text within paragraphs
                const formattedParagraph = trimmedParagraph
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

                // Regular paragraph
                if (trimmedParagraph.length > 0) {
                  return (
                    <p
                      key={`paragraph-${index}`}
                      className="mb-4 text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formattedParagraph }}
                    />
                  );
                }

                return null;
              })
              .filter(Boolean)}
          </div>
        </div>

        {/* Tags */}
        {qa.tags && qa.tags.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {qa.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
