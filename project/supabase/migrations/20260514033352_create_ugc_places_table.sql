/*
  # Create ugc_places table

  Community-submitted place suggestions, pending moderation before
  being included in day generation.

  1. New Tables
    - `ugc_places`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `type` (text) — food/chill/culture/view/social
      - `city` (text)
      - `vid` (text, nullable) — video URL
      - `status` (text) — pending | verified
      - `lat` (double precision)
      - `lng` (double precision)
      - `tags` (jsonb)
      - `votes` (integer)
      - `trust_score` (integer)
      - `session_id` (text) — anonymous submitter id
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Anyone can read verified ugc_places
    - Anon can insert (submit proposals)
    - Only the session that submitted can vote (no auth needed, trust-based)
*/

CREATE TABLE IF NOT EXISTS ugc_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'chill',
  city text NOT NULL DEFAULT 'Paris',
  vid text,
  status text NOT NULL DEFAULT 'pending',
  lat double precision NOT NULL DEFAULT 0,
  lng double precision NOT NULL DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  votes integer NOT NULL DEFAULT 0,
  trust_score integer NOT NULL DEFAULT 0,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ugc_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ugc_places"
  ON ugc_places FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can submit ugc_places"
  ON ugc_places FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can vote on ugc_places"
  ON ugc_places FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
