/*
  # Setup reviews and ratings system

  1. New Tables
    - `places` - Enhanced with ratings
    - `reviews` - User ratings for places

  2. Changes to places table
    - Add rating_average (decimal)
    - Add review_count (integer)

  3. New reviews table
    - Stores individual user ratings
    - Links to places and users

  4. Security
    - Enable RLS
    - Users can read all reviews
    - Users can write their own reviews
*/

-- Alter places table to add rating fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'rating_average'
  ) THEN
    ALTER TABLE places ADD COLUMN rating_average decimal(3,1) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE places ADD COLUMN review_count integer DEFAULT 0;
  END IF;
END $$;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  
  UNIQUE(place_id, user_id)
);

-- Create indexes
CREATE INDEX idx_reviews_place_id ON reviews(place_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update place ratings
CREATE OR REPLACE FUNCTION update_place_ratings(place_id_param uuid)
RETURNS void AS $$
DECLARE
  avg_rating decimal(3,1);
  total_reviews integer;
BEGIN
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    COUNT(*)
  INTO avg_rating, total_reviews
  FROM reviews
  WHERE place_id = place_id_param;
  
  UPDATE places
  SET rating_average = avg_rating,
      review_count = total_reviews
  WHERE id = place_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update ratings when review is inserted/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_place_ratings()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_place_ratings(OLD.place_id);
  ELSE
    PERFORM update_place_ratings(NEW.place_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_update_place_ratings();
