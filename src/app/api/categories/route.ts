import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('legal_categories')
      .select('id, name, description, icon, color, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Categories fetch error:', error);
      throw error;
    }

    return NextResponse.json({
      categories: categories || [],
      total_count: categories?.length || 0
    });

  } catch (error) {
    console.error('Categories API failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
