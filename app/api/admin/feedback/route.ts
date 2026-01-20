import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

// GET - Fetch all feedback with filters (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = serviceClient
      .from('feedback')
      .select(`
        id,
        user_id,
        type,
        message,
        page_url,
        status,
        created_at,
        profiles:user_id (
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('message', `%${search}%`);
    }

    const { data: feedback, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    // Get stats
    const [
      { count: newCount },
      { count: reviewingCount },
      { count: resolvedCount },
    ] = await Promise.all([
      serviceClient.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      serviceClient.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'reviewing'),
      serviceClient.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    ]);

    return NextResponse.json({
      feedback: feedback || [],
      stats: {
        new: newCount || 0,
        reviewing: reviewingCount || 0,
        resolved: resolvedCount || 0,
      },
    });
  } catch (error) {
    console.error('Admin feedback fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update feedback status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const validStatuses = ['new', 'reviewing', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const serviceClient = await createServiceClient();

    const { data, error } = await serviceClient
      .from('feedback')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    console.error('Admin feedback update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
