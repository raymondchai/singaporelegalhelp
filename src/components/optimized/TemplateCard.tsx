'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Download, Eye } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
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

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'free': return 'bg-green-100 text-green-800 border-green-200';
    case 'basic': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'enterprise': return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'basic': return 'bg-green-100 text-green-800 border-green-200';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const TemplateCard = memo<TemplateCardProps>(({ template, onSelect }) => {
  const handleSelect = () => {
    onSelect(template);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <Badge className={getTierColor(template.subscription_tier)}>
              {template.subscription_tier.toUpperCase()}
            </Badge>
            <Badge className={getDifficultyColor(template.difficulty_level)}>
              {template.difficulty_level.toUpperCase()}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg">{template.title}</CardTitle>
        <CardDescription className="text-sm">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {template.estimated_time_minutes} min
            </span>
            <span>{template.file_size_formatted}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {template.usage_count} downloads
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {template.view_count} views
            </span>
          </div>
          
          {template.singapore_compliant && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Singapore Compliant
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-lg font-semibold text-blue-600">
              {template.price_sgd > 0 ? `S$${template.price_sgd}` : 'Free'}
            </span>
            <Button 
              onClick={handleSelect}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Use Template
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TemplateCard.displayName = 'TemplateCard';

export default TemplateCard;
