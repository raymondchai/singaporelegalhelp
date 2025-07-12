'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, X, ExternalLink } from 'lucide-react'

interface LegalDisclaimerProps {
  onDismiss?: () => void
  variant?: 'banner' | 'modal' | 'inline'
  showDismiss?: boolean
}

export default function LegalDisclaimer({ 
  onDismiss, 
  variant = 'banner', 
  showDismiss = true 
}: LegalDisclaimerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const content = (
    <div className="flex items-start space-x-3">
      <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">
          Important Legal Disclaimer
        </h3>
        <div className="text-xs text-amber-700 space-y-2">
          <p>
            <strong>This AI assistant provides general legal information only and does not constitute legal advice.</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Information provided is for educational purposes only</li>
            <li>Laws and regulations may change frequently</li>
            <li>Each legal situation is unique and fact-specific</li>
            <li>AI responses may contain errors or omissions</li>
          </ul>
          <div className="bg-amber-100 rounded p-2 mt-3">
            <div className="flex items-center space-x-2 mb-1">
              <AlertTriangle className="h-3 w-3 text-amber-700" />
              <span className="font-medium text-amber-800">For Legal Matters:</span>
            </div>
            <p className="text-amber-700">
              Always consult with a qualified Singapore lawyer for specific legal advice, 
              representation, or before making important legal decisions.
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-3 pt-2 border-t border-amber-200">
            <a 
              href="/legal/find-lawyer" 
              className="text-amber-600 hover:text-amber-800 underline flex items-center space-x-1"
            >
              <span>Find a Lawyer</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a 
              href="/legal/terms" 
              className="text-amber-600 hover:text-amber-800 underline flex items-center space-x-1"
            >
              <span>Terms of Use</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        {showDismiss && (
          <button
            onClick={handleDismiss}
            className="mt-3 text-xs text-amber-600 hover:text-amber-800 underline font-medium"
          >
            I understand and acknowledge this disclaimer
          </button>
        )}
      </div>
      {showDismiss && (
        <button
          onClick={handleDismiss}
          className="text-amber-500 hover:text-amber-700 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          {content}
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        {content}
      </div>
    )
  }

  // Default banner variant
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 shadow-sm">
      {content}
    </div>
  )
}

// Compact version for persistent display
export function CompactLegalDisclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs">
      <div className="flex items-center space-x-2">
        <Shield className="h-3 w-3 text-amber-600 flex-shrink-0" />
        <span className="text-amber-700">
          <strong>Disclaimer:</strong> This AI provides general legal information only. 
          Consult a qualified Singapore lawyer for legal advice.
        </span>
      </div>
    </div>
  )
}

// Floating disclaimer for chat interfaces
export function FloatingLegalDisclaimer({ onDismiss }: { onDismiss?: () => void }) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white border border-amber-200 rounded-lg shadow-lg p-4 z-40">
      <div className="flex items-start space-x-3">
        <Shield className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800 mb-1">Legal Notice</h4>
          <p className="text-xs text-amber-700 mb-2">
            AI responses are for information only. Consult a lawyer for legal advice.
          </p>
          <button
            onClick={handleDismiss}
            className="text-xs text-amber-600 hover:text-amber-800 underline"
          >
            Got it
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-500 hover:text-amber-700"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
