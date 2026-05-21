/*
  # Add lat/lng columns to places table

  Adds geographic coordinates to the places table so the engine can
  calculate distances between places for day itinerary planning.

  1. Changes
    - `places` table: add `lat` (double precision, nullable)
    - `places` table: add `lng` (double precision, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'lat'
  ) THEN
    ALTER TABLE places ADD COLUMN lat double precision;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'lng'
  ) THEN
    ALTER TABLE places ADD COLUMN lng double precision;
  END IF;
END $$;
