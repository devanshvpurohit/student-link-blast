-- Supabase-compatibility stubs for local Postgres testing.
-- Mirrors the parts of Supabase's auth / storage schemas that the app migrations depend on.
-- Does NOT replicate real auth; auth.uid() reads the session override GUC below:
--
--   SELECT set_config('app.user_id', '<uuid>', false);   -- "log in" as a user
--   SELECT set_config('app.user_id', '', false);          -- "log out" (NULL)

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text,
  public boolean
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now()
);

-- Returns the path segments of an object name, e.g. 'userid/photo.jpg' -> {userid,photo.jpg}
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
  SELECT string_to_array(name, '/')
$$;

-- The migrations add tables to this publication; it must exist locally.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Extensions used by migrations and default values
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Non-owner role for testing RLS (table owners bypass RLS).
-- Table privileges are granted in setup_test_db.sh AFTER the migrations run.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_anon') THEN
    CREATE ROLE app_anon NOLOGIN;
  END IF;
END $$;
GRANT USAGE ON SCHEMA public, auth, storage TO app_anon;