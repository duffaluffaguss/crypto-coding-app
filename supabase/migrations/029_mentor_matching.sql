-- Add mentor matching system

-- Table for mentor availability and preferences
CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  topics TEXT[] DEFAULT '{}', -- Array of topics/project_types they can mentor
  max_mentees INTEGER DEFAULT 5 CHECK (max_mentees > 0),
  current_mentees INTEGER DEFAULT 0 CHECK (current_mentees >= 0),
  bio TEXT, -- Optional mentor bio/introduction
  hourly_rate DECIMAL(10,2), -- Optional hourly rate (NULL for free)
  timezone TEXT, -- Mentor's timezone
  preferred_meeting_times TEXT[], -- Array of preferred times like ['weekday_evening', 'weekend_morning']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure user can only have one mentor profile
  UNIQUE(user_id),
  
  -- Ensure current_mentees doesn't exceed max_mentees
  CONSTRAINT valid_mentee_count CHECK (current_mentees <= max_mentees)
);

-- Table for mentorship requests
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL, -- Optional: specific lesson help
  project_type TEXT CHECK (project_type IN ('nft_marketplace', 'token', 'dao', 'game', 'social', 'creator')),
  title TEXT NOT NULL, -- Brief title of what they need help with
  message TEXT NOT NULL, -- Detailed request message
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  meeting_preference TEXT CHECK (meeting_preference IN ('video_call', 'text_chat', 'code_review', 'project_help')),
  estimated_duration_minutes INTEGER, -- How long they estimate they'll need
  scheduled_at TIMESTAMP WITH TIME ZONE, -- When the session is scheduled
  completed_at TIMESTAMP WITH TIME ZONE, -- When marked as completed
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Mentee's rating of the session
  feedback TEXT, -- Mentee's feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Prevent self-mentoring
  CONSTRAINT no_self_mentoring CHECK (mentor_id != mentee_id)
);

-- Table for mentor ratings and reviews
CREATE TABLE IF NOT EXISTS mentor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_request_id UUID NOT NULL REFERENCES mentorship_requests(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_public BOOLEAN DEFAULT TRUE, -- Whether the review is publicly visible
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure one review per mentorship request
  UNIQUE(mentorship_request_id)
);

-- Add indexes for performance
CREATE INDEX idx_mentor_availability_user_id ON mentor_availability(user_id);
CREATE INDEX idx_mentor_availability_available ON mentor_availability(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_mentor_availability_topics ON mentor_availability USING GIN(topics);

CREATE INDEX idx_mentorship_requests_mentor_id ON mentorship_requests(mentor_id);
CREATE INDEX idx_mentorship_requests_mentee_id ON mentorship_requests(mentee_id);
CREATE INDEX idx_mentorship_requests_status ON mentorship_requests(status);
CREATE INDEX idx_mentorship_requests_created_at ON mentorship_requests(created_at DESC);
CREATE INDEX idx_mentorship_requests_lesson_id ON mentorship_requests(lesson_id);

CREATE INDEX idx_mentor_reviews_mentor_id ON mentor_reviews(mentor_id);
CREATE INDEX idx_mentor_reviews_rating ON mentor_reviews(rating);
CREATE INDEX idx_mentor_reviews_public ON mentor_reviews(is_public) WHERE is_public = TRUE;

-- Enable RLS
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_availability
CREATE POLICY "Everyone can view available mentors" ON mentor_availability 
  FOR SELECT USING (is_available = TRUE);

CREATE POLICY "Users can view their own mentor profile" ON mentor_availability 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their mentor profile" ON mentor_availability 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their mentor profile" ON mentor_availability 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their mentor profile" ON mentor_availability 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mentorship_requests
CREATE POLICY "Mentors can view requests to them" ON mentorship_requests 
  FOR SELECT USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can view their requests" ON mentorship_requests 
  FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Authenticated users can create requests" ON mentorship_requests 
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors can update requests to them" ON mentorship_requests 
  FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can update their requests" ON mentorship_requests 
  FOR UPDATE USING (auth.uid() = mentee_id);

CREATE POLICY "Users can delete their own requests" ON mentorship_requests 
  FOR DELETE USING (auth.uid() = mentee_id);

-- RLS Policies for mentor_reviews
CREATE POLICY "Everyone can view public reviews" ON mentor_reviews 
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Mentors can view all their reviews" ON mentor_reviews 
  FOR SELECT USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can view their reviews" ON mentor_reviews 
  FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Mentees can create reviews" ON mentor_reviews 
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentees can update their reviews" ON mentor_reviews 
  FOR UPDATE USING (auth.uid() = mentee_id);

-- Functions to maintain current_mentees count
CREATE OR REPLACE FUNCTION update_mentor_mentee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When a mentorship request is accepted, increment current_mentees
    IF NEW.status = 'accepted' THEN
      UPDATE mentor_availability 
      SET current_mentees = current_mentees + 1 
      WHERE user_id = NEW.mentor_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
      -- Request was accepted
      UPDATE mentor_availability 
      SET current_mentees = current_mentees + 1 
      WHERE user_id = NEW.mentor_id;
    ELSIF OLD.status = 'accepted' AND NEW.status IN ('completed', 'cancelled', 'declined') THEN
      -- Request was completed or cancelled
      UPDATE mentor_availability 
      SET current_mentees = GREATEST(0, current_mentees - 1)
      WHERE user_id = NEW.mentor_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- When a mentorship request is deleted and was accepted, decrement
    IF OLD.status = 'accepted' THEN
      UPDATE mentor_availability 
      SET current_mentees = GREATEST(0, current_mentees - 1)
      WHERE user_id = OLD.mentor_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for mentee count updates
CREATE TRIGGER update_mentor_mentee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION update_mentor_mentee_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_mentor_availability_updated_at
  BEFORE UPDATE ON mentor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentorship_requests_updated_at
  BEFORE UPDATE ON mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();