'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeleton animation utility
const Skeleton = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...props}
  />
);

// Template Card Skeleton
export const TemplateCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <div className="flex items-start justify-between">
        <Skeleton className="h-8 w-8" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-3/4 mt-2" />
      <Skeleton className="h-4 w-full mt-1" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        <Skeleton className="h-4 w-32" />

        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Template Grid Skeleton
export const TemplateGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <TemplateCardSkeleton key={`template-skeleton-${index}`} />
    ))}
  </div>
);

// Form Field Skeleton
export const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full" />
  </div>
);

// Template Form Skeleton
export const TemplateFormSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
    </CardHeader>
    <CardContent className="space-y-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <FormFieldSkeleton key={`form-field-skeleton-${index}`} />
      ))}
    </CardContent>
  </Card>
);

// Template Header Skeleton
export const TemplateHeaderSkeleton = () => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <Skeleton className="h-16 w-16" />
      </div>
    </div>
  </div>
);

// Sidebar Skeleton
export const SidebarSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </CardContent>
    </Card>
  </div>
);

// Search Bar Skeleton
export const SearchBarSkeleton = () => (
  <Card>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Skeleton className="h-4 w-12 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Page Loading Skeleton (combines multiple skeletons)
export const DocumentBuilderPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="mb-8">
        <SearchBarSkeleton />
      </div>
      
      <TemplateGridSkeleton count={9} />
    </div>
  </div>
);

export const TemplateCustomizationPageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <TemplateHeaderSkeleton />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TemplateFormSkeleton />
        </div>
        <div>
          <SidebarSkeleton />
        </div>
      </div>
    </div>
  </div>
);

const SkeletonLoaders = {
  TemplateCardSkeleton,
  TemplateGridSkeleton,
  FormFieldSkeleton,
  TemplateFormSkeleton,
  TemplateHeaderSkeleton,
  SidebarSkeleton,
  SearchBarSkeleton,
  DocumentBuilderPageSkeleton,
  TemplateCustomizationPageSkeleton,
};

export default SkeletonLoaders;
