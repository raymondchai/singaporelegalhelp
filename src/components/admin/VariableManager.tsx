'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Building, FileText, CheckCircle } from 'lucide-react';

interface TemplateVariable {
  id: string;
  variable_name: string;
  display_label: string;
  variable_type: 'text' | 'textarea' | 'email' | 'date' | 'select' | 'number' | 'phone';
  is_required: boolean;
  validation_pattern: string;
  validation_message: string;
  select_options?: string[];
  category: 'personal' | 'company' | 'legal' | 'financial' | 'custom';
  singapore_validation: boolean;
  usage_count: number;
  description: string;
}

const VariableManager = () => {
  const [activeSection, setActiveSection] = useState('personal');
  const [variables, setVariables] = useState<Record<string, TemplateVariable[]>>({});
  const [loading, setLoading] = useState(true);

  const sections = [
    { 
      id: 'personal', 
      name: 'Personal Information', 
      icon: User, 
      color: 'text-blue-600',
      description: 'Individual user information and identification'
    },
    { 
      id: 'company', 
      name: 'Company Information', 
      icon: Building, 
      color: 'text-green-600',
      description: 'Business entity and corporate details'
    },
    { 
      id: 'legal', 
      name: 'Legal Terms', 
      icon: FileText, 
      color: 'text-purple-600',
      description: 'Legal clauses and contract terms'
    },
    { 
      id: 'financial', 
      name: 'Financial', 
      icon: FileText, 
      color: 'text-orange-600',
      description: 'Payment and financial information'
    }
  ];

  // Mock data based on our database schema
  const mockVariables: Record<string, TemplateVariable[]> = {
    personal: [
      {
        id: '1',
        variable_name: 'full_name',
        display_label: 'Full Name',
        variable_type: 'text',
        is_required: true,
        validation_pattern: '^[A-Za-z\\s]+$',
        validation_message: 'Please enter a valid full name',
        category: 'personal',
        singapore_validation: false,
        usage_count: 35,
        description: 'Full legal name of the individual'
      },
      {
        id: '2',
        variable_name: 'nric_number',
        display_label: 'NRIC Number',
        variable_type: 'text',
        is_required: true,
        validation_pattern: '^[STFG][0-9]{7}[A-Z]$',
        validation_message: 'Please enter a valid Singapore NRIC (e.g., S1234567A)',
        category: 'personal',
        singapore_validation: true,
        usage_count: 32,
        description: 'Singapore NRIC/FIN number'
      },
      {
        id: '3',
        variable_name: 'address',
        display_label: 'Address',
        variable_type: 'textarea',
        is_required: true,
        validation_pattern: '',
        validation_message: '',
        category: 'personal',
        singapore_validation: false,
        usage_count: 18,
        description: 'Full residential or business address'
      },
      {
        id: '4',
        variable_name: 'phone_number',
        display_label: 'Phone Number',
        variable_type: 'phone',
        is_required: true,
        validation_pattern: '^[0-9]{8}$',
        validation_message: 'Please enter a valid 8-digit Singapore phone number',
        category: 'personal',
        singapore_validation: true,
        usage_count: 25,
        description: 'Singapore phone number (8 digits)'
      },
      {
        id: '5',
        variable_name: 'email_address',
        display_label: 'Email Address',
        variable_type: 'email',
        is_required: true,
        validation_pattern: '^[^@]+@[^@]+\\.[^@]+$',
        validation_message: 'Please enter a valid email address',
        category: 'personal',
        singapore_validation: false,
        usage_count: 28,
        description: 'Email address for correspondence'
      }
    ],
    company: [
      {
        id: '6',
        variable_name: 'company_name',
        display_label: 'Company Name',
        variable_type: 'text',
        is_required: true,
        validation_pattern: '^[A-Za-z0-9\\s&.,()-]+$',
        validation_message: 'Please enter a valid company name',
        category: 'company',
        singapore_validation: false,
        usage_count: 45,
        description: 'Official registered company name'
      },
      {
        id: '7',
        variable_name: 'uen_number',
        display_label: 'UEN Number',
        variable_type: 'text',
        is_required: true,
        validation_pattern: '^[0-9]{8}[A-Z]$|^[0-9]{9}[A-Z]$|^[0-9]{10}[A-Z]$',
        validation_message: 'Please enter a valid Singapore UEN number',
        category: 'company',
        singapore_validation: true,
        usage_count: 22,
        description: 'Singapore Unique Entity Number'
      },
      {
        id: '8',
        variable_name: 'business_type',
        display_label: 'Business Type',
        variable_type: 'select',
        is_required: true,
        validation_pattern: '',
        validation_message: '',
        select_options: ['Private Limited Company', 'Public Limited Company', 'Partnership', 'Sole Proprietorship', 'Limited Liability Partnership'],
        category: 'company',
        singapore_validation: false,
        usage_count: 15,
        description: 'Type of business entity'
      }
    ],
    legal: [
      {
        id: '9',
        variable_name: 'contract_date',
        display_label: 'Contract Date',
        variable_type: 'date',
        is_required: true,
        validation_pattern: '',
        validation_message: '',
        category: 'legal',
        singapore_validation: false,
        usage_count: 38,
        description: 'Date when the contract is signed'
      },
      {
        id: '10',
        variable_name: 'governing_law',
        display_label: 'Governing Law',
        variable_type: 'select',
        is_required: true,
        validation_pattern: '',
        validation_message: '',
        select_options: ['Singapore', 'Malaysia', 'Hong Kong', 'United Kingdom', 'Other'],
        category: 'legal',
        singapore_validation: false,
        usage_count: 15,
        description: 'Which country\'s laws govern this contract'
      },
      {
        id: '11',
        variable_name: 'jurisdiction',
        display_label: 'Jurisdiction',
        variable_type: 'select',
        is_required: true,
        validation_pattern: '',
        validation_message: '',
        select_options: ['Singapore Courts', 'SIAC Arbitration', 'SIMC Mediation', 'Other'],
        category: 'legal',
        singapore_validation: true,
        usage_count: 12,
        description: 'Dispute resolution jurisdiction'
      }
    ],
    financial: [
      {
        id: '12',
        variable_name: 'contract_value',
        display_label: 'Contract Value (SGD)',
        variable_type: 'number',
        is_required: false,
        validation_pattern: '^[0-9]+(\\.[0-9]{1,2})?$',
        validation_message: 'Please enter a valid amount in SGD',
        category: 'financial',
        singapore_validation: false,
        usage_count: 8,
        description: 'Total value of the contract in Singapore Dollars'
      },
      {
        id: '13',
        variable_name: 'payment_terms',
        display_label: 'Payment Terms',
        variable_type: 'select',
        is_required: false,
        validation_pattern: '',
        validation_message: '',
        select_options: ['Net 30 days', 'Net 15 days', 'Net 7 days', 'Upon completion', '50% upfront, 50% on completion', 'Monthly installments'],
        category: 'financial',
        singapore_validation: false,
        usage_count: 6,
        description: 'Payment schedule and terms'
      }
    ]
  };

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/variables');

      if (!response.ok) {
        throw new Error('Failed to fetch variables');
      }

      const data = await response.json();
      setVariables(data.variables_by_category || {});
    } catch (error) {
      console.error('Error fetching variables:', error);
      // Fallback to mock data if API fails
      setVariables(mockVariables);
    } finally {
      setLoading(false);
    }
  };

  const typeColors = {
    text: 'bg-blue-100 text-blue-800',
    textarea: 'bg-green-100 text-green-800',
    email: 'bg-purple-100 text-purple-800',
    date: 'bg-orange-100 text-orange-800',
    select: 'bg-pink-100 text-pink-800',
    number: 'bg-yellow-100 text-yellow-800',
    phone: 'bg-indigo-100 text-indigo-800'
  };

  const mostUsedVariables = [
    { name: 'company_name', count: 45 },
    { name: 'contract_date', count: 38 },
    { name: 'full_name', count: 35 }
  ];

  const variableTypeStats = [
    { type: 'Text', count: 8 },
    { type: 'Select', count: 5 },
    { type: 'Textarea', count: 2 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading variables...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Template Variable Manager</h2>
          <p className="text-gray-600">
            Manage reusable variables for your legal document templates. These variables can be used across multiple templates.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Variable
        </button>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-lg">
        {sections.map((section) => {
          const IconComponent = section.icon;
          const sectionVariables = variables[section.id] || [];
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${section.color}`} />
              <span>{section.name}</span>
              <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                {sectionVariables.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Variables List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {sections.find(s => s.id === activeSection)?.name} Variables
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
            <span className="text-sm text-gray-500">
              {variables[activeSection]?.length || 0} variables
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {variables[activeSection]?.map((variable) => (
            <div key={variable.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-sm font-medium text-gray-900">{variable.display_label}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColors[variable.variable_type]}`}>
                      {variable.variable_type}
                    </span>
                    {variable.is_required && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                    {variable.singapore_validation && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        SG Validation
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p><span className="font-medium">Variable Name:</span> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{variable.variable_name}</code></p>
                        <p><span className="font-medium">Usage Count:</span> {variable.usage_count} templates</p>
                      </div>
                      <div>
                        {variable.validation_pattern && (
                          <p><span className="font-medium">Validation:</span> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{variable.validation_pattern}</code></p>
                        )}
                        {variable.select_options && (
                          <p><span className="font-medium">Options:</span> {variable.select_options.slice(0, 3).join(', ')}{variable.select_options.length > 3 && '...'}</p>
                        )}
                      </div>
                    </div>
                    {variable.description && (
                      <p className="text-gray-500 italic">{variable.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    title="Edit Variable"
                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    title="Delete Variable"
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!variables[activeSection] || variables[activeSection].length === 0) && (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No variables found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first {activeSection} variable.
            </p>
            <div className="mt-6">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Add Variable
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Most Used Variables</h3>
          <div className="space-y-3">
            {mostUsedVariables.map((variable, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{variable.name}</span>
                <span className="text-sm font-medium text-gray-900">{variable.count} templates</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Variable Types</h3>
          <div className="space-y-3">
            {variableTypeStats.map((type, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{type.type}</span>
                <span className="text-sm font-medium text-gray-900">{type.count} variables</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Singapore Compliance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">NRIC Validation</span>
              <span className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">UEN Validation</span>
              <span className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Local Phone Format</span>
              <span className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariableManager;
