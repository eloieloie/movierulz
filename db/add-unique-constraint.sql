-- Run this in Supabase SQL Editor to prevent future duplicates
-- Go to https://supabase.com/dashboard/project/ezcnelnuphfyipcsifnv/sql/new

-- Add unique constraint on movie_url (skip if already has duplicates)
ALTER TABLE movies ADD CONSTRAINT movies_movie_url_key UNIQUE (movie_url);

-- Also add an index on title for faster lookups
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies USING btree (title);
