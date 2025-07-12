'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import TemplateCard from '@/components/optimized/TemplateCard';
import { TemplateGridSkeleton } from '@/components/optimized/SkeletonLoaders';
import { templateApi } from '@/lib/api-client';
import { logError, getErrorMessage } from '@/lib/error-handling';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layouts/page-layout';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  price_sgd: number;
  difficulty_level: 'basic' | 'intermediate' | 'advanced';
  estimated_time_minutes: number;
  singapore_compliant: boolean;
  legal_review_required: boolean;
  usage_count: number;
  view_count: number;
  file_size_formatted: string;
}

const CATEGORIES = [
  'All Categories',
  'Employment Law',
  'Property Law',
  'Corporate Law',
  'Family Law',
  'Contract Law',
  'Intellectual Property',
  'Personal Injury'
];

const SUBSCRIPTION_TIERS = [
  'All Tiers',
  'free',
  'basic',
  'premium',
  'enterprise'
];

const DIFFICULTY_LEVELS = [
  'All Levels',
  'basic',
  'intermediate',
  'advanced'
];

export default function DocumentBuilderPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedTier, setSelectedTier] = useState('All Tiers');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'All Categories') {
        params.append('category', selectedCategory);
      }
      if (selectedTier !== 'All Tiers') {
        params.append('subscription_tier', selectedTier);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const paramsObj: Record<string, any> = {};
      params.forEach((value, key) => {
        paramsObj[key] = value;
      });

      const response = await templateApi.getTemplates(paramsObj);

      if (response.success) {
        let filteredTemplates = response.data?.templates ?? [];

        // Filter by difficulty level
        if (selectedDifficulty !== 'All Levels') {
          filteredTemplates = filteredTemplates.filter(
            (template: Template) => template.difficulty_level === selectedDifficulty
          );
        }

        setTemplates(filteredTemplates);
      } else {
        const errorMsg = getErrorMessage(response.error);
        toast({
          title: "Error Loading Templates",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      logError(error, 'fetchTemplates', { selectedCategory, selectedTier, selectedDifficulty, searchTerm });
      toast({
        title: "Unexpected Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedTier, selectedDifficulty, searchTerm, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleTemplateSelect = (template: Template) => {
    // Check subscription access based on profile
    // Note: Using subscription_status from database (not subscription_tier)
    const userTier = profile?.subscription_status ?? 'free';

    // Define tier hierarchy: free < basic < premium < enterprise
    const tierHierarchy: Record<string, number> = { free: 0, basic: 1, premium: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[userTier] ?? 0;
    const requiredTierLevel = tierHierarchy[template.subscription_tier] ?? 0;

    // Check tier access (removed console.log to prevent hydration issues)

    if (userTierLevel < requiredTierLevel) {
      const requiredTier = template.subscription_tier.charAt(0).toUpperCase() + template.subscription_tier.slice(1);
      alert(`This template requires a ${requiredTier} subscription or higher. Please upgrade to access.`);
      return;
    }

    // Navigate to template customization
    router.push(`/document-builder/${template.id}`);
  };



  const breadcrumbs = [
    { name: 'Document Builder', href: '/document-builder', current: true }
  ];

  return (
    <PageLayout
      title="Legal Document Builder"
      subtitle="Create professional legal documents with our Singapore-compliant templates. Choose from our comprehensive library and customize to your needs."
      breadcrumbs={breadcrumbs}
      showNavigation={true}
      showHeader={true}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal Document Builder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create professional legal documents with our Singapore-compliant templates.
            Choose from our comprehensive library and customize to your needs.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search-templates" className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search-templates"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="category-select" className="block text-sm font-medium mb-2">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="tier-select" className="block text-sm font-medium mb-2">Subscription Tier</label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger id="tier-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {tier === 'All Tiers' ? tier : tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="difficulty-select" className="block text-sm font-medium mb-2">Difficulty</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger id="difficulty-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level === 'All Levels' ? level : level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {loading ? (
          <TemplateGridSkeleton count={9} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleTemplateSelect}
              />
            ))}
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
