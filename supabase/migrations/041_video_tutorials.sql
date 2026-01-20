-- Video Tutorials Migration
-- Stores video tutorial metadata, linked optionally to lessons

-- Create video_tutorials table
CREATE TABLE IF NOT EXISTS video_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_provider TEXT DEFAULT 'youtube' CHECK (video_provider IN ('youtube', 'vimeo', 'custom')),
  video_id TEXT, -- YouTube/Vimeo video ID for embedding
  thumbnail_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0, -- Duration in seconds
  duration_display TEXT, -- Human readable (e.g., "12:34")
  category TEXT DEFAULT 'general',
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_tutorials_lesson_id ON video_tutorials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_category ON video_tutorials(category);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_sort_order ON video_tutorials(sort_order);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_is_published ON video_tutorials(is_published);

-- Create video_tutorial_progress table for tracking user progress
CREATE TABLE IF NOT EXISTS video_tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_tutorial_id UUID NOT NULL REFERENCES video_tutorials(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_tutorial_id)
);

-- Create index for user progress lookups
CREATE INDEX IF NOT EXISTS idx_video_tutorial_progress_user ON video_tutorial_progress(user_id);

-- Enable RLS
ALTER TABLE video_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tutorial_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_tutorials (public read, admin write)
CREATE POLICY "Video tutorials are viewable by everyone"
  ON video_tutorials FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage video tutorials"
  ON video_tutorials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- RLS Policies for video_tutorial_progress
CREATE POLICY "Users can view their own video progress"
  ON video_tutorial_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own video progress"
  ON video_tutorial_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video progress records"
  ON video_tutorial_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_video_view_count(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE video_tutorials
  SET view_count = view_count + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed data with placeholder video tutorials
INSERT INTO video_tutorials (title, description, video_url, video_provider, video_id, duration, duration_display, category, difficulty, sort_order, is_featured) VALUES
  -- Getting Started
  ('Introduction to Web3 Development', 'Learn the fundamentals of Web3 and understand how blockchain technology works. Perfect starting point for beginners.', 'https://www.youtube.com/watch?v=gyMwXuJrbJQ', 'youtube', 'gyMwXuJrbJQ', 754, '12:34', 'getting-started', 'beginner', 1, true),
  ('Setting Up Your Development Environment', 'Install and configure all the tools you need: Node.js, VS Code, MetaMask, and more.', 'https://www.youtube.com/watch?v=M576WGiDBdQ', 'youtube', 'M576WGiDBdQ', 1125, '18:45', 'getting-started', 'beginner', 2, false),
  
  -- Solidity Basics
  ('Solidity Fundamentals', 'Master the basics of Solidity: variables, data types, functions, and control structures.', 'https://www.youtube.com/watch?v=RQzuQb0dfBM', 'youtube', 'RQzuQb0dfBM', 1530, '25:30', 'solidity-basics', 'beginner', 3, true),
  ('Smart Contract Structure', 'Understand how smart contracts are organized with constructors, state variables, and modifiers.', 'https://www.youtube.com/watch?v=sngKPYfUgkc', 'youtube', 'sngKPYfUgkc', 1215, '20:15', 'solidity-basics', 'beginner', 4, false),
  ('Working with Mappings and Structs', 'Learn how to use complex data structures in Solidity for real-world applications.', 'https://www.youtube.com/watch?v=wJnXuCFVGFA', 'youtube', 'wJnXuCFVGFA', 1360, '22:40', 'solidity-basics', 'intermediate', 5, false),
  
  -- Deploying
  ('Deploy Your First Smart Contract', 'Step-by-step guide to deploying your first contract on the Base Sepolia testnet.', 'https://www.youtube.com/watch?v=p3C7jljTXaA', 'youtube', 'p3C7jljTXaA', 920, '15:20', 'deploying', 'beginner', 6, true),
  ('Professional Deployment with Hardhat', 'Learn to use Hardhat for testing, compiling, and deploying smart contracts like a pro.', 'https://www.youtube.com/watch?v=9Qpi80dQsGU', 'youtube', '9Qpi80dQsGU', 1730, '28:50', 'deploying', 'intermediate', 7, false),
  
  -- Advanced
  ('Building an ERC-20 Token', 'Create your own cryptocurrency token following the ERC-20 standard.', 'https://www.youtube.com/watch?v=8N0lLN5bhqA', 'youtube', '8N0lLN5bhqA', 2115, '35:15', 'advanced', 'intermediate', 8, true),
  ('Creating an NFT Collection', 'Build and deploy a full ERC-721 NFT collection with metadata and minting functionality.', 'https://www.youtube.com/watch?v=GjRvB5I-u08', 'youtube', 'GjRvB5I-u08', 2550, '42:30', 'advanced', 'advanced', 9, false),
  ('DeFi Smart Contract Patterns', 'Explore common DeFi patterns including staking, liquidity pools, and yield farming concepts.', 'https://www.youtube.com/watch?v=EhPY7oQvV0Y', 'youtube', 'EhPY7oQvV0Y', 2900, '48:20', 'advanced', 'advanced', 10, false)
ON CONFLICT DO NOTHING;
