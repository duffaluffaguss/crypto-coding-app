-- Real-time Chat Rooms for Communities
-- Migration: 027_chat_rooms.sql

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'help', 'showcase')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, name)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message reactions (optional feature)
CREATE TABLE IF NOT EXISTS chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_community ON chat_rooms(community_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_message ON chat_message_reactions(message_id);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms

-- Everyone can read chat rooms
CREATE POLICY "Chat rooms are viewable by everyone"
  ON chat_rooms FOR SELECT
  USING (true);

-- Only admins can create/modify rooms (handled via server functions)
CREATE POLICY "Admins can manage chat rooms"
  ON chat_rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = chat_rooms.community_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for chat_messages

-- Everyone can read messages
CREATE POLICY "Chat messages are viewable by everyone"
  ON chat_messages FOR SELECT
  USING (true);

-- Community members can send messages
CREATE POLICY "Community members can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN community_members cm ON cm.community_id = cr.community_id
      WHERE cr.id = chat_messages.room_id
      AND cm.user_id = auth.uid()
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for reactions

CREATE POLICY "Reactions are viewable by everyone"
  ON chat_message_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON chat_message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON chat_message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_message_reactions;

-- Function to create default chat rooms for a community
CREATE OR REPLACE FUNCTION create_default_chat_rooms(p_community_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO chat_rooms (community_id, name, type, description)
  VALUES 
    (p_community_id, 'General', 'general', 'General discussion'),
    (p_community_id, 'Help', 'help', 'Ask questions and get help from the community'),
    (p_community_id, 'Showcase', 'showcase', 'Share your projects and achievements')
  ON CONFLICT (community_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default rooms for existing communities
DO $$
DECLARE
  comm RECORD;
BEGIN
  FOR comm IN SELECT id FROM communities LOOP
    PERFORM create_default_chat_rooms(comm.id);
  END LOOP;
END $$;

-- Trigger to create default rooms for new communities
CREATE OR REPLACE FUNCTION on_community_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_chat_rooms(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_chat_rooms_on_community ON communities;
CREATE TRIGGER create_chat_rooms_on_community
  AFTER INSERT ON communities
  FOR EACH ROW EXECUTE FUNCTION on_community_created();
