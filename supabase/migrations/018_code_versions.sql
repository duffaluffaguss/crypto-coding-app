-- Code Version History
-- Stores versions of code files for version control

CREATE TABLE IF NOT EXISTS code_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by file_id
CREATE INDEX IF NOT EXISTS idx_code_versions_file_id ON code_versions(file_id);

-- Index for ordering by date
CREATE INDEX IF NOT EXISTS idx_code_versions_created_at ON code_versions(file_id, created_at DESC);

-- Enable RLS
ALTER TABLE code_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of files in their projects
CREATE POLICY "Users can view their file versions" ON code_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_files pf
            JOIN projects p ON p.id = pf.project_id
            WHERE pf.id = code_versions.file_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Users can create versions for files in their projects
CREATE POLICY "Users can create file versions" ON code_versions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_files pf
            JOIN projects p ON p.id = pf.project_id
            WHERE pf.id = code_versions.file_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Users can delete versions for files in their projects
CREATE POLICY "Users can delete their file versions" ON code_versions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_files pf
            JOIN projects p ON p.id = pf.project_id
            WHERE pf.id = code_versions.file_id
            AND p.user_id = auth.uid()
        )
    );

-- Function to auto-cleanup old versions (keep last 50 per file)
CREATE OR REPLACE FUNCTION cleanup_old_versions()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete versions beyond the 50 most recent for this file
    DELETE FROM code_versions
    WHERE file_id = NEW.file_id
    AND id NOT IN (
        SELECT id FROM code_versions
        WHERE file_id = NEW.file_id
        ORDER BY created_at DESC
        LIMIT 50
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup on insert
DROP TRIGGER IF EXISTS trigger_cleanup_old_versions ON code_versions;
CREATE TRIGGER trigger_cleanup_old_versions
    AFTER INSERT ON code_versions
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_versions();
