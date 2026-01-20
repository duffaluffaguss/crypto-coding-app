import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CertificateStyleConfig } from '@/lib/certificate-styles';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// GET - Retrieve saved certificate style
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if certificate_styles table exists, if not return null
    const { data: style, error } = await supabase
      .from('certificate_styles')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Style fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch style' },
        { status: 500 }
      );
    }

    return NextResponse.json({ style: style || null });
  } catch (error) {
    console.error('Style fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch style' },
      { status: 500 }
    );
  }
}

// POST - Save certificate style
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify project exists and user owns it
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only customize your own projects' },
        { status: 403 }
      );
    }

    // Verify project is completed
    const isCompleted = project.status === 'deployed' || project.status === 'published';
    if (!isCompleted) {
      return NextResponse.json(
        { error: 'Certificate not available - project not completed' },
        { status: 400 }
      );
    }

    // Parse the style config from request body
    const body = await request.json();
    const styleConfig: CertificateStyleConfig = body.style;

    if (!styleConfig) {
      return NextResponse.json(
        { error: 'Style configuration is required' },
        { status: 400 }
      );
    }

    // Validate basic structure
    if (!styleConfig.id || !styleConfig.background || !styleConfig.border) {
      return NextResponse.json(
        { error: 'Invalid style configuration' },
        { status: 400 }
      );
    }

    // Upsert the style (insert or update)
    const { data: savedStyle, error: upsertError } = await supabase
      .from('certificate_styles')
      .upsert(
        {
          project_id: projectId,
          user_id: user.id,
          style_config: styleConfig,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,user_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Style save error:', upsertError);
      
      // If table doesn't exist, try to handle gracefully
      if (upsertError.code === '42P01') {
        // Table doesn't exist - still return success but log warning
        console.warn('certificate_styles table does not exist. Style saved to localStorage only.');
        return NextResponse.json({
          success: true,
          style: styleConfig,
          warning: 'Style saved locally only - database table not configured',
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to save style' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      style: savedStyle?.style_config || styleConfig,
    });
  } catch (error) {
    console.error('Style save error:', error);
    return NextResponse.json(
      { error: 'Failed to save style' },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom style
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('certificate_styles')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Style delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete style' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Style delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete style' },
      { status: 500 }
    );
  }
}
