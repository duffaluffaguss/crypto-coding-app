-- Create collab_requests table
CREATE TABLE collab_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES auth.users(id),
    to_user_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL CHECK (char_length(message) <= 500),
    project_idea TEXT NOT NULL CHECK (char_length(project_idea) <= 1000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id, project_idea)
);

-- Add RLS policies for collab_requests
ALTER TABLE collab_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent or received
CREATE POLICY "Users can view their own collab requests" ON collab_requests
    FOR SELECT USING (
        auth.uid() = from_user_id OR auth.uid() = to_user_id
    );

-- Users can create requests (from themselves)
CREATE POLICY "Users can create collab requests" ON collab_requests
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update requests they received (to accept/decline)
CREATE POLICY "Recipients can update collab requests" ON collab_requests
    FOR UPDATE USING (auth.uid() = to_user_id);

-- Users can delete requests they sent or received
CREATE POLICY "Users can delete their collab requests" ON collab_requests
    FOR DELETE USING (
        auth.uid() = from_user_id OR auth.uid() = to_user_id
    );

-- Create indexes for better performance
CREATE INDEX idx_collab_requests_from_user_id ON collab_requests(from_user_id);
CREATE INDEX idx_collab_requests_to_user_id ON collab_requests(to_user_id);
CREATE INDEX idx_collab_requests_status ON collab_requests(status);
CREATE INDEX idx_collab_requests_created_at ON collab_requests(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collab_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collab_request_updated_at_trigger
    BEFORE UPDATE ON collab_requests
    FOR EACH ROW EXECUTE FUNCTION update_collab_request_updated_at();

-- Create notification trigger for new collab requests
CREATE OR REPLACE FUNCTION notify_collab_request()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Create notification for new collaboration request
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.to_user_id,
            'collab_request',
            'New Collaboration Request',
            'Someone wants to collaborate on a project with you!',
            jsonb_build_object(
                'collab_request_id', NEW.id,
                'from_user_id', NEW.from_user_id,
                'project_idea', NEW.project_idea
            )
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
        -- Create notification for request response
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.from_user_id,
            'collab_response',
            CASE WHEN NEW.status = 'accepted' THEN 'Collaboration Request Accepted!' ELSE 'Collaboration Request Declined' END,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'Your collaboration request was accepted!'
                ELSE 'Your collaboration request was declined.'
            END,
            jsonb_build_object(
                'collab_request_id', NEW.id,
                'to_user_id', NEW.to_user_id,
                'status', NEW.status
            )
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_collab_request_trigger
    AFTER INSERT OR UPDATE ON collab_requests
    FOR EACH ROW EXECUTE FUNCTION notify_collab_request();