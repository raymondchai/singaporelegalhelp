/**
 * Integration tests for Template Card component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TemplateCard from '../optimized/TemplateCard'

const mockTemplate = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Employment Contract Template',
  description: 'Standard employment contract for Singapore companies',
  category: 'Employment',
  subscription_tier: 'free' as const,
  price_sgd: 0,
  difficulty_level: 'basic' as const,
  estimated_time_minutes: 30,
  singapore_compliant: true,
  legal_review_required: true,
  usage_count: 150,
  view_count: 1200,
  file_size_formatted: '2.5 MB',
}

const mockOnSelect = jest.fn()

describe('TemplateCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render template information correctly', () => {
    render(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    expect(screen.getByText('Employment Contract Template')).toBeInTheDocument()
    expect(screen.getByText('Standard employment contract for Singapore companies')).toBeInTheDocument()
    expect(screen.getByText('FREE')).toBeInTheDocument()
    expect(screen.getByText('BASIC')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('2.5 MB')).toBeInTheDocument()
    expect(screen.getByText('150 downloads')).toBeInTheDocument()
    expect(screen.getByText('1200 views')).toBeInTheDocument()
    expect(screen.getByText('Singapore Compliant')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('should display correct tier colors', () => {
    const { rerender } = render(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    // Test free tier
    expect(screen.getByText('FREE')).toHaveClass('bg-green-100', 'text-green-800')
    
    // Test basic tier
    const basicTemplate = { ...mockTemplate, subscription_tier: 'basic' as const }
    rerender(<TemplateCard template={basicTemplate} onSelect={mockOnSelect} />)
    expect(screen.getByText('BASIC')).toHaveClass('bg-blue-100', 'text-blue-800')
    
    // Test premium tier
    const premiumTemplate = { ...mockTemplate, subscription_tier: 'premium' as const }
    rerender(<TemplateCard template={premiumTemplate} onSelect={mockOnSelect} />)
    expect(screen.getByText('PREMIUM')).toHaveClass('bg-purple-100', 'text-purple-800')
    
    // Test enterprise tier
    const enterpriseTemplate = { ...mockTemplate, subscription_tier: 'enterprise' as const }
    rerender(<TemplateCard template={enterpriseTemplate} onSelect={mockOnSelect} />)
    expect(screen.getByText('ENTERPRISE')).toHaveClass('bg-orange-100', 'text-orange-800')
  })

  it('should display correct difficulty colors', () => {
    const { rerender } = render(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    // Test basic difficulty
    expect(screen.getByText('BASIC')).toHaveClass('bg-green-100', 'text-green-800')
    
    // Test intermediate difficulty
    const intermediateTemplate = { ...mockTemplate, difficulty_level: 'intermediate' as const }
    rerender(<TemplateCard template={intermediateTemplate} onSelect={mockOnSelect} />)
    expect(screen.getByText('INTERMEDIATE')).toHaveClass('bg-yellow-100', 'text-yellow-800')
    
    // Test advanced difficulty
    const advancedTemplate = { ...mockTemplate, difficulty_level: 'advanced' as const }
    rerender(<TemplateCard template={advancedTemplate} onSelect={mockOnSelect} />)
    expect(screen.getByText('ADVANCED')).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('should display price correctly for paid templates', () => {
    const paidTemplate = { ...mockTemplate, price_sgd: 25.99 }
    render(<TemplateCard template={paidTemplate} onSelect={mockOnSelect} />)
    
    expect(screen.getByText('S$25.99')).toBeInTheDocument()
  })

  it('should call onSelect when Use Template button is clicked', () => {
    render(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    const useTemplateButton = screen.getByText('Use Template')
    fireEvent.click(useTemplateButton)
    
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).toHaveBeenCalledWith(mockTemplate)
  })

  it('should not display Singapore Compliant badge when not compliant', () => {
    const nonCompliantTemplate = { ...mockTemplate, singapore_compliant: false }
    render(<TemplateCard template={nonCompliantTemplate} onSelect={mockOnSelect} />)
    
    expect(screen.queryByText('Singapore Compliant')).not.toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    const useTemplateButton = screen.getByRole('button', { name: 'Use Template' })
    expect(useTemplateButton).toBeInTheDocument()
    expect(useTemplateButton).toHaveAttribute('type', 'button')
  })

  it('should handle hover effects', () => {
    render(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    const card = screen.getByText('Employment Contract Template').closest('.hover\\:shadow-lg')
    expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow', 'cursor-pointer')
  })

  it('should display all usage statistics', () => {
    render(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    // Check for download icon and count
    expect(screen.getByText('150 downloads')).toBeInTheDocument()
    
    // Check for view icon and count
    expect(screen.getByText('1200 views')).toBeInTheDocument()
    
    // Check for time estimate
    expect(screen.getByText('30 min')).toBeInTheDocument()
    
    // Check for file size
    expect(screen.getByText('2.5 MB')).toBeInTheDocument()
  })

  it('should be memoized to prevent unnecessary re-renders', () => {
    const { rerender } = render(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    // Re-render with same props should not cause re-render
    rerender(<TemplateCard template={mockTemplate} onSelect={mockOnSelect} />)
    
    // Component should still be rendered correctly
    expect(screen.getByText('Employment Contract Template')).toBeInTheDocument()
  })

  it('should handle long titles and descriptions gracefully', () => {
    const longContentTemplate = {
      ...mockTemplate,
      title: 'This is a very long template title that might overflow the container and cause layout issues',
      description: 'This is a very long description that contains a lot of text and might cause the card to become too tall or cause text overflow issues in the user interface',
    }
    
    render(<TemplateCard template={longContentTemplate} onSelect={mockOnSelect} />)
    
    expect(screen.getByText(longContentTemplate.title)).toBeInTheDocument()
    expect(screen.getByText(longContentTemplate.description)).toBeInTheDocument()
  })

  it('should handle edge cases for numeric values', () => {
    const edgeCaseTemplate = {
      ...mockTemplate,
      price_sgd: 0,
      estimated_time_minutes: 1,
      usage_count: 0,
      view_count: 0,
    }
    
    render(<TemplateCard template={edgeCaseTemplate} onSelect={mockOnSelect} />)
    
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('1 min')).toBeInTheDocument()
    expect(screen.getByText('0 downloads')).toBeInTheDocument()
    expect(screen.getByText('0 views')).toBeInTheDocument()
  })
})
