import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TemplateFilters {
  id?: string;
  category?: string;
  status?: string;
  subscription_tier?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// GET - Fetch templates with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: TemplateFilters = {
      id: searchParams.get('id') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      subscription_tier: searchParams.get('subscription_tier') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Build query
    let query = supabaseAdmin
      .from('legal_document_templates')
      .select(`
        id,
        title,
        description,
        category,
        subcategory,
        file_name,
        file_size,
        subscription_tier,
        price_sgd,
        difficulty_level,
        estimated_time_minutes,
        singapore_compliant,
        legal_review_required,
        status,
        created_at,
        updated_at,
        created_by,
        approved_by,
        approved_at
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.id) {
      query = query.eq('id', filters.id);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.subscription_tier && filters.subscription_tier !== 'all') {
      query = query.eq('subscription_tier', filters.subscription_tier);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
    }

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('Templates fetch error:', error);
      throw error;
    }

    // Get usage statistics for each template
    const templatesWithStats = await Promise.all(
      (templates || []).map(async (template) => {
        const { data: usageData } = await supabaseAdmin
          .from('template_usage')
          .select('action_type')
          .eq('template_id', template.id);

        const usage_count = usageData?.filter(u => u.action_type === 'download').length || 0;
        const view_count = usageData?.filter(u => u.action_type === 'view').length || 0;

        return {
          ...template,
          usage_count,
          view_count,
          file_size_formatted: formatFileSize(template.file_size),
          last_updated: template.updated_at
        };
      })
    );

    return NextResponse.json({
      templates: templatesWithStats,
      total_count: count || templatesWithStats.length,
      filters_applied: filters
    });

  } catch (error) {
    console.error('Templates API failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const templateData = await request.json();

    // Validate required fields
    if (!templateData.title || !templateData.category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Insert template
    const { data: template, error } = await supabaseAdmin
      .from('legal_document_templates')
      .insert({
        title: templateData.title,
        description: templateData.description || '',
        category: templateData.category,
        subcategory: templateData.subcategory || null,
        file_name: templateData.file_name,
        file_path: templateData.file_path,
        file_size: templateData.file_size,
        file_type: templateData.file_type,
        subscription_tier: templateData.subscription_tier || 'free',
        price_sgd: templateData.price_sgd || 0,
        difficulty_level: templateData.difficulty_level || 'basic',
        estimated_time_minutes: templateData.estimated_time_minutes || 15,
        singapore_compliant: templateData.singapore_compliant !== false,
        legal_review_required: templateData.legal_review_required !== false,
        status: templateData.status || 'draft',
        created_by: templateData.created_by || null
      })
      .select()
      .single();

    if (error) {
      console.error('Template creation error:', error);
      throw error;
    }

    // Create template content record
    if (template) {
      await supabaseAdmin
        .from('template_content')
        .insert({
          template_id: template.id,
          processing_status: 'pending'
        });
    }

    return NextResponse.json({
      template,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Template creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();

    const { data: template, error } = await supabaseAdmin
      .from('legal_document_templates')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Template update error:', error);
      throw error;
    }

    return NextResponse.json({
      template,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Template update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Delete template (cascade will handle related records)
    const { error } = await supabaseAdmin
      .from('legal_document_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Template deletion error:', error);
      throw error;
    }

    return NextResponse.json({
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Template deletion failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
