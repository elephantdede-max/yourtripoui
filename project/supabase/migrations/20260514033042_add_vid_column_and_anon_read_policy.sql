/*
  # Add vid column and anonymous read policy for places

  1. Changes
    - `places` table: add `vid` (text, nullable) for video URLs
  2. Security
    - Add SELECT policy for anonymous users so the app can read places without auth
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'vid'
  ) THEN
    ALTER TABLE places ADD COLUMN vid text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'places' AND policyname = 'Anyone can read places'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can read places" ON places FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;
