import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

// GET - Fetch all feature flags (public access)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Everyone can read feature flags
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching feature flags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feature flags' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new feature flag (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check authentication
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privileges
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      key,
      name,
      description,
      enabled = false,
      rollout_percentage = 0,
      user_ids = [],
    } = body;

    // Validate required fields
    if (!key || !name) {
      return NextResponse.json(
        { error: 'Key and name are required' },
        { status: 400 }
      );
    }

    // Validate rollout percentage
    if (rollout_percentage < 0 || rollout_percentage > 100) {
      return NextResponse.json(
        { error: 'Rollout percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Use service client for admin operations
    const serviceClient = await createServiceClient();

    // Create the feature flag
    const { data, error } = await serviceClient
      .from('feature_flags')
      .insert([
        {
          key,
          name,
          description,
          enabled,
          rollout_percentage,
          user_ids,
        },
      ])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Feature flag key already exists' },
          { status: 409 }
        );
      }

      console.error('Error creating feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to create feature flag' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing feature flag (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check authentication
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privileges
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      id,
      key,
      name,
      description,
      enabled,
      rollout_percentage,
      user_ids,
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Feature flag ID is required' },
        { status: 400 }
      );
    }

    // Validate rollout percentage if provided
    if (rollout_percentage !== undefined && (rollout_percentage < 0 || rollout_percentage > 100)) {
      return NextResponse.json(
        { error: 'Rollout percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (key !== undefined) updateData.key = key;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (rollout_percentage !== undefined) updateData.rollout_percentage = rollout_percentage;
    if (user_ids !== undefined) updateData.user_ids = user_ids;

    // Use service client for admin operations
    const serviceClient = await createServiceClient();

    // Update the feature flag
    const { data, error } = await serviceClient
      .from('feature_flags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Feature flag key already exists' },
          { status: 409 }
        );
      }

      console.error('Error updating feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to update feature flag' },
        { status: 500 }
      );
    }

    // If no rows were updated, flag doesn't exist
    if (!data) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a feature flag (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check authentication
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privileges
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get flag ID from search params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Feature flag ID is required' },
        { status: 400 }
      );
    }

    // Use service client for admin operations
    const serviceClient = await createServiceClient();

    // Delete the feature flag
    const { error } = await serviceClient
      .from('feature_flags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to delete feature flag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Feature flag deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}