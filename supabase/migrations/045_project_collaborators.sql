-- Create project_collaborators table for managing project collaboration
CREATE TABLE project_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Enable RLS on project_collaborators
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Indexes for better performance
CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX idx_project_collaborators_invited_by ON project_collaborators(invited_by);
CREATE INDEX idx_project_collaborators_role ON project_collaborators(role);
CREATE INDEX idx_project_collaborators_accepted_at ON project_collaborators(accepted_at);

-- RLS policies for project_collaborators

-- Project owners and collaborators can view collaborators
CREATE POLICY "Collaborators can view project collaborators" ON project_collaborators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_collaborators.project_id 
            AND p.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM project_collaborators pc 
            WHERE pc.project_id = project_collaborators.project_id 
            AND pc.user_id = auth.uid()
            AND pc.accepted_at IS NOT NULL
        )
    );

-- Only project owners can add collaborators
CREATE POLICY "Project owners can invite collaborators" ON project_collaborators
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_id 
            AND p.user_id = auth.uid()
        )
        AND invited_by = auth.uid()
    );

-- Invited users can accept invitations (update accepted_at)
-- Project owners can update roles and remove collaborators
CREATE POLICY "Update collaborator invitations and roles" ON project_collaborators
    FOR UPDATE USING (
        -- User can accept their own invitation
        (user_id = auth.uid() AND accepted_at IS NULL) OR
        -- Project owner can update any collaborator
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_id 
            AND p.user_id = auth.uid()
        )
    );

-- Project owners and users themselves can remove collaborators
CREATE POLICY "Remove project collaborators" ON project_collaborators
    FOR DELETE USING (
        -- Project owner can remove any collaborator
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_id 
            AND p.user_id = auth.uid()
        ) OR
        -- Users can remove themselves
        user_id = auth.uid()
    );

-- Update projects RLS to allow collaborator access

-- Drop existing policies if they exist and recreate with collaborator access
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Users can view their own projects, collaborated projects, and public projects
CREATE POLICY "Users can view accessible projects" ON projects
    FOR SELECT USING (
        -- Own projects
        user_id = auth.uid() OR
        -- Collaborated projects (accepted invitations)
        EXISTS (
            SELECT 1 FROM project_collaborators pc 
            WHERE pc.project_id = projects.id 
            AND pc.user_id = auth.uid()
            AND pc.accepted_at IS NOT NULL
        ) OR
        -- Public projects
        is_public = true OR
        -- Published/deployed projects
        status IN ('deployed', 'published')
    );

-- Users can create projects
CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Project owners and editors can update projects
CREATE POLICY "Project owners and editors can update projects" ON projects
    FOR UPDATE USING (
        -- Project owner
        user_id = auth.uid() OR
        -- Collaborator with editor role
        EXISTS (
            SELECT 1 FROM project_collaborators pc 
            WHERE pc.project_id = projects.id 
            AND pc.user_id = auth.uid()
            AND pc.role = 'editor'
            AND pc.accepted_at IS NOT NULL
        )
    );

-- Only project owners can delete projects
CREATE POLICY "Project owners can delete projects" ON projects
    FOR DELETE USING (user_id = auth.uid());

-- Update project_files RLS to allow collaborator access

-- Drop existing policies and recreate with collaborator access
DROP POLICY IF EXISTS "Users can view their project files" ON project_files;
DROP POLICY IF EXISTS "Users can create project files" ON project_files;
DROP POLICY IF EXISTS "Users can update their project files" ON project_files;
DROP POLICY IF EXISTS "Users can delete their project files" ON project_files;

-- Users can view files for accessible projects
CREATE POLICY "Users can view accessible project files" ON project_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_files.project_id 
            AND (
                -- Own project
                p.user_id = auth.uid() OR
                -- Collaborated project
                EXISTS (
                    SELECT 1 FROM project_collaborators pc 
                    WHERE pc.project_id = p.id 
                    AND pc.user_id = auth.uid()
                    AND pc.accepted_at IS NOT NULL
                ) OR
                -- Public project
                p.is_public = true OR
                -- Published project
                p.status IN ('deployed', 'published')
            )
        )
    );

-- Project owners and editors can create files
CREATE POLICY "Project owners and editors can create files" ON project_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_id 
            AND (
                -- Project owner
                p.user_id = auth.uid() OR
                -- Editor collaborator
                EXISTS (
                    SELECT 1 FROM project_collaborators pc 
                    WHERE pc.project_id = p.id 
                    AND pc.user_id = auth.uid()
                    AND pc.role = 'editor'
                    AND pc.accepted_at IS NOT NULL
                )
            )
        )
    );

-- Project owners and editors can update files
CREATE POLICY "Project owners and editors can update files" ON project_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_files.project_id 
            AND (
                -- Project owner
                p.user_id = auth.uid() OR
                -- Editor collaborator
                EXISTS (
                    SELECT 1 FROM project_collaborators pc 
                    WHERE pc.project_id = p.id 
                    AND pc.user_id = auth.uid()
                    AND pc.role = 'editor'
                    AND pc.accepted_at IS NOT NULL
                )
            )
        )
    );

-- Project owners and editors can delete files
CREATE POLICY "Project owners and editors can delete files" ON project_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_files.project_id 
            AND (
                -- Project owner
                p.user_id = auth.uid() OR
                -- Editor collaborator
                EXISTS (
                    SELECT 1 FROM project_collaborators pc 
                    WHERE pc.project_id = p.id 
                    AND pc.user_id = auth.uid()
                    AND pc.role = 'editor'
                    AND pc.accepted_at IS NOT NULL
                )
            )
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_collaborator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_collaborator_updated_at_trigger
    BEFORE UPDATE ON project_collaborators
    FOR EACH ROW EXECUTE FUNCTION update_project_collaborator_updated_at();

-- Create notification trigger for collaboration invites
CREATE OR REPLACE FUNCTION notify_project_collaboration()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    inviter_name TEXT;
BEGIN
    -- Get project name and inviter display name
    SELECT p.name INTO project_name 
    FROM projects p WHERE p.id = NEW.project_id;
    
    SELECT COALESCE(prof.display_name, 'Someone') INTO inviter_name
    FROM profiles prof WHERE prof.id = NEW.invited_by;
    
    IF TG_OP = 'INSERT' THEN
        -- Create notification for new collaboration invite
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.user_id,
            'project_collaboration_invite',
            'Project Collaboration Invite',
            inviter_name || ' invited you to collaborate on "' || project_name || '"',
            jsonb_build_object(
                'project_id', NEW.project_id,
                'project_name', project_name,
                'inviter_id', NEW.invited_by,
                'inviter_name', inviter_name,
                'role', NEW.role,
                'collaborator_id', NEW.id
            )
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN
        -- Create notification for accepted invite
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.invited_by,
            'project_collaboration_accepted',
            'Collaboration Invite Accepted',
            'Your collaboration invite for "' || project_name || '" was accepted!',
            jsonb_build_object(
                'project_id', NEW.project_id,
                'project_name', project_name,
                'collaborator_id', NEW.user_id,
                'role', NEW.role
            )
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_project_collaboration_trigger
    AFTER INSERT OR UPDATE ON project_collaborators
    FOR EACH ROW EXECUTE FUNCTION notify_project_collaboration();