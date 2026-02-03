-- Add metadata column to monitored_resources for storing extra info like num_members
ALTER TABLE public.monitored_resources 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
