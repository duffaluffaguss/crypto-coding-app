import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { CollaboratorInvite, ProjectCollaborator } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get collaborators for the project with user profiles
    const { data: collaborators, error: collaboratorsError } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        user_profile:profiles!project_collaborators_user_id_fkey(*),
        inviter_profile:profiles!project_collaborators_invited_by_fkey(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (collaboratorsError) {
      console.error('Error fetching collaborators:', collaboratorsError);
      return NextResponse.json(
        { error: 'Failed to fetch collaborators' },
        { status: 500 }
      );
    }

    // Add is_pending field
    const enhancedCollaborators = collaborators?.map(collaborator => ({
      ...collaborator,
      is_pending: collaborator.accepted_at === null
    })) || [];

    return NextResponse.json({ collaborators: enhancedCollaborators });
  } catch (error) {
    console.error('Error in GET /api/collaborators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CollaboratorInvite = await request.json();

    const { project_id, user_email, user_id, role } = body;

    if (!project_id || !role || (!user_email && !user_id)) {
      return NextResponse.json(
        { error: 'Project ID, role, and either user email or user ID are required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is project owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only project owners can invite collaborators' },
        { status: 403 }
      );
    }

    let targetUserId = user_id;

    // If email provided, find user by email
    if (user_email && !user_id) {
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user_email)
        .single();

      if (userError || !targetUser) {
        return NextResponse.json(
          { error: 'User not found with that email address' },
          { status: 404 }
        );
      }

      targetUserId = targetUser.id;
    }

    // Check if user is already a collaborator
    const { data: existingCollaborator, error: checkError } = await supabase
      .from('project_collaborators')
      .select('id, accepted_at')
      .eq('project_id', project_id)
      .eq('user_id', targetUserId)
      .single();

    if (existingCollaborator) {
      if (existingCollaborator.accepted_at) {
        return NextResponse.json(
          { error: 'User is already a collaborator on this project' },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: 'User already has a pending invitation for this project' },
          { status: 409 }
        );
      }
    }

    // Create collaboration invitation
    const { data: newCollaborator, error: insertError } = await supabase
      .from('project_collaborators')
      .insert({
        project_id,
        user_id: targetUserId,
        role,
        invited_by: user.id
      })
      .select(`
        *,
        user_profile:profiles!project_collaborators_user_id_fkey(*),
        inviter_profile:profiles!project_collaborators_invited_by_fkey(*)
      `)
      .single();

    if (insertError) {
      console.error('Error creating collaborator invitation:', insertError);
      return NextResponse.json(
        { error: 'Failed to send invitation' },
        { status: 500 }
      );
    }

    const enhancedCollaborator = {
      ...newCollaborator,
      is_pending: newCollaborator.accepted_at === null
    };

    return NextResponse.json(
      { 
        message: 'Collaboration invitation sent successfully',
        collaborator: enhancedCollaborator
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/collaborators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { collaborator_id, action, role } = body;

    if (!collaborator_id || !action) {
      return NextResponse.json(
        { error: 'Collaborator ID and action are required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get collaborator details
    const { data: collaborator, error: collaboratorError } = await supabase
      .from('project_collaborators')
      .select('*, projects!inner(user_id)')
      .eq('id', collaborator_id)
      .single();

    if (collaboratorError || !collaborator) {
      return NextResponse.json(
        { error: 'Collaborator not found' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // User accepting their own invitation
      if (collaborator.user_id !== user.id) {
        return NextResponse.json(
          { error: 'You can only accept your own invitations' },
          { status: 403 }
        );
      }

      if (collaborator.accepted_at) {
        return NextResponse.json(
          { error: 'Invitation already accepted' },
          { status: 409 }
        );
      }

      const { error: updateError } = await supabase
        .from('project_collaborators')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', collaborator_id);

      if (updateError) {
        console.error('Error accepting invitation:', updateError);
        return NextResponse.json(
          { error: 'Failed to accept invitation' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Invitation accepted successfully' });
    }

    if (action === 'update_role') {
      // Project owner updating collaborator role
      if (collaborator.projects?.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Only project owners can update collaborator roles' },
          { status: 403 }
        );
      }

      if (!role || !['editor', 'viewer'].includes(role)) {
        return NextResponse.json(
          { error: 'Valid role is required (editor or viewer)' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('project_collaborators')
        .update({ role })
        .eq('id', collaborator_id);

      if (updateError) {
        console.error('Error updating role:', updateError);
        return NextResponse.json(
          { error: 'Failed to update role' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Role updated successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PUT /api/collaborators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const collaboratorId = searchParams.get('collaboratorId');

    if (!collaboratorId) {
      return NextResponse.json(
        { error: 'Collaborator ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get collaborator details
    const { data: collaborator, error: collaboratorError } = await supabase
      .from('project_collaborators')
      .select('*, projects!inner(user_id)')
      .eq('id', collaboratorId)
      .single();

    if (collaboratorError || !collaborator) {
      return NextResponse.json(
        { error: 'Collaborator not found' },
        { status: 404 }
      );
    }

    // Check permissions: project owner can remove anyone, users can remove themselves
    const isProjectOwner = collaborator.projects?.user_id === user.id;
    const isOwnCollaboration = collaborator.user_id === user.id;

    if (!isProjectOwner && !isOwnCollaboration) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove this collaborator' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (deleteError) {
      console.error('Error removing collaborator:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove collaborator' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/collaborators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}