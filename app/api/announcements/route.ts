import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export type AnnouncementType = 'info' | 'warning' | 'success' | 'feature';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: number;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

// GET - Fetch active announcements
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, type, priority, starts_at, expires_at, created_at')
      .lte('starts_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch announcements' },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements: data || [] });
  } catch (error) {
    console.error('Announcements fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create announcement (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is admin
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, type, priority, starts_at, expires_at } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: AnnouncementType[] = ['info', 'warning', 'success', 'feature'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid announcement type' },
        { status: 400 }
      );
    }

    // Use service client to bypass RLS for admin operations
    const serviceClient = await createServiceClient();

    const { data, error } = await serviceClient
      .from('announcements')
      .insert({
        title: title.trim(),
        content: content.trim(),
        type: type || 'info',
        priority: priority || 0,
        starts_at: starts_at || new Date().toISOString(),
        expires_at: expires_at || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      return NextResponse.json(
        { error: 'Failed to create announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, announcement: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Announcement creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete announcement (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();

    const { error } = await serviceClient
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      return NextResponse.json(
        { error: 'Failed to delete announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Announcement deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
