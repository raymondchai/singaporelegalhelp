'use client';

import React, { useState } from 'react';
import { FileText, Upload, BarChart3, Settings, Plus } from 'lucide-react';
import TemplateListComponent from '@/components/admin/TemplateListComponent';
import TemplateCreationForm from '@/components/admin/TemplateCreationForm';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import VariableManager from '@/components/admin/VariableManager';

// Main Template Admin Interface
const MainTemplateAdmin = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const tabs = [
    { 
      id: 'templates', 
      name: 'Template Library', 
      icon: FileText, 
      color: 'text-blue-600',
      description: 'Manage legal document templates'
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: BarChart3, 
      color: 'text-green-600',
      description: 'View usage statistics and performance'
    },
    { 
      id: 'variables', 
      name: 'Variables', 
      icon: Settings, 
      color: 'text-purple-600',
      description: 'Manage reusable template variables'
    }
  ];

  const handleCreateTemplate = () => {
    setShowCreateForm(true);
    setActiveTab('create');
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setActiveTab('templates');
  };

  const handleSaveTemplate = (templateData: any) => {
    console.log('Saving template:', templateData);
    // TODO: Implement template save logic
    setShowCreateForm(false);
    setActiveTab('templates');
  };

  const renderContent = () => {
    if (showCreateForm || activeTab === 'create') {
      return (
        <TemplateCreationForm 
          onCancel={handleCancelCreate}
          onSave={handleSaveTemplate}
        />
      );
    }

    switch (activeTab) {
      case 'templates':
        return <TemplateListComponent onCreateNew={handleCreateTemplate} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'variables':
        return <VariableManager />;
      default:
        return <TemplateListComponent onCreateNew={handleCreateTemplate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Legal Document Builder Admin
              </h1>
              <p className="text-gray-600 mt-1">
                Manage templates, variables, and analytics for Singapore Legal Help
              </p>
            </div>
            
            {!showCreateForm && activeTab === 'templates' && (
              <button
                onClick={handleCreateTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!showCreateForm && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${tab.color}`} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <p>Singapore Legal Help - Document Builder Admin</p>
              <p>Manage legal document templates with Singapore compliance</p>
            </div>
            <div className="text-right">
              <p>Version 1.0.0</p>
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainTemplateAdmin;
