# JORNE — Instructions de déploiement complet

## 1. Importer dans Bolt

Importe le zip `jorne-v2.zip` dans bolt.new.
Envoie ce seul message dans Bolt après import :

> Ne crée aucune table. Lance npm install uniquement.

---

## 2. Activer Google OAuth (connexion Google)

Dans Supabase Dashboard :
1. Authentication → Providers → Google → **Enable**
2. Crée un projet Google Cloud Console :
   - console.cloud.google.com → APIs → Credentials → Create OAuth 2.0 Client
   - Authorized redirect URIs : `https://cbvjhenkmwgfvmwzowli.supabase.co/auth/v1/callback`
3. Copie Client ID et Client Secret dans Supabase → Google Provider

---

## 3. Configurer les clés IA (OBLIGATOIRE pour la génération IA)

### Dans Supabase Dashboard → Settings → Edge Functions → Secrets :

Ajoute ces 2 secrets avec tes NOUVELLES clés (regénérées) :

| Nom secret         | Valeur                    |
|--------------------|---------------------------|
| `GEMINI_API_KEY`   | Ta nouvelle clé Gemini    |
| `OPENAI_API_KEY`   | Ta nouvelle clé OpenAI    |

**Où regénérer les clés :**
- Gemini → console.cloud.google.com → APIs & Services → Credentials
- OpenAI → platform.openai.com → API Keys → Create new secret key

### Déployer la Edge Function :

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Lier ton projet
supabase link --project-ref cbvjhenkmwgfvmwzowli

# Déployer la fonction IA
supabase functions deploy ai-generate-day
```

---

## 4. SQL à exécuter dans Supabase (si pas déjà fait)

```sql
-- S'assurer que user_taste_profile existe
CREATE TABLE IF NOT EXISTS user_taste_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  liked_categories JSONB DEFAULT '{}',
  liked_subcategories JSONB DEFAULT '{}',
  liked_ambiance JSONB DEFAULT '{}',
  total_reviews INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_taste_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own taste" ON user_taste_profile FOR ALL USING (auth.uid() = user_id);

-- S'assurer que saved_plans existe
CREATE TABLE IF NOT EXISTS saved_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE saved_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plans" ON saved_plans FOR ALL USING (auth.uid() = user_id);

-- S'assurer que user_profiles existe avec tous les champs
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('masculin','féminin','non précisé')),
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;
```

---

## 5. Comment ça marche

```
Utilisateur clique "Nouveau voyage"
→ choisit dates, type, mood, budget
→ App filtre les lieux Supabase localement (top 20 candidats)
→ Appel Edge Function → Gemini génère la journée
→ Si Gemini échoue → OpenAI prend le relai
→ Si les deux échouent → moteur local garantit un résultat
→ Utilisateur voit sa journée (carte + timeline + agenda)
→ "J'adore" → sauvegarde dans saved_plans
→ Retour HomeScreen → voyage apparaît dans la liste
```

---

## 6. Sécurité

- ✅ Clés IA dans Supabase Secrets (jamais dans le code)
- ✅ RLS activé sur toutes les tables
- ✅ Chaque utilisateur ne voit que ses données
- ✅ Edge Function vérifie le JWT avant tout appel IA
- ✅ Max 20 lieux envoyés à l'IA (pas toute la base)
- ✅ Timeout 12s → fallback automatique
