import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchHistoryEntry {
  id: string;
  query: string;
  results_count: number;
  filters_used?: Record<string, any>;
  search_timestamp: string;
  is_saved: boolean;
  saved_name?: string;
}

// GET - Retrieve user search history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('x-user-id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const savedOnly = searchParams.get('saved_only') === 'true';
    const query = searchParams.get('query');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let queryBuilder = supabase
      .from('search_user_history')
      .select('*')
      .eq('user_id', userId)
      .order('search_timestamp', { ascending: false })
      .limit(limit);

    if (savedOnly) {
      queryBuilder = queryBuilder.eq('is_saved', true);
    }

    if (query) {
      queryBuilder = queryBuilder.ilike('query', `%${query}%`);
    }

    const { data: history, error } = await queryBuilder;

    if (error) {
      console.error('Search history fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch search history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: history || [],
      total_count: history?.length || 0
    });

  } catch (error) {
    console.error('Search history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add search to user history
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { query, results_count, filters_used } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if this exact query already exists in recent history (last 24 hours)
    const { data: existingEntry } = await supabase
      .from('search_user_history')
      .select('id')
      .eq('user_id', userId)
      .eq('query', query.trim())
      .gte('search_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existingEntry) {
      // Update existing entry timestamp
      const { error: updateError } = await supabase
        .from('search_user_history')
        .update({
          search_timestamp: new Date().toISOString(),
          results_count: results_count || 0,
          filters_used: filters_used || {}
        })
        .eq('id', existingEntry.id);

      if (updateError) {
        console.error('Search history update error:', updateError);
      }

      return NextResponse.json({ success: true, updated: true });
    }

    // Insert new search history entry
    const { error: insertError } = await supabase
      .from('search_user_history')
      .insert({
        user_id: userId,
        query: query.trim(),
        results_count: results_count || 0,
        filters_used: filters_used || {},
        search_timestamp: new Date().toISOString(),
        is_saved: false
      });

    if (insertError) {
      console.error('Search history insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save search history' },
        { status: 500 }
      );
    }

    // Clean up old history entries (keep only last 100 per user)
    try {
      const { data: oldEntries } = await supabase
        .from('search_user_history')
        .select('id')
        .eq('user_id', userId)
        .eq('is_saved', false)
        .order('search_timestamp', { ascending: false })
        .range(100, 1000);

      if (oldEntries && oldEntries.length > 0) {
        await supabase
          .from('search_user_history')
          .delete()
          .in('id', oldEntries.map(entry => entry.id));
      }
    } catch (cleanupError) {
      console.error('Search history cleanup error:', cleanupError);
      // Don't fail the request if cleanup fails
    }

    return NextResponse.json({ success: true, created: true });

  } catch (error) {
    console.error('Search history POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update search history entry (save/unsave, rename)
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { id, is_saved, saved_name } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof is_saved === 'boolean') {
      updateData.is_saved = is_saved;
    }
    if (saved_name !== undefined) {
      updateData.saved_name = saved_name;
    }

    const { error } = await supabase
      .from('search_user_history')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Search history update error:', error);
      return NextResponse.json(
        { error: 'Failed to update search history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Search history PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove search history entry
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clear_all') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (clearAll) {
      // Clear all non-saved history
      const { error } = await supabase
        .from('search_user_history')
        .delete()
        .eq('user_id', userId)
        .eq('is_saved', false);

      if (error) {
        console.error('Search history clear error:', error);
        return NextResponse.json(
          { error: 'Failed to clear search history' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, cleared_all: true });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('search_user_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Search history delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete search history entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Search history DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
