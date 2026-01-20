-- Communities (like subreddits for crypto developers)
-- Migration: 023_communities.sql

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '💬',
  project_type TEXT, -- optional: link to a specific project type
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community members table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Community discussions/posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'announcement', 'showcase')),
  upvotes INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_answered BOOLEAN DEFAULT FALSE, -- for questions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post replies
CREATE TABLE IF NOT EXISTS community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE, -- for question answers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Communities: Everyone can read
CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  USING (true);

-- Community members: Everyone can read, authenticated users can join/leave
CREATE POLICY "Community members are viewable by everyone"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Posts: Everyone can read, members can create
CREATE POLICY "Community posts are viewable by everyone"
  ON community_posts FOR SELECT
  USING (true);

CREATE POLICY "Community members can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_posts.community_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their posts"
  ON community_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Replies: Everyone can read, authenticated users can create
CREATE POLICY "Community replies are viewable by everyone"
  ON community_replies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can reply"
  ON community_replies FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their replies"
  ON community_replies FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their replies"
  ON community_replies FOR DELETE
  USING (auth.uid() = author_id);

-- Function to update member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for member count
DROP TRIGGER IF EXISTS on_community_member_change ON community_members;
CREATE TRIGGER on_community_member_change
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Function to update replies count
CREATE OR REPLACE FUNCTION update_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET replies_count = replies_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET replies_count = replies_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for replies count
DROP TRIGGER IF EXISTS on_community_reply_change ON community_replies;
CREATE TRIGGER on_community_reply_change
  AFTER INSERT OR DELETE ON community_replies
  FOR EACH ROW EXECUTE FUNCTION update_post_replies_count();

-- Seed default communities
INSERT INTO communities (name, slug, description, icon, project_type) VALUES
  ('Token Builders', 'token-builders', 'Build and deploy your own ERC-20 tokens. Share strategies, tokenomics, and launch tips.', '🪙', 'token'),
  ('NFT Creators', 'nft-creators', 'Everything about NFTs - from art generation to smart contracts and marketplaces.', '🎨', 'nft_marketplace'),
  ('DAO Governance', 'dao-governance', 'Discuss DAO structures, voting mechanisms, and decentralized organization patterns.', '🏛️', 'dao'),
  ('DeFi Devs', 'defi-devs', 'Decentralized finance development - AMMs, lending protocols, yield strategies, and more.', '💰', NULL),
  ('Game Builders', 'game-builders', 'On-chain gaming, play-to-earn mechanics, and blockchain game development.', '🎮', 'game'),
  ('General', 'general', 'General Web3 discussion, introductions, and anything that doesn''t fit elsewhere.', '💬', NULL)
ON CONFLICT (slug) DO NOTHING;
