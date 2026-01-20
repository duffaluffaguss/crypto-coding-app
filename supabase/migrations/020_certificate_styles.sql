-- Migration: Certificate Styles
-- Description: Store custom certificate styles for NFT minting

-- Create certificate_styles table
CREATE TABLE IF NOT EXISTS certificate_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  style_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one style per project per user
  CONSTRAINT unique_project_user_style UNIQUE (project_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_certificate_styles_project_id ON certificate_styles(project_id);
CREATE INDEX IF NOT EXISTS idx_certificate_styles_user_id ON certificate_styles(user_id);

-- Enable RLS
ALTER TABLE certificate_styles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own styles
CREATE POLICY "Users can view own certificate styles"
  ON certificate_styles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own styles
CREATE POLICY "Users can create certificate styles"
  ON certificate_styles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own styles
CREATE POLICY "Users can update own certificate styles"
  ON certificate_styles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own styles
CREATE POLICY "Users can delete own certificate styles"
  ON certificate_styles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE certificate_styles IS 'Stores custom styling preferences for NFT certificates';
COMMENT ON COLUMN certificate_styles.style_config IS 'JSON configuration including background, border, accent color, and element visibility';
