// Enhanced Template Variables API
// Singapore Legal Help Platform - Advanced Variables Management

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// GET - Fetch variables with conditional logic for a template
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')
    const includeConditional = searchParams.get('include_conditional') === 'true'
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Fetch template variables with enhanced features
    const { data: variables, error: variablesError } = await supabaseAdmin
      .from('template_variables')
      .select(`
        *,
        template_variable_groups(
          group_name,
          display_label,
          description,
          sort_order,
          is_collapsible,
          is_expanded_by_default
        )
      `)
      .eq('is_active', true)
      .order('field_group', { ascending: true })
      .order('sort_order', { ascending: true })

    if (variablesError) {
      console.error('Variables fetch error:', variablesError)
      return NextResponse.json(
        { error: 'Failed to fetch variables' },
        { status: 500 }
      )
    }

    let conditionalRules = []
    let validationRules = []
    let fieldDependencies = []

    if (includeConditional) {
      // Fetch conditional rules
      const { data: rules } = await supabaseAdmin
        .from('template_conditional_rules')
        .select('*')
        .eq('template_id', templateId)

      conditionalRules = rules || []

      // Fetch validation rules
      const { data: validation } = await supabaseAdmin
        .from('template_validation_rules')
        .select('*')
        .eq('is_active', true)

      validationRules = validation || []

      // Fetch field dependencies
      const { data: dependencies } = await supabaseAdmin
        .from('template_field_dependencies')
        .select('*')

      fieldDependencies = dependencies || []
    }

    // Group variables by field_group
    const groupedVariables = variables.reduce((acc: any, variable: any) => {
      const group = variable.field_group || 'general'
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(variable)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        variables: groupedVariables,
        conditionalRules,
        validationRules,
        fieldDependencies,
        totalVariables: variables.length
      }
    })

  } catch (error) {
    console.error('Enhanced variables API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create conditional rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'conditional_rule':
        return await createConditionalRule(data)
      case 'validation_rule':
        return await createValidationRule(data)
      case 'field_dependency':
        return await createFieldDependency(data)
      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Enhanced variables POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create conditional rule
async function createConditionalRule(data: any) {
  const { error } = await supabaseAdmin
    .from('template_conditional_rules')
    .insert({
      template_id: data.template_id,
      variable_name: data.variable_name,
      condition_type: data.condition_type,
      trigger_variable: data.trigger_variable,
      trigger_operator: data.trigger_operator,
      trigger_value: data.trigger_value
    })

  if (error) {
    console.error('Conditional rule creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conditional rule' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Conditional rule created successfully'
  })
}

// Create validation rule
async function createValidationRule(data: any) {
  const { error } = await supabaseAdmin
    .from('template_validation_rules')
    .insert({
      variable_name: data.variable_name,
      rule_type: data.rule_type,
      rule_value: data.rule_value,
      error_message: data.error_message,
      is_active: true
    })

  if (error) {
    console.error('Validation rule creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create validation rule' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Validation rule created successfully'
  })
}

// Create field dependency
async function createFieldDependency(data: any) {
  const { error } = await supabaseAdmin
    .from('template_field_dependencies')
    .insert({
      parent_field: data.parent_field,
      child_field: data.child_field,
      dependency_type: data.dependency_type,
      condition_value: data.condition_value,
      calculation_formula: data.calculation_formula
    })

  if (error) {
    console.error('Field dependency creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create field dependency' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Field dependency created successfully'
  })
}

// PUT - Update conditional logic
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, data } = body

    let result
    switch (type) {
      case 'conditional_rule':
        result = await supabaseAdmin
          .from('template_conditional_rules')
          .update(data)
          .eq('id', id)
        break
      case 'validation_rule':
        result = await supabaseAdmin
          .from('template_validation_rules')
          .update(data)
          .eq('id', id)
        break
      case 'field_dependency':
        result = await supabaseAdmin
          .from('template_field_dependencies')
          .update(data)
          .eq('id', id)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        )
    }

    if (result.error) {
      console.error('Update error:', result.error)
      return NextResponse.json(
        { error: 'Failed to update record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Record updated successfully'
    })

  } catch (error) {
    console.error('Enhanced variables PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove conditional logic
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    let result
    switch (type) {
      case 'conditional_rule':
        result = await supabaseAdmin
          .from('template_conditional_rules')
          .delete()
          .eq('id', id)
        break
      case 'validation_rule':
        result = await supabaseAdmin
          .from('template_validation_rules')
          .delete()
          .eq('id', id)
        break
      case 'field_dependency':
        result = await supabaseAdmin
          .from('template_field_dependencies')
          .delete()
          .eq('id', id)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        )
    }

    if (result.error) {
      console.error('Delete error:', result.error)
      return NextResponse.json(
        { error: 'Failed to delete record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully'
    })

  } catch (error) {
    console.error('Enhanced variables DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
