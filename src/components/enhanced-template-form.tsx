'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, Info, AlertCircle, Calculator, Eye, EyeOff } from 'lucide-react'

interface EnhancedTemplateVariable {
  variable_name: string
  display_label: string
  variable_type: string
  is_required: boolean
  validation_pattern?: string
  validation_message?: string
  select_options?: string[]
  category: string
  singapore_validation: boolean
  description?: string
  conditional_logic?: any
  dependent_on?: string
  show_when_value?: string
  validation_rules?: any
  help_text?: string
  placeholder_text?: string
  field_group: string
  sort_order: number
}

interface FieldDependency {
  parent_field: string
  child_field: string
  dependency_type: string
  condition_value?: string
  calculation_formula?: string
}

interface ValidationRule {
  variable_name: string
  rule_type: string
  rule_value?: string
  error_message: string
}

interface EnhancedTemplateFormProps {
  templateId: string
  variables: Record<string, EnhancedTemplateVariable[]>
  dependencies: FieldDependency[]
  validationRules: ValidationRule[]
  onFormChange: (formData: Record<string, any>) => void
  onValidationChange: (errors: Record<string, string>) => void
  initialData?: Record<string, any>
}

export default function EnhancedTemplateForm({
  templateId,
  variables,
  dependencies,
  validationRules,
  onFormChange,
  onValidationChange,
  initialData = {}
}: EnhancedTemplateFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({})
  const [calculatedFields, setCalculatedFields] = useState<Record<string, any>>({})

  // Initialize visible fields based on dependencies
  useEffect(() => {
    const initialVisible: Record<string, boolean> = {}
    
    Object.values(variables).flat().forEach(variable => {
      // Check if field has dependencies
      const dependency = dependencies.find(dep => dep.child_field === variable.variable_name)
      
      if (dependency) {
        // Field is dependent, check if parent condition is met
        const parentValue = formData[dependency.parent_field]
        const shouldShow = checkDependencyCondition(dependency, parentValue)
        initialVisible[variable.variable_name] = shouldShow
      } else {
        // Field has no dependencies, always visible
        initialVisible[variable.variable_name] = true
      }
    })
    
    setVisibleFields(initialVisible)
  }, [variables, dependencies, formData])

  // Process calculated fields
  useEffect(() => {
    const calculated: Record<string, any> = {}
    
    dependencies.forEach(dep => {
      if (dep.dependency_type === 'calculate_from' && dep.calculation_formula) {
        const result = calculateFieldValue(dep.calculation_formula, formData)
        if (result !== null) {
          calculated[dep.child_field] = result
        }
      }
    })
    
    setCalculatedFields(calculated)
  }, [formData, dependencies])

  const checkDependencyCondition = (dependency: FieldDependency, parentValue: any): boolean => {
    if (!dependency.condition_value || !parentValue) return false
    
    const conditions = dependency.condition_value.split(',')
    
    switch (dependency.dependency_type) {
      case 'show_when':
        return conditions.includes(parentValue)
      case 'hide_when':
        return !conditions.includes(parentValue)
      case 'require_when':
        return conditions.includes(parentValue)
      default:
        return true
    }
  }

  const calculateFieldValue = (formula: string, data: Record<string, any>): number | null => {
    try {
      // Simple calculation engine for common formulas
      if (formula.includes('loan_amount') && formula.includes('interest_rate') && formula.includes('repayment_period_months')) {
        const principal = parseFloat(data.loan_amount) || 0
        const rate = parseFloat(data.interest_rate) || 0
        const months = parseInt(data.repayment_period_months) || 0
        
        if (principal > 0 && rate > 0 && months > 0) {
          const monthlyRate = rate / 100 / 12
          const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                (Math.pow(1 + monthlyRate, months) - 1)
          return Math.round(monthlyPayment * 100) / 100
        }
      }
      
      return null
    } catch (error) {
      console.error('Calculation error:', error)
      return null
    }
  }

  const validateField = (fieldName: string, value: any): string | null => {
    const variable = Object.values(variables).flat().find(v => v.variable_name === fieldName)
    if (!variable) return null

    // Check if field is required
    if (variable.is_required && (!value || value.toString().trim() === '')) {
      return `${variable.display_label} is required`
    }

    // Check validation pattern
    if (value && variable.validation_pattern) {
      const regex = new RegExp(variable.validation_pattern)
      if (!regex.test(value.toString())) {
        return variable.validation_message || `Invalid format for ${variable.display_label}`
      }
    }

    // Check additional validation rules
    const rules = validationRules.filter(rule => rule.variable_name === fieldName)
    for (const rule of rules) {
      const error = validateWithRule(rule, value)
      if (error) return error
    }

    return null
  }

  const validateWithRule = (rule: ValidationRule, value: any): string | null => {
    if (!value) return null

    switch (rule.rule_type) {
      case 'min_length':
        if (value.toString().length < parseInt(rule.rule_value || '0')) {
          return rule.error_message
        }
        break
      case 'max_length':
        if (value.toString().length > parseInt(rule.rule_value || '999')) {
          return rule.error_message
        }
        break
      case 'min_value':
        if (parseFloat(value) < parseFloat(rule.rule_value || '0')) {
          return rule.error_message
        }
        break
      case 'max_value':
        if (parseFloat(value) > parseFloat(rule.rule_value || '999999')) {
          return rule.error_message
        }
        break
      case 'singapore_nric':
        if (!/^[STFG][0-9]{7}[A-Z]$/.test(value.toString().toUpperCase())) {
          return rule.error_message
        }
        break
      case 'singapore_uen':
        if (!/^[0-9]{8,10}[A-Z]$/.test(value.toString().toUpperCase())) {
          return rule.error_message
        }
        break
      case 'singapore_phone':
        if (!/^[689][0-9]{7}$/.test(value.toString())) {
          return rule.error_message
        }
        break
    }

    return null
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value }
    setFormData(newFormData)

    // Validate field
    const error = validateField(fieldName, value)
    const newErrors = { ...validationErrors }
    
    if (error) {
      newErrors[fieldName] = error
    } else {
      delete newErrors[fieldName]
    }
    
    setValidationErrors(newErrors)

    // Update visibility of dependent fields
    const dependentFields = dependencies.filter(dep => dep.parent_field === fieldName)
    const newVisibility = { ...visibleFields }
    
    dependentFields.forEach(dep => {
      const shouldShow = checkDependencyCondition(dep, value)
      newVisibility[dep.child_field] = shouldShow
      
      // Clear value if field becomes hidden
      if (!shouldShow && newFormData[dep.child_field]) {
        delete newFormData[dep.child_field]
      }
    })
    
    setVisibleFields(newVisibility)

    // Notify parent components
    onFormChange(newFormData)
    onValidationChange(newErrors)
  }

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  const renderField = (variable: EnhancedTemplateVariable) => {
    if (!visibleFields[variable.variable_name]) return null

    const value = formData[variable.variable_name] || calculatedFields[variable.variable_name] || ''
    const error = validationErrors[variable.variable_name]
    const isCalculated = calculatedFields.hasOwnProperty(variable.variable_name)

    return (
      <div key={variable.variable_name} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {variable.display_label}
          {variable.is_required && <span className="text-red-500 ml-1">*</span>}
          {isCalculated && <Calculator className="inline h-4 w-4 ml-1 text-blue-500" />}
        </label>

        {variable.help_text && (
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{variable.help_text}</span>
          </div>
        )}

        {renderFieldInput(variable, value, isCalculated)}

        {error && (
          <div className="flex items-start space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {variable.singapore_validation && (
          <div className="text-xs text-blue-600">
            ✓ Singapore compliance validation enabled
          </div>
        )}
      </div>
    )
  }

  const renderFieldInput = (variable: EnhancedTemplateVariable, value: any, isCalculated: boolean) => {
    const commonProps = {
      value: value || '',
      onChange: (e: any) => handleFieldChange(variable.variable_name, e.target.value),
      disabled: isCalculated,
      placeholder: variable.placeholder_text || '',
      className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        isCalculated ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${validationErrors[variable.variable_name] ? 'border-red-500' : ''}`
    }

    switch (variable.variable_type) {
      case 'textarea':
        return <textarea {...commonProps} rows={3} />
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {variable.display_label}</option>
            {variable.select_options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      
      case 'date':
        return <input {...commonProps} type="date" />
      
      case 'number':
        return <input {...commonProps} type="number" step="0.01" />
      
      case 'email':
        return <input {...commonProps} type="email" />
      
      case 'phone':
        return <input {...commonProps} type="tel" />
      
      default:
        return <input {...commonProps} type="text" />
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(variables).map(([groupName, groupVariables]) => (
        <div key={groupName} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleGroup(groupName)}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-medium text-gray-900 capitalize">
              {groupName.replace(/_/g, ' ')}
            </h3>
            {collapsedGroups[groupName] ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {!collapsedGroups[groupName] && (
            <div className="p-4 space-y-4">
              {groupVariables
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(renderField)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
