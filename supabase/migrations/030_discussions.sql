-- Q&A Discussion System
-- Migration: 030_discussions.sql

-- Discussions table (Q&A focused posts)
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  lesson_id TEXT REFERENCES lessons(id), -- optional: link to specific lesson
  is_question BOOLEAN DEFAULT TRUE,
  is_answered BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_accepted_answer BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussions_community ON discussions(community_id);
CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_lesson ON discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author ON discussion_replies(author_id);

-- Enable RLS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Discussions

-- Everyone can read discussions
CREATE POLICY "Discussions are viewable by everyone"
  ON discussions FOR SELECT
  USING (true);

-- Community members can create discussions
CREATE POLICY "Community members can create discussions"
  ON discussions FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = discussions.community_id
      AND user_id = auth.uid()
    )
  );

-- Authors can update their discussions
CREATE POLICY "Authors can update their discussions"
  ON discussions FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their discussions
CREATE POLICY "Authors can delete their discussions"
  ON discussions FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for Discussion Replies

-- Everyone can read replies
CREATE POLICY "Discussion replies are viewable by everyone"
  ON discussion_replies FOR SELECT
  USING (true);

-- Authenticated users can create replies
CREATE POLICY "Authenticated users can create replies"
  ON discussion_replies FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their replies
CREATE POLICY "Authors can update their replies"
  ON discussion_replies FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their replies
CREATE POLICY "Authors can delete their replies"
  ON discussion_replies FOR DELETE
  USING (auth.uid() = author_id);

-- Function to mark discussion as answered when accepted answer is set
CREATE OR REPLACE FUNCTION mark_discussion_answered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_accepted_answer = TRUE AND (OLD IS NULL OR OLD.is_accepted_answer = FALSE) THEN
    -- Mark discussion as answered
    UPDATE discussions SET is_answered = TRUE WHERE id = NEW.discussion_id;
    -- Unmark other answers as accepted (only one accepted answer per discussion)
    UPDATE discussion_replies 
    SET is_accepted_answer = FALSE 
    WHERE discussion_id = NEW.discussion_id AND id != NEW.id;
  ELSIF NEW.is_accepted_answer = FALSE AND OLD.is_accepted_answer = TRUE THEN
    -- Check if there are any other accepted answers
    IF NOT EXISTS (
      SELECT 1 FROM discussion_replies 
      WHERE discussion_id = NEW.discussion_id 
      AND is_accepted_answer = TRUE 
      AND id != NEW.id
    ) THEN
      UPDATE discussions SET is_answered = FALSE WHERE id = NEW.discussion_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle accepted answers
DROP TRIGGER IF EXISTS on_accepted_answer_change ON discussion_replies;
CREATE TRIGGER on_accepted_answer_change
  AFTER INSERT OR UPDATE OF is_accepted_answer ON discussion_replies
  FOR EACH ROW 
  WHEN (NEW.is_accepted_answer = TRUE OR (OLD IS NOT NULL AND OLD.is_accepted_answer = TRUE))
  EXECUTE FUNCTION mark_discussion_answered();

-- Function to handle deletion of accepted answers
CREATE OR REPLACE FUNCTION handle_accepted_answer_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_accepted_answer = TRUE THEN
    -- Check if there are any other accepted answers
    IF NOT EXISTS (
      SELECT 1 FROM discussion_replies 
      WHERE discussion_id = OLD.discussion_id 
      AND is_accepted_answer = TRUE
    ) THEN
      UPDATE discussions SET is_answered = FALSE WHERE id = OLD.discussion_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for deletion of accepted answers
DROP TRIGGER IF EXISTS on_accepted_answer_deletion ON discussion_replies;
CREATE TRIGGER on_accepted_answer_deletion
  AFTER DELETE ON discussion_replies
  FOR EACH ROW 
  WHEN (OLD.is_accepted_answer = TRUE)
  EXECUTE FUNCTION handle_accepted_answer_deletion();