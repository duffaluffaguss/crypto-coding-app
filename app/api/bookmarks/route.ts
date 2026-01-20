import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  
  const itemType = searchParams.get('itemType');
  const itemId = searchParams.get('itemId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If itemType and itemId are provided, check if specific item is bookmarked
    if (itemType && itemId) {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ isBookmarked: !!data });
    }

    // Otherwise, get user's bookmarks
    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: data });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemType, itemId } = await request.json();

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'itemType and itemId are required' }, 
        { status: 400 }
      );
    }

    // Validate item type
    const validTypes = ['template', 'project', 'lesson', 'snippet'];
    if (!validTypes.includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid item type' }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate bookmark
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Item already bookmarked' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmark: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  
  const itemType = searchParams.get('itemType');
  const itemId = searchParams.get('itemId');
  const bookmarkId = searchParams.get('id');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id);

    if (bookmarkId) {
      // Delete by bookmark ID
      query = query.eq('id', bookmarkId);
    } else if (itemType && itemId) {
      // Delete by item type and ID
      query = query.eq('item_type', itemType).eq('item_id', itemId);
    } else {
      return NextResponse.json(
        { error: 'Either bookmark id or itemType+itemId required' }, 
        { status: 400 }
      );
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bookmark removed' });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}