import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VariableFilters {
  category?: string;
  variable_type?: string;
  singapore_validation?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  template_id?: string;
}

// GET - Fetch template variables with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: VariableFilters = {
      category: searchParams.get('category') || undefined,
      variable_type: searchParams.get('variable_type') || undefined,
      singapore_validation: searchParams.get('singapore_validation') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
      template_id: searchParams.get('template_id') || undefined
    };

    // Handle template-specific variable filtering
    if (filters.template_id) {
      // First, try to get configured variables from template_content
      const { data: templateContent } = await supabaseAdmin
        .from('template_content')
        .select('variables_configured')
        .eq('template_id', filters.template_id)
        .single();

      if (templateContent?.variables_configured && Array.isArray(templateContent.variables_configured)) {
        // If template has configured variables, return only those
        const variableIds = templateContent.variables_configured.map((v: any) => v.variable_id || v.id);

        const { data: variables, error } = await supabaseAdmin
          .from('template_variables')
          .select('*')
          .in('id', variableIds)
          .order('usage_count', { ascending: false });

        if (error) {
          console.error('Template variables fetch error:', error);
          throw error;
        }

        return NextResponse.json({
          variables: variables || [],
          variables_by_category: {},
          most_used_variables: [],
          statistics: {
            total_variables: variables?.length || 0,
            singapore_validation_count: 0,
            required_variables_count: 0,
            type_distribution: {}
          },
          total_count: variables?.length || 0,
          filters_applied: filters
        });
      } else {
        // If no configured variables, return template-category-specific variables
        const { data: template } = await supabaseAdmin
          .from('legal_document_templates')
          .select('category')
          .eq('id', filters.template_id)
          .single();

        if (template?.category) {
          // Map template categories to variable categories
          const categoryMapping: Record<string, string[]> = {
            'Family Law': ['personal', 'legal'],
            'Employment Law': ['personal', 'company', 'financial', 'legal'],
            'Corporate Law': ['company', 'legal', 'financial'],
            'Contract Law': ['personal', 'company', 'legal', 'financial'],
            'Property Law': ['personal', 'legal', 'financial']
          };

          const relevantCategories = categoryMapping[template.category] || ['personal', 'legal'];
          filters.category = undefined; // Clear category filter to use our custom logic

          let query = supabaseAdmin
            .from('template_variables')
            .select('*')
            .in('category', relevantCategories)
            .order('usage_count', { ascending: false });

          // Apply other filters
          if (filters.variable_type && filters.variable_type !== 'all') {
            query = query.eq('variable_type', filters.variable_type);
          }

          if (filters.singapore_validation !== undefined) {
            query = query.eq('singapore_validation', filters.singapore_validation);
          }

          if (filters.search) {
            query = query.or(`variable_name.ilike.%${filters.search}%,display_label.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
          }

          // Apply pagination
          if (filters.limit) {
            query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
          }

          const { data: variables, error, count } = await query;

          if (error) {
            console.error('Template category variables fetch error:', error);
            throw error;
          }

          // Process and return results
          const variablesByCategory = (variables || []).reduce((acc, variable) => {
            if (!acc[variable.category]) {
              acc[variable.category] = [];
            }
            acc[variable.category].push(variable);
            return acc;
          }, {} as Record<string, any[]>);

          const totalVariables = variables?.length || 0;
          const singaporeValidationCount = variables?.filter(v => v.singapore_validation).length || 0;
          const requiredVariablesCount = variables?.filter(v => v.is_required).length || 0;

          const mostUsedVariables = (variables || [])
            .sort((a, b) => b.usage_count - a.usage_count)
            .slice(0, 10);

          const typeDistribution = (variables || []).reduce((acc, variable) => {
            acc[variable.variable_type] = (acc[variable.variable_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return NextResponse.json({
            variables: variables || [],
            variables_by_category: variablesByCategory,
            most_used_variables: mostUsedVariables,
            statistics: {
              total_variables: totalVariables,
              singapore_validation_count: singaporeValidationCount,
              required_variables_count: requiredVariablesCount,
              type_distribution: typeDistribution
            },
            total_count: count || totalVariables,
            filters_applied: filters
          });
        }
      }
    }

    // Build query for non-template-specific requests
    let query = supabaseAdmin
      .from('template_variables')
      .select('*')
      .order('usage_count', { ascending: false });

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.variable_type && filters.variable_type !== 'all') {
      query = query.eq('variable_type', filters.variable_type);
    }

    if (filters.singapore_validation !== undefined) {
      query = query.eq('singapore_validation', filters.singapore_validation);
    }

    if (filters.search) {
      query = query.or(`variable_name.ilike.%${filters.search}%,display_label.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
    }

    const { data: variables, error, count } = await query;

    if (error) {
      console.error('Variables fetch error:', error);
      throw error;
    }

    // Group variables by category for easier frontend consumption
    const variablesByCategory = (variables || []).reduce((acc, variable) => {
      if (!acc[variable.category]) {
        acc[variable.category] = [];
      }
      acc[variable.category].push(variable);
      return acc;
    }, {} as Record<string, any[]>);

    // Get usage statistics
    const totalVariables = variables?.length || 0;
    const singaporeValidationCount = variables?.filter(v => v.singapore_validation).length || 0;
    const requiredVariablesCount = variables?.filter(v => v.is_required).length || 0;

    // Get most used variables
    const mostUsedVariables = (variables || [])
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    // Get variable type distribution
    const typeDistribution = (variables || []).reduce((acc, variable) => {
      acc[variable.variable_type] = (acc[variable.variable_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      variables: variables || [],
      variables_by_category: variablesByCategory,
      most_used_variables: mostUsedVariables,
      statistics: {
        total_variables: totalVariables,
        singapore_validation_count: singaporeValidationCount,
        required_variables_count: requiredVariablesCount,
        type_distribution: typeDistribution
      },
      total_count: count || totalVariables,
      filters_applied: filters
    });

  } catch (error) {
    console.error('Variables API failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variables' },
      { status: 500 }
    );
  }
}

// POST - Create new variable
export async function POST(request: NextRequest) {
  try {
    const variableData = await request.json();

    // Validate required fields
    if (!variableData.variable_name || !variableData.display_label || !variableData.variable_type || !variableData.category) {
      return NextResponse.json(
        { error: 'Variable name, display label, type, and category are required' },
        { status: 400 }
      );
    }

    // Check if variable name already exists
    const { data: existingVariable } = await supabaseAdmin
      .from('template_variables')
      .select('id')
      .eq('variable_name', variableData.variable_name)
      .single();

    if (existingVariable) {
      return NextResponse.json(
        { error: 'Variable name already exists' },
        { status: 400 }
      );
    }

    // Insert variable
    const { data: variable, error } = await supabaseAdmin
      .from('template_variables')
      .insert({
        variable_name: variableData.variable_name,
        display_label: variableData.display_label,
        variable_type: variableData.variable_type,
        is_required: variableData.is_required || false,
        validation_pattern: variableData.validation_pattern || '',
        validation_message: variableData.validation_message || '',
        select_options: variableData.select_options || null,
        category: variableData.category,
        singapore_validation: variableData.singapore_validation || false,
        description: variableData.description || '',
        usage_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Variable creation error:', error);
      throw error;
    }

    return NextResponse.json({
      variable,
      message: 'Variable created successfully'
    });

  } catch (error) {
    console.error('Variable creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create variable' },
      { status: 500 }
    );
  }
}

// PUT - Update variable
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const variableId = searchParams.get('id');
    
    if (!variableId) {
      return NextResponse.json(
        { error: 'Variable ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();

    // If updating variable_name, check for conflicts
    if (updateData.variable_name) {
      const { data: existingVariable } = await supabaseAdmin
        .from('template_variables')
        .select('id')
        .eq('variable_name', updateData.variable_name)
        .neq('id', variableId)
        .single();

      if (existingVariable) {
        return NextResponse.json(
          { error: 'Variable name already exists' },
          { status: 400 }
        );
      }
    }

    const { data: variable, error } = await supabaseAdmin
      .from('template_variables')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', variableId)
      .select()
      .single();

    if (error) {
      console.error('Variable update error:', error);
      throw error;
    }

    return NextResponse.json({
      variable,
      message: 'Variable updated successfully'
    });

  } catch (error) {
    console.error('Variable update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update variable' },
      { status: 500 }
    );
  }
}

// DELETE - Delete variable
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const variableId = searchParams.get('id');
    
    if (!variableId) {
      return NextResponse.json(
        { error: 'Variable ID is required' },
        { status: 400 }
      );
    }

    // Check if variable is being used in any templates
    const { data: usageCheck } = await supabaseAdmin
      .from('template_content')
      .select('id')
      .contains('variables_configured', [{ variable_id: variableId }])
      .limit(1);

    if (usageCheck && usageCheck.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete variable that is being used in templates' },
        { status: 400 }
      );
    }

    // Delete variable
    const { error } = await supabaseAdmin
      .from('template_variables')
      .delete()
      .eq('id', variableId);

    if (error) {
      console.error('Variable deletion error:', error);
      throw error;
    }

    return NextResponse.json({
      message: 'Variable deleted successfully'
    });

  } catch (error) {
    console.error('Variable deletion failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete variable' },
      { status: 500 }
    );
  }
}
