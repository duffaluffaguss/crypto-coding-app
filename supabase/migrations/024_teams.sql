-- Create team_projects table
CREATE TABLE team_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_project_id UUID NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_project_id, user_id)
);

-- Add RLS policies for team_projects
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams they're members of" ON team_projects
    FOR SELECT USING (
        id IN (
            SELECT team_project_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create teams" ON team_projects
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners can update teams" ON team_projects
    FOR UPDATE USING (
        id IN (
            SELECT team_project_id FROM team_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Team owners can delete teams" ON team_projects
    FOR DELETE USING (
        id IN (
            SELECT team_project_id FROM team_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Add RLS policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members of teams they're in" ON team_members
    FOR SELECT USING (
        team_project_id IN (
            SELECT team_project_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners can manage members" ON team_members
    FOR ALL USING (
        team_project_id IN (
            SELECT team_project_id FROM team_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Users can join teams when invited" ON team_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_team_members_team_project_id ON team_members(team_project_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Add trigger to automatically add creator as team owner
CREATE OR REPLACE FUNCTION add_team_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO team_members (team_project_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_team_creator_as_owner_trigger
    AFTER INSERT ON team_projects
    FOR EACH ROW EXECUTE FUNCTION add_team_creator_as_owner();

-- Add column to projects table to link to teams (if projects table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_project_id UUID REFERENCES team_projects(id);
        CREATE INDEX IF NOT EXISTS idx_projects_team_project_id ON projects(team_project_id);
    END IF;
END
$$;