-- Migration: 20260317150000_add_knowledge_to_agents.sql
-- Add knowledge_configuration to ai_agents table

ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS knowledge_configuration jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.ai_agents.knowledge_configuration IS 'RAG settings including text snippets, URLs, and file references.';
