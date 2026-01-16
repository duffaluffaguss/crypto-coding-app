-- Local Development Setup for PostgreSQL
-- This mocks Supabase auth for local development
-- Run this BEFORE schema.sql when using local PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auth schema (mimics Supabase)
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table (minimal version)
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE,
  encrypted_password text,
  raw_user_meta_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create a session variable to store current user id
-- This will be set by the application on each request
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Create authenticated role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END
$$;

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Helper function to set the current user for a session
CREATE OR REPLACE FUNCTION auth.set_current_user(user_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  SELECT set_config('app.current_user_id', user_id::text, false);
$$;

-- Helper function to create a test user and return their id
CREATE OR REPLACE FUNCTION auth.create_test_user(
  p_email text DEFAULT 'test@example.com',
  p_display_name text DEFAULT 'Test User'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (email, raw_user_meta_data)
  VALUES (p_email, jsonb_build_object('display_name', p_display_name))
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.set_current_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.create_test_user(text, text) TO authenticated;
