-- Community Templates Migration
-- Allow users to submit and share their code as templates

-- Create community_templates table
CREATE TABLE public.community_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    code JSONB NOT NULL, -- Store code structure as JSON
    project_type VARCHAR(50) NOT NULL, -- 'defi', 'nft', 'dao', 'token', etc.
    tags TEXT[] DEFAULT '{}', -- Array of tags for categorization
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT false, -- Moderation flag
    is_featured BOOLEAN DEFAULT false, -- Featured templates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_template_likes table to track user likes
CREATE TABLE public.community_template_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.community_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

-- Create community_template_downloads table to track downloads
CREATE TABLE public.community_template_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.community_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.community_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_template_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_template_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_templates
-- Anyone can view approved templates
CREATE POLICY "Anyone can view approved templates" ON public.community_templates
    FOR SELECT USING (is_approved = true);

-- Users can view their own templates (even if not approved)
CREATE POLICY "Users can view own templates" ON public.community_templates
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own templates
CREATE POLICY "Users can create templates" ON public.community_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON public.community_templates
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON public.community_templates
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_template_likes
-- Anyone can view likes
CREATE POLICY "Anyone can view template likes" ON public.community_template_likes
    FOR SELECT USING (true);

-- Users can like templates
CREATE POLICY "Users can like templates" ON public.community_template_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike templates
CREATE POLICY "Users can unlike templates" ON public.community_template_likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_template_downloads
-- Anyone can view download stats
CREATE POLICY "Anyone can view template downloads" ON public.community_template_downloads
    FOR SELECT USING (true);

-- Users can download templates
CREATE POLICY "Users can download templates" ON public.community_template_downloads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_community_templates_user_id ON public.community_templates(user_id);
CREATE INDEX idx_community_templates_project_type ON public.community_templates(project_type);
CREATE INDEX idx_community_templates_created_at ON public.community_templates(created_at DESC);
CREATE INDEX idx_community_templates_downloads ON public.community_templates(downloads DESC);
CREATE INDEX idx_community_templates_likes ON public.community_templates(likes DESC);
CREATE INDEX idx_community_templates_approved ON public.community_templates(is_approved) WHERE is_approved = true;
CREATE INDEX idx_community_templates_featured ON public.community_templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_community_templates_tags ON public.community_templates USING gin(tags);

-- Function to update template like count
CREATE OR REPLACE FUNCTION update_template_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_templates 
        SET likes = likes + 1 
        WHERE id = NEW.template_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_templates 
        SET likes = likes - 1 
        WHERE id = OLD.template_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update template download count
CREATE OR REPLACE FUNCTION update_template_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.community_templates 
    SET downloads = downloads + 1 
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to automatically update counts
CREATE TRIGGER trigger_update_template_likes
    AFTER INSERT OR DELETE ON public.community_template_likes
    FOR EACH ROW EXECUTE FUNCTION update_template_likes();

CREATE TRIGGER trigger_update_template_downloads
    AFTER INSERT ON public.community_template_downloads
    FOR EACH ROW EXECUTE FUNCTION update_template_downloads();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_community_templates_updated_at
    BEFORE UPDATE ON public.community_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();