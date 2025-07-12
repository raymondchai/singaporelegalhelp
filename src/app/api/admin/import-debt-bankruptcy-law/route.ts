import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Check if debt & bankruptcy law category exists
    const { data: category, error: categoryError } = await supabase
      .from('legal_categories')
      .select('id')
      .eq('name', 'Debt & Bankruptcy Law')
      .single()

    if (categoryError) {
      return NextResponse.json({
        success: false,
        error: 'Debt & Bankruptcy Law category not found',
        details: categoryError.message
      }, { status: 404 })
    }

    // Check if content already exists
    const { data: existingContent, error: contentError } = await supabase
      .from('legal_content')
      .select('id, title')
      .eq('category_id', category.id)

    if (contentError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing content',
        details: contentError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Import status checked successfully',
      data: {
        categoryId: category.id,
        existingContentCount: existingContent?.length || 0,
        existingContent: existingContent || []
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check import status',
      details: error.message
    }, { status: 500 })
  }
}
