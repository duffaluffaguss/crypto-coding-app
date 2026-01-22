import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request data
    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch the original project
    const { data: originalProject, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !originalProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if the project is public OR owned by the user
    const isOwner = originalProject.user_id === user.id;
    const isPublic = originalProject.is_public === true;
    
    if (!isOwner && !isPublic) {
      return NextResponse.json(
        { error: 'You can only clone your own projects or public projects' },
        { status: 403 }
      );
    }

    // Create the cloned project
    const newProjectId = uuidv4();
    const clonedProject = {
      id: newProjectId,
      user_id: user.id, // Always assign to the current user
      name: `${originalProject.name} Copy`,
      description: originalProject.description,
      project_type: originalProject.project_type,
      status: 'draft' as const, // Always start as draft
      created_at: new Date().toISOString(),
      deployed_at: null, // Reset deployment info
      contract_address: null,
      network: null,
      contract_abi: null,
      generated_frontend: null,
      is_public: false, // Private by default
      showcase_description: null,
      likes_count: 0,
      comments_count: 0
    };

    // Insert the cloned project
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert([clonedProject])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating cloned project:', insertError);
      return NextResponse.json(
        { error: 'Failed to create cloned project' },
        { status: 500 }
      );
    }

    // Fetch and clone project files
    const { data: originalFiles, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);

    if (filesError) {
      console.error('Error fetching project files:', filesError);
      return NextResponse.json(
        { error: 'Failed to fetch project files' },
        { status: 500 }
      );
    }

    // Clone project files if any exist
    if (originalFiles && originalFiles.length > 0) {
      const clonedFiles = originalFiles.map(file => ({
        id: uuidv4(),
        project_id: newProjectId,
        filename: file.filename,
        content: file.content,
        file_type: file.file_type,
        is_template: file.is_template,
        updated_at: new Date().toISOString()
      }));

      const { error: filesInsertError } = await supabase
        .from('project_files')
        .insert(clonedFiles);

      if (filesInsertError) {
        console.error('Error cloning project files:', filesInsertError);
        // Note: Project is already created, so we'll continue but log the error
      }
    }

    return NextResponse.json({
      success: true,
      project: newProject,
      filesCloned: originalFiles?.length || 0
    });

  } catch (error) {
    console.error('Error cloning project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}