-- Create the published_agents table
CREATE TABLE IF NOT EXISTS public.published_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_pseudo TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    icon_name TEXT DEFAULT 'Bot',
    bg_color TEXT DEFAULT 'bg-slate-100',
    text_color TEXT DEFAULT 'text-slate-600',
    capabilities TEXT[] DEFAULT '{}',
    code_language TEXT DEFAULT 'Python',
    code_source TEXT,
    suggested_policies JSONB DEFAULT '{}'::jsonb,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.published_agents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view published agents (since it's a public library)
CREATE POLICY "Anyone can view published agents"
ON public.published_agents FOR SELECT
USING (true);

-- Allow authenticated users to insert their own published agents
CREATE POLICY "Users can publish agents"
ON public.published_agents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own published agents
CREATE POLICY "Users can update own published agents"
ON public.published_agents FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);

-- Allow users to delete their own published agents
CREATE POLICY "Users can delete own published agents"
ON public.published_agents FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- Optional: Create a table for tracking likes to prevent duplicate likes from the same user
CREATE TABLE IF NOT EXISTS public.agent_likes (
    agent_id UUID REFERENCES public.published_agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (agent_id, user_id)
);

-- RLS for likes
ALTER TABLE public.agent_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
ON public.agent_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like/unlike"
ON public.agent_likes FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Function to handle likes count update
CREATE OR REPLACE FUNCTION update_agent_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.published_agents
        SET likes_count = likes_count + 1
        WHERE id = NEW.agent_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.published_agents
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.agent_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_agent_likes_count ON public.agent_likes;

-- Create trigger
CREATE TRIGGER trigger_update_agent_likes_count
AFTER INSERT OR DELETE ON public.agent_likes
FOR EACH ROW EXECUTE FUNCTION update_agent_likes_count();
