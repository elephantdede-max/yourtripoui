-- ═══════════════════════════════════════════════════════
-- FIX COMPLET RLS user_profiles — À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Ajouter toutes les colonnes nécessaires
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS display_name         TEXT,
  ADD COLUMN IF NOT EXISTS birth_date           DATE,
  ADD COLUMN IF NOT EXISTS gender               TEXT,
  ADD COLUMN IF NOT EXISTS country              TEXT,
  ADD COLUMN IF NOT EXISTS city                 TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url           TEXT,
  ADD COLUMN IF NOT EXISTS lang                 TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS notifs_planning      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifs_review        BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifs_rengagement   BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ DEFAULT now();

-- 2. Supprimer TOUTES les anciennes policies (peu importe leur nom)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. S'assurer que RLS est activé
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Nouvelles policies correctes
CREATE POLICY "profile_select" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profile_insert" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profile_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profile_delete" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- 5. TRIGGER — crée automatiquement la ligne user_profiles dès qu'un compte est créé
-- Cela résout le problème de RLS quand la session n'est pas encore active
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- bypass RLS, tourne avec les droits de postgres
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, lang, notifs_planning, notifs_review, notifs_rengagement)
  VALUES (NEW.id, 'fr', true, true, true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attacher le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. saved_plans
CREATE TABLE IF NOT EXISTS saved_plans (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city       TEXT NOT NULL,
  plan_data  JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE saved_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_all" ON saved_plans;
CREATE POLICY "plans_all" ON saved_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. user_taste_profile
CREATE TABLE IF NOT EXISTS user_taste_profile (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  liked_categories    JSONB DEFAULT '{}',
  liked_subcategories JSONB DEFAULT '{}',
  liked_ambiance      JSONB DEFAULT '{}',
  total_reviews       INTEGER DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_taste_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "taste_all" ON user_taste_profile;
CREATE POLICY "taste_all" ON user_taste_profile FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Désactiver la confirmation email (IMPORTANT pour éviter le bug RLS)
-- Si tu veux la confirmation email, laisse cette ligne commentée
-- UPDATE auth.config SET value = 'false' WHERE key = 'enable_signup_confirm';
