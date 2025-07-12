'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

interface TemplateCreationFormProps {
  onCancel: () => void;
  onSave: (templateData: any) => void;
}

interface NewTemplate {
  title: string;
  category: string;
  subcategory: string;
  description: string;
  price_sgd: number;
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  difficulty_level: 'basic' | 'intermediate' | 'advanced';
  estimated_time_minutes: number;
  singapore_compliant: boolean;
  legal_review_required: boolean;
}

const TemplateCreationForm: React.FC<TemplateCreationFormProps> = ({ onCancel, onSave }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTemplate, setNewTemplate] = useState<NewTemplate>({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    price_sgd: 0,
    subscription_tier: 'free',
    difficulty_level: 'basic',
    estimated_time_minutes: 15,
    singapore_compliant: true,
    legal_review_required: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { 
      id: 'employment', 
      name: 'Employment Law', 
      subcategories: ['Full-time Employment', 'Part-time Employment', 'Contract Work', 'Termination', 'Non-Disclosure'] 
    },
    { 
      id: 'business', 
      name: 'Business', 
      subcategories: ['Partnerships', 'Confidentiality', 'Service Agreements', 'Vendor Contracts', 'Licensing'] 
    },
    { 
      id: 'property', 
      name: 'Property Law', 
      subcategories: ['Residential Rental', 'Commercial Lease', 'Purchase Agreements', 'Property Management', 'Tenancy'] 
    },
    { 
      id: 'family', 
      name: 'Family Law', 
      subcategories: ['Divorce', 'Child Custody', 'Maintenance', 'Adoption', 'Prenuptial'] 
    },
    { 
      id: 'corporate', 
      name: 'Corporate Law', 
      subcategories: ['Incorporation', 'Shareholder Agreements', 'Board Resolutions', 'Compliance', 'Mergers'] 
    }
  ];

  const selectedCategory = categories.find(cat => cat.id === newTemplate.category);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newTemplate.title.trim()) {
      newErrors.title = 'Template title is required';
    }

    if (!newTemplate.category) {
      newErrors.category = 'Category is required';
    }

    if (!selectedFile) {
      newErrors.file = 'Template file is required';
    }

    if (newTemplate.price_sgd < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (newTemplate.estimated_time_minutes < 5 || newTemplate.estimated_time_minutes > 180) {
      newErrors.time = 'Estimated time must be between 5 and 180 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, file: 'File size must be less than 10MB' });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, file: 'Only DOCX and DOC files are allowed' });
        return;
      }

      setSelectedFile(file);
      setErrors({ ...errors, file: '' });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileUpload(fakeEvent);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveTemplate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const templateData = {
        ...newTemplate,
        file: selectedFile,
        status: 'draft',
        usage_count: 0,
        last_updated: new Date().toISOString().split('T')[0],
        file_size: `${Math.round((selectedFile?.size || 0) / 1024)} KB`,
        id: Date.now().toString() // Mock ID
      };
      
      setTimeout(() => {
        onSave(templateData);
      }, 500);

    } catch (error) {
      console.error('Error creating template:', error);
      setErrors({ submit: 'Error creating template. Please try again.' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveDraft = async () => {
    if (!newTemplate.title.trim()) {
      setErrors({ title: 'Template title is required for draft' });
      return;
    }

    const draftData = {
      ...newTemplate,
      file: selectedFile,
      status: 'draft'
    };

    onSave(draftData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Legal Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload and configure a new legal document template for Singapore Legal Help
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Employment Contract - Singapore"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value, subcategory: ''})}
                className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Subcategory */}
          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                value={newTemplate.subcategory}
                onChange={(e) => setNewTemplate({...newTemplate, subcategory: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Subcategory (Optional)</option>
                {selectedCategory.subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of what this template is used for..."
            />
          </div>

          {/* Pricing and Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Tier</label>
              <select
                value={newTemplate.subscription_tier}
                onChange={(e) => setNewTemplate({...newTemplate, subscription_tier: e.target.value as any})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (SGD)</label>
              <input
                type="number"
                value={newTemplate.price_sgd}
                onChange={(e) => setNewTemplate({...newTemplate, price_sgd: parseFloat(e.target.value) || 0})}
                className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
                step="0.01"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={newTemplate.difficulty_level}
                onChange={(e) => setNewTemplate({...newTemplate, difficulty_level: e.target.value as any})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Est. Time (min)</label>
              <input
                type="number"
                value={newTemplate.estimated_time_minutes}
                onChange={(e) => setNewTemplate({...newTemplate, estimated_time_minutes: parseInt(e.target.value) || 15})}
                className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.time ? 'border-red-300' : 'border-gray-300'
                }`}
                min="5"
                max="180"
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Compliance Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newTemplate.singapore_compliant}
                onChange={(e) => setNewTemplate({...newTemplate, singapore_compliant: e.target.checked})}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">Singapore Law Compliant</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newTemplate.legal_review_required}
                onChange={(e) => setNewTemplate({...newTemplate, legal_review_required: e.target.checked})}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">Legal Review Required</label>
            </div>
          </div>

          {/* Template Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template File <span className="text-red-500">*</span>
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 hover:border-blue-400 transition-colors ${
                errors.file ? 'border-red-300' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {selectedFile ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-blue-700">{selectedFile.name}</p>
                        <p className="text-xs text-blue-600">
                          {Math.round(selectedFile.size / 1024)} KB • {selectedFile.type.includes('wordprocessingml') ? 'DOCX' : 'DOC'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Upload Template File
                      </button>
                      <p className="text-gray-500 text-sm">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">DOCX, DOC up to 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {errors.file && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Uploading template...</span>
                <span className="text-sm text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveDraft}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={handleSaveTemplate}
            disabled={isUploading || !newTemplate.title || !newTemplate.category || !selectedFile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {isUploading ? 'Creating...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCreationForm;
