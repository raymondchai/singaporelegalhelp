'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Users, FileText, DollarSign, Star } from 'lucide-react';

const AnalyticsDashboard = () => {
  const keyMetrics = [
    {
      title: 'Total Templates',
      value: '156',
      change: '+12 this month',
      trend: 'up',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Monthly Downloads',
      value: '2,847',
      change: '+18% vs last month',
      trend: 'up',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Revenue',
      value: '$4,521',
      change: '+25% vs last month',
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Avg. Rating',
      value: '4.8',
      change: 'From 1,204 reviews',
      trend: 'stable',
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const popularTemplates = [
    { id: 1, title: 'Employment Contract - Singapore', downloads: 145, category: 'Employment' },
    { id: 2, title: 'Non-Disclosure Agreement (NDA)', downloads: 89, category: 'Business' },
    { id: 3, title: 'Tenancy Agreement - HDB', downloads: 67, category: 'Property' },
    { id: 4, title: 'Service Agreement', downloads: 54, category: 'Business' },
    { id: 5, title: 'Partnership Agreement', downloads: 43, category: 'Business' }
  ];

  const categoryStats = [
    { category: 'Employment Law', templates: 45, color: 'bg-blue-500' },
    { category: 'Business', templates: 38, color: 'bg-green-500' },
    { category: 'Property Law', templates: 29, color: 'bg-purple-500' },
    { category: 'Family Law', templates: 25, color: 'bg-orange-500' },
    { category: 'Corporate Law', templates: 19, color: 'bg-red-500' }
  ];

  const revenueByTier = [
    { tier: 'Premium', amount: 2847, percentage: 63, color: 'bg-purple-500' },
    { tier: 'Basic', amount: 1234, percentage: 27, color: 'bg-blue-500' },
    { tier: 'Enterprise', amount: 440, percentage: 10, color: 'bg-green-500' },
    { tier: 'Free (ads)', amount: 0, percentage: 0, color: 'bg-gray-400' }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Employment Contract approved',
      time: '2 hours ago',
      status: 'approved',
      color: 'border-green-400 bg-green-50',
      textColor: 'text-green-600'
    },
    {
      id: 2,
      action: 'NDA template under review',
      time: '5 hours ago',
      status: 'review',
      color: 'border-yellow-400 bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      id: 3,
      action: 'Partnership Agreement uploaded',
      time: '1 day ago',
      status: 'upload',
      color: 'border-blue-400 bg-blue-50',
      textColor: 'text-blue-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {metric.title}
                  </h3>
                  <p className={`text-3xl font-bold ${metric.color} mt-2`}>
                    {metric.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
                    {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                    <p className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                      {metric.change}
                    </p>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Popular Templates */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Most Popular Templates</h3>
          <span className="text-sm text-gray-500">Last 30 days</span>
        </div>
        <div className="space-y-4">
          {popularTemplates.map((template, index) => (
            <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{template.title}</h4>
                  <p className="text-xs text-gray-500">{template.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{template.downloads}</p>
                <p className="text-xs text-gray-500">downloads</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Performance and Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates by Category */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Templates by Category</h3>
          <div className="space-y-4">
            {categoryStats.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <span className="text-sm text-gray-700">{category.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${(category.templates / 45) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {category.templates}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Tier */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Revenue by Tier</h3>
          <div className="space-y-4">
            {revenueByTier.map((tier, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${tier.color}`}></div>
                  <span className="text-sm text-gray-700">{tier.tier}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${tier.color}`}
                      style={{ width: `${tier.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">
                    ${tier.amount} ({tier.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Revenue</span>
              <span className="text-lg font-bold text-gray-900">$4,521</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className={`flex items-center justify-between p-4 border-l-4 ${activity.color} rounded-r-md`}>
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <span className={`text-sm font-medium capitalize ${activity.textColor}`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Performance Summary</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your legal document templates are performing well with strong user engagement
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">92%</p>
                <p className="text-xs text-gray-500">User Satisfaction</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">156</p>
                <p className="text-xs text-gray-500">Active Templates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">$4.5K</p>
                <p className="text-xs text-gray-500">Monthly Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
