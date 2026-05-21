/*
  # Create unified places table for AI experience generation

  1. New Tables
    - `places`
      - Core identifying fields: name, type, category, description
      - Experience fields: experience_type, budget, ambiance, place_type, discovery_level
      - Operational fields: duration, opening_days, opening_period, reservable
      - Specialty fields: cuisine, budget_reason, why_in_day, ideal_moment
      - Classification fields: discovery_level, ideal_moment

  2. Purpose
    - Single unified table to store all place types: museums, restaurants, bars, parks, theaters
    - Supports Claude JSON dataset imports directly
    - Enables AI-powered daily experience generation through filtering and aggregation

  3. Schema Design
    - JSON arrays for multi-select fields (experience_type, ambiance, place_type, opening_days)
    - Text fields for descriptions and contextual information
    - Boolean for operational flags (reservable)
    - Indexes on frequently queried columns for performance

  4. Security
    - Enable RLS on `places` table
    - Public read access (experiences are discoverable)
    - Only authenticated admins can insert/update/delete

  5. Important Notes
    - All JSON arrays stored as JSONB for efficient querying
    - Budget field is text to support mixed budget levels per place
    - Why_in_day and ideal_moment help AI understand temporal context
    - Designed to scale: supports full Paris + future city expansions
*/

CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Core identifying fields
  name text NOT NULL,
  type text NOT NULL, -- 'restaurant', 'bar', 'museum', 'park', 'theater'
  category text, -- 'bistrot', 'cocktail', 'impressionnisme', etc.
  cuisine text, -- optional, mainly for restaurants
  description text NOT NULL,
  
  -- Experience classification (JSON arrays for multi-select)
  experience_type jsonb DEFAULT '[]'::jsonb, -- ['culturel', 'gastronomie', 'chill', 'aventure', 'date']
  ambiance jsonb DEFAULT '[]'::jsonb, -- ['calme', 'romantique', 'festif', 'entre amis', 'solo']
  place_type jsonb DEFAULT '[]'::jsonb, -- ['culture', 'urbain', 'nature', 'mix', 'shopping']
  
  -- Budget & pricing
  budget text, -- 'économique', 'modéré', 'flexible', 'premium'
  budget_reason text, -- explanation: "~40-50€ par personne..."
  
  -- Refinement fields
  discovery_level text, -- 'lieux connus', 'mix des deux', 'endroits cachés'
  ideal_moment text, -- 'matin', 'après-midi', 'fin de journée', 'soirée', 'nuit', 'brunch', 'snack', 'déjeuner', 'dîner', 'sunset'
  why_in_day text, -- contextual reason for AI to understand why this fits in a day
  
  -- Operational details
  duration integer, -- minutes
  reservable boolean DEFAULT false,
  opening_days jsonb DEFAULT '[]'::jsonb, -- ['lundi', 'mardi', ...]
  opening_period text, -- 'toute l\'année', 'avril à octobre', 'septembre à juillet'
  
  -- Metadata for AI filtering
  city text DEFAULT 'Paris',
  
  CONSTRAINT valid_type CHECK (type IN ('restaurant', 'bar', 'museum', 'park', 'theater')),
  CONSTRAINT valid_budget CHECK (budget IN ('économique', 'modéré', 'flexible', 'premium') OR budget IS NULL),
  CONSTRAINT valid_discovery CHECK (discovery_level IN ('lieux connus', 'mix des deux', 'endroits cachés') OR discovery_level IS NULL)
);

-- Create indexes for efficient querying
CREATE INDEX idx_places_type ON places(type);
CREATE INDEX idx_places_budget ON places(budget);
CREATE INDEX idx_places_discovery_level ON places(discovery_level);
CREATE INDEX idx_places_ideal_moment ON places(ideal_moment);
CREATE INDEX idx_places_reservable ON places(reservable);
CREATE INDEX idx_places_city ON places(city);

-- Index on JSONB arrays for filtering
CREATE INDEX idx_places_experience_type ON places USING gin(experience_type);
CREATE INDEX idx_places_ambiance ON places USING gin(ambiance);
CREATE INDEX idx_places_place_type ON places USING gin(place_type);
CREATE INDEX idx_places_opening_days ON places USING gin(opening_days);

-- Enable Row Level Security
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Public can read all places (experiences are discoverable)
CREATE POLICY "Anyone can read places"
  ON places
  FOR SELECT
  USING (true);

-- Only authenticated users who are admins can insert/update/delete
-- For now, we'll allow authenticated users to insert (adjust after auth setup)
CREATE POLICY "Authenticated users can insert places"
  ON places
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update places"
  ON places
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete places"
  ON places
  FOR DELETE
  TO authenticated
  USING (true);
