-- Add lesson help threads system

-- Table for lesson-specific questions
CREATE TABLE IF NOT EXISTS lesson_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table for answers to questions
CREATE TABLE IF NOT EXISTS lesson_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES lesson_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table for tracking helpful votes on questions and answers
CREATE TABLE IF NOT EXISTS lesson_help_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES lesson_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES lesson_question_answers(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT only_one_target CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR 
    (question_id IS NULL AND answer_id IS NOT NULL)
  ),
  UNIQUE(user_id, question_id),
  UNIQUE(user_id, answer_id)
);

-- Table for lesson help notifications
CREATE TABLE IF NOT EXISTS lesson_help_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  question_id UUID REFERENCES lesson_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES lesson_question_answers(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_question', 'new_answer', 'question_answered', 'answer_accepted')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for performance
CREATE INDEX idx_lesson_questions_lesson_id ON lesson_questions(lesson_id);
CREATE INDEX idx_lesson_questions_user_id ON lesson_questions(user_id);
CREATE INDEX idx_lesson_questions_created_at ON lesson_questions(created_at DESC);
CREATE INDEX idx_lesson_question_answers_question_id ON lesson_question_answers(question_id);
CREATE INDEX idx_lesson_question_answers_user_id ON lesson_question_answers(user_id);
CREATE INDEX idx_lesson_help_votes_user_id ON lesson_help_votes(user_id);
CREATE INDEX idx_lesson_help_notifications_recipient_id ON lesson_help_notifications(recipient_id);
CREATE INDEX idx_lesson_help_notifications_unread ON lesson_help_notifications(recipient_id) WHERE is_read = FALSE;

-- Add RLS policies
ALTER TABLE lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_help_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_help_notifications ENABLE ROW LEVEL SECURITY;

-- Questions are readable by everyone, writable by authenticated users
CREATE POLICY "Everyone can view lesson questions" ON lesson_questions FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create questions" ON lesson_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own questions" ON lesson_questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own questions" ON lesson_questions FOR DELETE USING (auth.uid() = user_id);

-- Answers are readable by everyone, writable by authenticated users
CREATE POLICY "Everyone can view answers" ON lesson_question_answers FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create answers" ON lesson_question_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own answers" ON lesson_question_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own answers" ON lesson_question_answers FOR DELETE USING (auth.uid() = user_id);

-- Votes are readable by everyone, writable by authenticated users
CREATE POLICY "Everyone can view votes" ON lesson_help_votes FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can vote" ON lesson_help_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their votes" ON lesson_help_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their votes" ON lesson_help_votes FOR DELETE USING (auth.uid() = user_id);

-- Notifications are only accessible by the recipient
CREATE POLICY "Users can view their notifications" ON lesson_help_notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "System can create notifications" ON lesson_help_notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can update their notifications" ON lesson_help_notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- Functions to update helpful_count when votes change
CREATE OR REPLACE FUNCTION update_question_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.question_id IS NOT NULL AND NEW.is_helpful THEN
      UPDATE lesson_questions 
      SET helpful_count = helpful_count + 1 
      WHERE id = NEW.question_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.question_id IS NOT NULL AND OLD.is_helpful AND NOT NEW.is_helpful THEN
      UPDATE lesson_questions 
      SET helpful_count = helpful_count - 1 
      WHERE id = OLD.question_id;
    ELSIF OLD.question_id IS NOT NULL AND NOT OLD.is_helpful AND NEW.is_helpful THEN
      UPDATE lesson_questions 
      SET helpful_count = helpful_count + 1 
      WHERE id = OLD.question_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.question_id IS NOT NULL AND OLD.is_helpful THEN
      UPDATE lesson_questions 
      SET helpful_count = helpful_count - 1 
      WHERE id = OLD.question_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_answer_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.answer_id IS NOT NULL AND NEW.is_helpful THEN
      UPDATE lesson_question_answers 
      SET helpful_count = helpful_count + 1 
      WHERE id = NEW.answer_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.answer_id IS NOT NULL AND OLD.is_helpful AND NOT NEW.is_helpful THEN
      UPDATE lesson_question_answers 
      SET helpful_count = helpful_count - 1 
      WHERE id = OLD.answer_id;
    ELSIF OLD.answer_id IS NOT NULL AND NOT OLD.is_helpful AND NEW.is_helpful THEN
      UPDATE lesson_question_answers 
      SET helpful_count = helpful_count + 1 
      WHERE id = OLD.answer_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.answer_id IS NOT NULL AND OLD.is_helpful THEN
      UPDATE lesson_question_answers 
      SET helpful_count = helpful_count - 1 
      WHERE id = OLD.answer_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_question_helpful_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON lesson_help_votes
  FOR EACH ROW EXECUTE FUNCTION update_question_helpful_count();

CREATE TRIGGER update_answer_helpful_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON lesson_help_votes
  FOR EACH ROW EXECUTE FUNCTION update_answer_helpful_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_lesson_questions_updated_at
  BEFORE UPDATE ON lesson_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_question_answers_updated_at
  BEFORE UPDATE ON lesson_question_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();