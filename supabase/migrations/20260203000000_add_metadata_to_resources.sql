-- Add metadata column to monitored_resources for storing extra info like num_members
ALTER TABLE public.monitored_resources 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add team_id to link resources (channels) to teams
ALTER TABLE public.monitored_resources
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_monitored_resources_team_id ON public.monitored_resources(team_id);
