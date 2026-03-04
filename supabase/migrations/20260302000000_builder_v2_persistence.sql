-- Migration: 20260302000000_builder_v2_persistence.sql
-- Add system_prompt, visual_config, and is_draft to ai_agents for Visual Builder v2

ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS system_prompt text DEFAULT '',
  ADD COLUMN IF NOT EXISTS visual_config jsonb DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;

COMMENT ON COLUMN public.ai_agents.system_prompt IS 'The core instruction set for the AI agent.';
COMMENT ON COLUMN public.ai_agents.visual_config IS 'JSON representation of the React Flow canvas (nodes and edges).';
COMMENT ON COLUMN public.ai_agents.is_draft IS 'Flag to indicate if the agent is still being designed in the builder.';
