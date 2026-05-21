# YOUR TRIP — Setup complet

## 1. Import dans Bolt
Importe `your-trip-v1.zip` dans bolt.new
Message unique à envoyer dans Bolt :
> Ne crée aucune table. Lance `npm install` uniquement.

## 2. Supabase — SQL à exécuter UNE FOIS
```sql
-- Profils utilisateurs
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date   DATE,
  ADD COLUMN IF NOT EXISTS gender       TEXT,
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS city         TEXT;

-- Voyages sauvegardés
CREATE TABLE IF NOT EXISTS saved_plans (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city       TEXT NOT NULL,
  plan_data  JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE saved_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own plans" ON saved_plans;
CREATE POLICY "own plans" ON saved_plans FOR ALL USING (auth.uid() = user_id);

-- Profil de goûts IA
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
DROP POLICY IF EXISTS "own taste" ON user_taste_profile;
CREATE POLICY "own taste" ON user_taste_profile FOR ALL USING (auth.uid() = user_id);
```

## 3. Google OAuth (connexion Google)
1. Supabase → Authentication → Providers → Google → Enable
2. Google Cloud Console → Credentials → OAuth 2.0 Client ID
   - Redirect URI : `https://cbvjhenkmwgfvmwzowli.supabase.co/auth/v1/callback`
3. Colle Client ID + Secret dans Supabase

## 4. Clés IA (OBLIGATOIRE pour Gemini + OpenAI)
Supabase → Settings → Edge Functions → Secrets :
| Secret | Valeur |
|--------|--------|
| `GEMINI_API_KEY` | Ta clé Gemini (regénérée) |
| `OPENAI_API_KEY` | Ta clé OpenAI (regénérée) |

⚠️ IMPORTANT : Regénère tes clés car elles ont été exposées.
- Gemini : console.cloud.google.com → Credentials
- OpenAI : platform.openai.com → API Keys

Déployer la Edge Function :
```bash
npm install -g supabase
supabase login
supabase link --project-ref cbvjhenkmwgfvmwzowli
supabase functions deploy ai-generate-day
```

## 5. Architecture IA
```
User → App → filtre top 20 lieux Supabase
           → Edge Function → Gemini (principal, 80-90%)
           → Si échec → OpenAI (fallback invisible)
           → Si double échec → moteur local garanti
```
