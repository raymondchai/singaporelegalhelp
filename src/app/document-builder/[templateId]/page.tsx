'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { TemplateCustomizationPageSkeleton } from '@/components/optimized/SkeletonLoaders';
import { templateApi, variableApi } from '@/lib/api-client';
import { createTemplateVariableFormSchema, validateWithSchema } from '@/lib/validation-schemas';
import { logError, getErrorMessage } from '@/lib/error-handling';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layouts/page-layout';

interface TemplateVariable {
  id: string;
  variable_name: string;
  display_name: string;
  display_label: string;
  variable_type: 'text' | 'textarea' | 'email' | 'date' | 'select' | 'number' | 'phone' | 'nric' | 'uen' | 'currency';
  category: 'personal' | 'company' | 'financial' | 'legal';
  is_required: boolean;
  default_value?: string;
  validation_pattern?: string;
  description?: string;
  select_options?: string[];
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  price_sgd: number;
  difficulty_level: string;
  estimated_time_minutes: number;
  singapore_compliant: boolean;
  legal_review_required: boolean;
}

export default function TemplateCustomizationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // All hooks must be called before any early returns
  const [template, setTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const templateId = params?.templateId as string;

  // Define fetchTemplateData function with useCallback to prevent infinite loops
  const fetchTemplateData = useCallback(async () => {
    if (!templateId) return;

    try {
      setLoading(true);

      // Fetch template details
      const templateResponse = await templateApi.getTemplate(templateId);

      if (templateResponse.success && templateResponse.data?.templates?.length > 0) {
        setTemplate(templateResponse.data.templates[0]);
      } else {
        const errorMsg = getErrorMessage(templateResponse.error);
        toast({
          title: "Error Loading Template",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      // Fetch template variables
      const variablesResponse = await variableApi.getVariables({ template_id: templateId });

      if (variablesResponse.success) {
        const variablesList = variablesResponse.data?.variables ?? [];
        setVariables(variablesList);

        // Initialize form data with default values
        const initialData: Record<string, any> = {};
        variablesList.forEach((variable: TemplateVariable) => {
          if (variable.default_value) {
            initialData[variable.variable_name] = variable.default_value;
          }
        });
        setFormData(initialData);
      } else {
        const errorMsg = getErrorMessage(variablesResponse.error);
        toast({
          title: "Error Loading Variables",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      logError(error, 'fetchTemplateData', { templateId });
      toast({
        title: "Unexpected Error",
        description: "Failed to load template data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [templateId, toast]);

  useEffect(() => {
    fetchTemplateData();
  }, [templateId, fetchTemplateData]);

  // Early return if no templateId
  if (!templateId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Template</h2>
          <p className="text-gray-600 mb-4">No template ID provided.</p>
          <Button onClick={() => router.push('/document-builder')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (variableName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [variableName]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[variableName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[variableName];
        return newErrors;
      });
    }
  };

  // Validation regex patterns
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^\d{8}$/;

  const validateRequiredField = (variable: TemplateVariable, value: any): string | null => {
    if (variable.is_required && (!value || value.toString().trim() === '')) {
      return `${variable.display_name} is required`;
    }
    return null;
  };

  const validateFieldType = (variable: TemplateVariable, value: any): string | null => {
    if (!value) return null;

    switch (variable.variable_type) {
      case 'email':
        return EMAIL_REGEX.test(value) ? null : 'Please enter a valid email address';
      case 'phone':
        return PHONE_REGEX.test(value.replace(/\D/g, '')) ? null : 'Please enter a valid 8-digit Singapore phone number';
      case 'number':
        return !isNaN(Number(value)) ? null : 'Please enter a valid number';
      default:
        return null;
    }
  };

  const validateCustomPattern = (variable: TemplateVariable, value: any): string | null => {
    if (!variable.validation_pattern || !value) return null;

    const regex = new RegExp(variable.validation_pattern);
    if (regex.test(value)) return null;

    if (variable.variable_name.includes('nric')) {
      return 'Please enter a valid NRIC (e.g., S1234567A)';
    }
    if (variable.variable_name.includes('uen')) {
      return 'Please enter a valid UEN number';
    }
    return `Invalid format for ${variable.display_name}`;
  };

  const validateField = (variable: TemplateVariable, value: any): string | null => {
    return validateRequiredField(variable, value) ||
           validateFieldType(variable, value) ||
           validateCustomPattern(variable, value);
  };

  const validateForm = (): boolean => {
    try {
      // Create dynamic schema based on variables
      const schema = createTemplateVariableFormSchema(variables);
      const validation = validateWithSchema(schema, formData);

      if (validation.success) {
        setValidationErrors({});
        return true;
      } else {
        // Convert validation errors to field-specific errors
        const fieldErrors: Record<string, string> = {};
        validation.errors.forEach(error => {
          // Extract field name from error message or use a default approach
          const fieldMatch = error.match(/Path: (\w+)/);
          if (fieldMatch) {
            fieldErrors[fieldMatch[1]] = error;
          } else {
            // Fallback: try to match error to variables
            const matchingVariable = variables.find(v =>
              error.toLowerCase().includes(v.display_name.toLowerCase()) ||
              error.toLowerCase().includes(v.variable_name.toLowerCase())
            );
            if (matchingVariable) {
              fieldErrors[matchingVariable.variable_name] = error;
            }
          }
        });

        setValidationErrors(fieldErrors);
        return false;
      }
    } catch (error) {
      logError(error, 'validateForm', { variables, formData });
      toast({
        title: "Validation Error",
        description: "Unable to validate form. Please check your input.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleGenerate = async (outputFormat: 'docx' | 'pdf') => {
    if (!validateForm()) {
      toast({
        title: "Validation Failed",
        description: "Please fix the errors in the form before generating the document.",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      const response = await templateApi.generateDocument({
        template_id: templateId,
        variables: formData,
        output_format: outputFormat,
        user_id: user?.id
      });

      if (response.success) {
        // For document generation, we need to handle the blob response differently
        // This is a special case where we need to use the raw fetch API
        const rawResponse = await fetch('/api/admin/templates/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
            variables: formData,
            output_format: outputFormat,
            user_id: user?.id
          }),
        });

        if (rawResponse.ok) {
          const blob = await rawResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${template?.title ?? 'document'}.${outputFormat}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "Document Generated",
            description: `Your ${outputFormat.toUpperCase()} document has been downloaded successfully.`,
          });
        } else {
          throw new Error('Failed to download document');
        }
      } else {
        const errorMsg = getErrorMessage(response.error);
        toast({
          title: "Generation Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      logError(error, 'handleGenerate', { templateId, outputFormat, formData });
      toast({
        title: "Generation Error",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getInputType = (variableType: string): string => {
    switch (variableType) {
      case 'number': return 'number';
      case 'date': return 'date';
      case 'email': return 'email';
      default: return 'text';
    }
  };

  const renderFormField = (variable: TemplateVariable) => {
    const value = formData[variable.variable_name] ?? '';
    const hasError = validationErrors[variable.variable_name];

    switch (variable.variable_type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(variable.variable_name, e.target.value)}
            placeholder={variable.description}
            className={hasError ? 'border-red-500' : ''}
            rows={4}
          />
        );
        
      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(val) => handleInputChange(variable.variable_name, val)}
          >
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder={`Select ${variable.display_name}`} />
            </SelectTrigger>
            <SelectContent>
              {variable.select_options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      default:
        return (
          <Input
            type={getInputType(variable.variable_type)}
            value={value}
            onChange={(e) => handleInputChange(variable.variable_name, e.target.value)}
            placeholder={variable.description}
            className={hasError ? 'border-red-500' : ''}
          />
        );
    }
  };

  if (loading) {
    return <TemplateCustomizationPageSkeleton />;
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h2>
          <p className="text-gray-600 mb-4">The requested template could not be found.</p>
          <Button onClick={() => router.push('/document-builder')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Document Builder', href: '/document-builder', current: false },
    { name: template.title, href: `/document-builder/${templateId}`, current: true }
  ];

  return (
    <PageLayout
      title={template.title}
      subtitle={template.description}
      breadcrumbs={breadcrumbs}
      backButton={{
        href: '/document-builder',
        label: 'Back to Templates'
      }}
      showNavigation={true}
      showHeader={true}
    >
      <div className="max-w-7xl mx-auto">
        {/* Template Info Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{template.category}</Badge>
                <Badge variant="outline">{template.difficulty_level}</Badge>
                {template.singapore_compliant && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Singapore Compliant
                  </Badge>
                )}
              </div>
            </div>
            <FileText className="h-16 w-16 text-blue-600" />
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Customize Your Document</CardTitle>
                <CardDescription>
                  Fill in the required information to generate your legal document.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {variables.map((variable) => (
                  <div key={variable.id} className="space-y-2">
                    <Label htmlFor={variable.variable_name}>
                      {variable.display_name}
                      {variable.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderFormField(variable)}
                    {validationErrors[variable.variable_name] && (
                      <p className="text-sm text-red-500">
                        {validationErrors[variable.variable_name]}
                      </p>
                    )}
                    {variable.description && !validationErrors[variable.variable_name] && (
                      <p className="text-sm text-gray-500">{variable.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Document</CardTitle>
                <CardDescription>
                  Choose your preferred format and generate your document.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleGenerate('docx')}
                  disabled={generating}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generating ? 'Generating...' : 'Download DOCX'}
                </Button>
                
                <Button 
                  onClick={() => handleGenerate('pdf')}
                  disabled={generating}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generating ? 'Generating...' : 'Download PDF'}
                </Button>
              </CardContent>
            </Card>

            {template.legal_review_required && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Legal Review Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700">
                    This document may require legal review before use. Consider consulting 
                    with a qualified legal professional.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
