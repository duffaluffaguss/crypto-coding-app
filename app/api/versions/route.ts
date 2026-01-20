import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface CodeVersion {
  id: string;
  project_id: string;
  file_path: string;
  file_id: string | null;
  content: string;
  message: string | null;
  created_at: string;
}

// GET: List versions for a project/file
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const filePath = searchParams.get('filePath');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('code_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by file path if provided
    if (filePath) {
      query = query.eq('file_path', filePath);
    }

    const { data: versions, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
    }

    return NextResponse.json({ versions: versions || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save new version
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, filePath, content, message } = body;

    if (!projectId || !filePath || !content) {
      return NextResponse.json(
        { error: 'Project ID, file path, and content are required' }, 
        { status: 400 }
      );
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Use the save_code_version function for consistency
    const { data: versionId, error } = await supabase
      .rpc('save_code_version', {
        p_project_id: projectId,
        p_file_path: filePath,
        p_content: content,
        p_message: message || null
      });

    if (error) {
      console.error('Failed to save version:', error);
      return NextResponse.json({ error: 'Failed to save version' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      versionId,
      message: 'Version saved successfully' 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Restore a version (update current file content)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { versionId, projectId, filePath } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
    }

    // Get the version content
    const { data: version, error: versionError } = await supabase
      .from('code_versions')
      .select('content, project_id, file_path')
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', version.project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Find the corresponding project file to update
    const { data: projectFile, error: fileError } = await supabase
      .from('project_files')
      .select('id, content')
      .eq('project_id', version.project_id)
      .eq('filename', version.file_path)
      .single();

    if (fileError || !projectFile) {
      return NextResponse.json({ error: 'Project file not found' }, { status: 404 });
    }

    // Save current content as a version before restoring (backup)
    await supabase.rpc('save_code_version', {
      p_project_id: version.project_id,
      p_file_path: version.file_path,
      p_content: projectFile.content,
      p_message: `Backup before restoring to version ${versionId}`
    });

    // Update the project file with version content
    const { error: updateError } = await supabase
      .from('project_files')
      .update({ 
        content: version.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectFile.id);

    if (updateError) {
      console.error('Failed to update file:', updateError);
      return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      content: version.content,
      message: 'Version restored successfully' 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}