-- Migration: 20260225100000_add_agent_policies.sql
-- Add a JSONB 'policies' column to ai_agents for per-agent guardrails configuration.

ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS policies jsonb DEFAULT '{
    "mode": "autonomous",
    "budget_daily_max": null,
    "budget_per_request_max": null,
    "blocked_actions": [],
    "require_approval": [],
    "max_retries": 5,
    "rate_limit_per_min": 100,
    "allowed_scopes": [],
    "forbidden_keywords": [],
    "max_consecutive_failures": 3,
    "active_hours_start": null,
    "active_hours_end": null,
    "min_confidence_score": null,
    "max_tokens_per_action": null
  }'::jsonb;

COMMENT ON COLUMN public.ai_agents.policies IS 'Per-agent guardrails: execution mode, budget limits, blocked actions, approval-required actions, data access scopes, time fencing, confidence threshold, output control.';
