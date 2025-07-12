'use client'

import { useState } from 'react'
import { MessageCircle, Lightbulb, Clock, Shield } from 'lucide-react'

interface AIChatWelcomeProps {
  onQuestionSelect: (question: string) => void
}

export default function AIChatWelcome({ onQuestionSelect }: AIChatWelcomeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = {
    employment_law: {
      title: 'Employment Law',
      icon: '👔',
      questions: [
        'What are my rights if I\'m terminated without notice?',
        'How much notice period am I entitled to?',
        'Can my employer reduce my salary without consent?',
        'What constitutes workplace harassment in Singapore?'
      ]
    },
    business_law: {
      title: 'Business Law',
      icon: '🏢',
      questions: [
        'How do I register a company in Singapore?',
        'What are the requirements for foreign directors?',
        'What licenses do I need for my business?',
        'How do I comply with ACRA filing requirements?'
      ]
    },
    property_law: {
      title: 'Property Law',
      icon: '🏠',
      questions: [
        'What is the process for buying an HDB flat?',
        'How much is the stamp duty for property purchase?',
        'What are my rights as a tenant?',
        'Can I rent out my HDB flat?'
      ]
    },
    family_law: {
      title: 'Family Law',
      icon: '👨‍👩‍👧‍👦',
      questions: [
        'What are the grounds for divorce in Singapore?',
        'How is child custody determined?',
        'What is the process for adoption?',
        'How is matrimonial property divided?'
      ]
    }
  }

  if (selectedCategory) {
    const category = categories[selectedCategory as keyof typeof categories]
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <span>{category.icon}</span>
            <span>{category.title} Questions</span>
          </h3>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to categories
          </button>
        </div>
        
        <div className="grid gap-3">
          {category.questions.map((question) => (
            <button
              key={question}
              onClick={() => onQuestionSelect(question)}
              className="text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <p className="text-sm text-gray-800">{question}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <MessageCircle className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          AI Legal Assistant
        </h2>
        <p className="text-gray-600">
          Get instant answers to your Singapore legal questions powered by AI
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3">
          <Lightbulb className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Smart Answers</p>
          <p className="text-xs text-gray-600">AI-powered responses based on Singapore law</p>
        </div>
        <div className="text-center p-3">
          <Clock className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Instant Response</p>
          <p className="text-xs text-gray-600">Get answers in seconds, not hours</p>
        </div>
        <div className="text-center p-3">
          <Shield className="h-6 w-6 text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Reliable Sources</p>
          <p className="text-xs text-gray-600">Backed by verified legal content</p>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Choose a category to get started:
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left"
            >
              <span className="text-2xl">{category.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{category.title}</p>
                <p className="text-xs text-gray-600">
                  {category.questions.length} common questions
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Disclaimer:</strong> This AI assistant provides general legal information only. 
          For specific legal advice, please consult with a qualified Singapore lawyer.
        </p>
      </div>
    </div>
  )
}
