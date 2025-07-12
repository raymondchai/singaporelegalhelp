'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Edit, Trash2, Eye, Plus, FileText } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  status: 'draft' | 'under_review' | 'approved' | 'published' | 'archived';
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  price_sgd: number;
  difficulty_level: 'basic' | 'intermediate' | 'advanced';
  usage_count: number;
  file_size: string;
  last_updated: string;
  singapore_compliant: boolean;
  legal_review_required: boolean;
}

interface TemplateListComponentProps {
  onCreateNew: () => void;
}

const TemplateListComponent: React.FC<TemplateListComponentProps> = ({ onCreateNew }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const mockTemplates: Template[] = [
    {
      id: '1',
      title: 'Employment Contract - Singapore',
      category: 'employment',
      subcategory: 'Full-time Employment',
      status: 'published',
      subscription_tier: 'free',
      price_sgd: 0,
      difficulty_level: 'basic',
      usage_count: 145,
      file_size: '45 KB',
      last_updated: '2025-01-05',
      singapore_compliant: true,
      legal_review_required: true
    },
    {
      id: '2',
      title: 'Non-Disclosure Agreement (NDA)',
      category: 'business',
      subcategory: 'Confidentiality',
      status: 'published',
      subscription_tier: 'basic',
      price_sgd: 15.00,
      difficulty_level: 'intermediate',
      usage_count: 89,
      file_size: '32 KB',
      last_updated: '2025-01-04',
      singapore_compliant: true,
      legal_review_required: true
    },
    {
      id: '3',
      title: 'Tenancy Agreement - HDB',
      category: 'property',
      subcategory: 'Residential Rental',
      status: 'under_review',
      subscription_tier: 'premium',
      price_sgd: 25.00,
      difficulty_level: 'advanced',
      usage_count: 67,
      file_size: '58 KB',
      last_updated: '2025-01-03',
      singapore_compliant: true,
      legal_review_required: true
    },
    {
      id: '4',
      title: 'Service Agreement Template',
      category: 'business',
      subcategory: 'Service Agreements',
      status: 'draft',
      subscription_tier: 'basic',
      price_sgd: 20.00,
      difficulty_level: 'intermediate',
      usage_count: 54,
      file_size: '41 KB',
      last_updated: '2025-01-02',
      singapore_compliant: false,
      legal_review_required: true
    },
    {
      id: '5',
      title: 'Partnership Agreement',
      category: 'business',
      subcategory: 'Partnerships',
      status: 'approved',
      subscription_tier: 'premium',
      price_sgd: 35.00,
      difficulty_level: 'advanced',
      usage_count: 43,
      file_size: '67 KB',
      last_updated: '2025-01-01',
      singapore_compliant: true,
      legal_review_required: true
    }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/templates');

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
      setFilteredTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fallback to mock data if API fails
      setTemplates(mockTemplates);
      setFilteredTemplates(mockTemplates);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.subcategory?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(template => template.status === selectedStatus);
    }

    // Tier filter
    if (selectedTier !== 'all') {
      filtered = filtered.filter(template => template.subscription_tier === selectedTier);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, selectedStatus, selectedTier]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'employment', label: 'Employment Law' },
    { value: 'business', label: 'Business' },
    { value: 'property', label: 'Property Law' },
    { value: 'family', label: 'Family Law' },
    { value: 'corporate', label: 'Corporate Law' }
  ];

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  const tiers = [
    { value: 'all', label: 'All Tiers' },
    { value: 'free', label: 'Free' },
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tiers.map(tier => (
                <option key={tier.value} value={tier.value}>{tier.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {filteredTemplates.length} of {templates.length} templates
          </span>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {template.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {template.subcategory} • {template.file_size}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {template.category.replace('_', ' ')}
                    </div>
                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(template.difficulty_level)}`}>
                      {template.difficulty_level}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(template.status)}`}>
                      {template.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTierColor(template.subscription_tier)}`}>
                      {template.subscription_tier}
                    </span>
                    {template.price_sgd > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        ${template.price_sgd.toFixed(2)} SGD
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.usage_count} downloads
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {template.singapore_compliant && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          SG Compliant
                        </span>
                      )}
                      {template.legal_review_required && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Legal Review
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        title="Preview Template"
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        title="Edit Template"
                        className="text-green-600 hover:text-green-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        title="Download Template"
                        className="text-purple-600 hover:text-purple-800 p-1"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        title="Delete Template"
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedTier !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first template.'}
            </p>
            <div className="mt-6">
              <button
                onClick={onCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateListComponent;
