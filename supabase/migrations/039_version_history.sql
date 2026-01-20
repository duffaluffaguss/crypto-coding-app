-- Enhanced Version History
-- Stores versions with project_id and file_path as requested

-- Add file_path and project_id to existing code_versions for the new requirements
-- We'll keep the existing structure for compatibility but add new columns
ALTER TABLE code_versions 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Create index for new project_id column
CREATE INDEX IF NOT EXISTS idx_code_versions_project_id ON code_versions(project_id);

-- Create index for file_path lookups
CREATE INDEX IF NOT EXISTS idx_code_versions_project_file ON code_versions(project_id, file_path);

-- Function to populate new columns from existing file_id
CREATE OR REPLACE FUNCTION populate_version_metadata()
RETURNS VOID AS $$
BEGIN
    -- Update existing records to populate project_id and file_path
    UPDATE code_versions 
    SET 
        project_id = pf.project_id,
        file_path = pf.filename
    FROM project_files pf
    WHERE code_versions.file_id = pf.id 
    AND (code_versions.project_id IS NULL OR code_versions.file_path IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Execute the population function
SELECT populate_version_metadata();

-- Create trigger to auto-populate new columns on insert
CREATE OR REPLACE FUNCTION auto_populate_version_metadata()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.file_id IS NOT NULL AND (NEW.project_id IS NULL OR NEW.file_path IS NULL) THEN
        SELECT pf.project_id, pf.filename 
        INTO NEW.project_id, NEW.file_path
        FROM project_files pf 
        WHERE pf.id = NEW.file_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for auto-population
DROP TRIGGER IF EXISTS trigger_auto_populate_version_metadata ON code_versions;
CREATE TRIGGER trigger_auto_populate_version_metadata
    BEFORE INSERT ON code_versions
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_version_metadata();

-- Update RLS policies to work with project_id
DROP POLICY IF EXISTS "Users can view versions by project" ON code_versions;
CREATE POLICY "Users can view versions by project" ON code_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = code_versions.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy for inserting with project_id
DROP POLICY IF EXISTS "Users can create versions by project" ON code_versions;
CREATE POLICY "Users can create versions by project" ON code_versions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = code_versions.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Function to save version with project_id and file_path
CREATE OR REPLACE FUNCTION save_code_version(
    p_project_id UUID,
    p_file_path TEXT,
    p_content TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_file_id UUID;
    v_version_id UUID;
BEGIN
    -- Try to find existing file_id
    SELECT id INTO v_file_id
    FROM project_files
    WHERE project_id = p_project_id AND filename = p_file_path;

    -- Insert version record
    INSERT INTO code_versions (project_id, file_path, file_id, content, message)
    VALUES (p_project_id, p_file_path, v_file_id, p_content, p_message)
    RETURNING id INTO v_version_id;

    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;