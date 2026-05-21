/*
  # Create feedback table

  Stores anonymous user feedback (star ratings + comments) about the app.

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `city` (text) — city the user was planning for
      - `plan_city` (text, nullable)
      - `stars` (integer, 1-5)
      - `comment` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Anyone can insert feedback
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text,
  plan_city text,
  stars integer CHECK (stars >= 1 AND stars <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
