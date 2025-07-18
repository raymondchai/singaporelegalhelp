// Enhanced Document Generation API
// Singapore Legal Help Platform - Advanced Generation Features

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { EnhancedDocumentGenerator } from '@/lib/enhanced-document-generator'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface EnhancedGenerateRequest {
  template_id: string
  variables: Record<string, any>
  output_format: 'docx' | 'pdf'
  user_id?: string
  generate_version?: boolean
  include_watermark?: boolean
  legal_notices?: string[]
  save_to_history?: boolean
}

// POST - Enhanced document generation
export async function POST(request: NextRequest) {
  try {
    const body: EnhancedGenerateRequest = await request.json()
    const { 
      template_id, 
      variables, 
      output_format, 
      user_id,
      generate_version = true,
      include_watermark = false,
      legal_notices = [],
      save_to_history = true
    } = body

    // Validate required fields
    if (!template_id || !variables || !output_format) {
      return NextResponse.json(
        { error: 'Template ID, variables, and output format are required' },
        { status: 400 }
      )
    }

    // Fetch template from database
    const { data: template, error: templateError } = await supabaseAdmin
      .from('legal_document_templates')
      .select(`
        id,
        title,
        description,
        category,
        file_name,
        file_path,
        subscription_tier,
        singapore_compliant,
        legal_review_required,
        template_content (
          id,
          file_content,
          processing_status
        )
      `)
      .eq('id', template_id)
      .eq('status', 'published')
      .single()

    if (templateError || !template) {
      console.error('Template fetch error:', templateError)
      return NextResponse.json(
        { error: 'Template not found or not published' },
        { status: 404 }
      )
    }

    // Check if template content exists
    if (!template.template_content || template.template_content.length === 0) {
      return NextResponse.json(
        { error: 'Template content not found' },
        { status: 404 }
      )
    }

    const templateContent = template.template_content[0]
    if (templateContent.processing_status !== 'completed') {
      return NextResponse.json(
        { error: 'Template is still being processed' },
        { status: 400 }
      )
    }

    // Create mock template buffer (in production, this would come from storage)
    const templateBuffer = Buffer.from(createMockDocxTemplate(template.title, variables))

    // Add Singapore-specific legal notices
    const singaporeNotices = [
      'This document is governed by Singapore law.',
      'Please review all terms carefully before signing.',
      'Consult a qualified lawyer for complex legal matters.'
    ]

    if (template.legal_review_required) {
      singaporeNotices.push('Legal review is recommended for this document type.')
    }

    if (template.singapore_compliant) {
      singaporeNotices.push('This template complies with Singapore legal requirements.')
    }

    // Generate document using enhanced generator
    const result = await EnhancedDocumentGenerator.generateDocument({
      templateBuffer,
      variables,
      outputFormat: output_format,
      templateTitle: template.title,
      templateId: template_id,
      userId: user_id,
      generateVersion: generate_version,
      includeWatermark: include_watermark,
      legalNotices: [...singaporeNotices, ...legal_notices]
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Document generation failed' },
        { status: 500 }
      )
    }

    // Save to generation history if requested
    if (save_to_history && user_id) {
      await saveGenerationHistory({
        template_id,
        user_id,
        variables,
        output_format,
        filename: result.filename,
        version: result.version,
        generated_at: result.generatedAt
      })
    }

    // Update template usage statistics
    await updateTemplateUsage(template_id, user_id)

    // Return the generated document
    const headers = new Headers()
    headers.set('Content-Type', result.mimeType)
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)
    headers.set('X-Document-Version', result.version || '1.0')
    headers.set('X-Generated-At', result.generatedAt)

    return new NextResponse(result.buffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Enhanced document generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error during document generation' },
      { status: 500 }
    )
  }
}

// GET - Get generation history for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const templateId = searchParams.get('template_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('document_generation_history')
      .select(`
        *,
        legal_document_templates (
          title,
          category
        )
      `)
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(limit)

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data: history, error } = await query

    if (error) {
      console.error('History fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch generation history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: history || [],
      total: history?.length || 0
    })

  } catch (error) {
    console.error('Generation history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to save generation history
async function saveGenerationHistory(data: {
  template_id: string
  user_id: string
  variables: Record<string, any>
  output_format: string
  filename: string
  version?: string
  generated_at: string
}) {
  try {
    const { error } = await supabaseAdmin
      .from('document_generation_history')
      .insert({
        template_id: data.template_id,
        user_id: data.user_id,
        variables: data.variables,
        output_format: data.output_format,
        filename: data.filename,
        version: data.version || '1.0',
        generated_at: data.generated_at
      })

    if (error) {
      console.error('Failed to save generation history:', error)
    }
  } catch (error) {
    console.error('Generation history save error:', error)
  }
}

// Helper function to update template usage statistics
async function updateTemplateUsage(templateId: string, userId?: string) {
  try {
    // Update template usage count
    const { error: usageError } = await supabaseAdmin
      .from('template_usage')
      .insert({
        template_id: templateId,
        user_id: userId,
        usage_type: 'generation',
        usage_date: new Date().toISOString()
      })

    if (usageError) {
      console.error('Failed to update template usage:', usageError)
    }

    // Update template statistics
    await supabaseAdmin.rpc('increment_template_usage', {
      template_id: templateId
    })

  } catch (error) {
    console.error('Template usage update error:', error)
  }
}

// Helper function to create mock DOCX template (replace with actual file loading in production)
function createMockDocxTemplate(title: string, variables: Record<string, any>): string {
  // This is a simplified mock - in production, load actual DOCX file from storage
  const content = `
    Document Title: ${title}
    
    Generated Variables:
    ${Object.entries(variables).map(([key, value]) => `${key}: ${value}`).join('\n')}
    
    This is a mock template for development purposes.
    In production, this would be replaced with actual DOCX template processing.
  `
  
  return content
}

// DELETE - Clear generation history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const historyId = searchParams.get('history_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('document_generation_history')
      .delete()
      .eq('user_id', userId)

    if (historyId) {
      query = query.eq('id', historyId)
    }

    const { error } = await query

    if (error) {
      console.error('History deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete generation history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Generation history deleted successfully'
    })

  } catch (error) {
    console.error('Generation history deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
