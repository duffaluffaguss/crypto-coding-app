-- Add contract_abi column to store ABI for frontend generation
-- Run this in your Supabase SQL Editor

-- Add ABI storage to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS contract_abi jsonb;

-- Add generated frontend storage
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS generated_frontend text;
