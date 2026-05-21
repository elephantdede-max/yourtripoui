# JORNE — Import Bolt & Guide complet

## Comment importer dans Bolt

### Méthode 1 — Import direct (recommandée)
1. Va sur bolt.new
2. Clique **"Import project"** (ou glisse le zip)
3. Attends npm install automatique
4. L'app démarre sur le preview

### Méthode 2 — Nouveau projet
Si Bolt ne propose pas l'import :
1. Crée un projet **Vite + React + TypeScript** sur bolt.new
2. Ouvre le terminal Bolt
3. Colle CE MESSAGE UNIQUE dans le chat Bolt :

---
Je viens d'importer un projet. Ne crée aucune table,
ne modifie aucun fichier existant.
Lance uniquement : npm install
La Supabase est déjà configurée et fonctionnelle.
---

## Message unique à envoyer à Bolt après import

```
Ce projet est complet. Ne crée aucune table. Ne modifie aucun fichier.
Lance npm install et vérifie que vite démarre sans erreur.
Si une erreur TypeScript apparaît, corrige uniquement la ligne indiquée.
```

## Ce qui est fait dans ce code

### Bugs corrigés
- supabase.ts écrivait dans 'trips' → écrit dans saved_plans ✅
- HomeScreen lisait 'trips' → lit saved_plans ✅
- auth-context.tsx avait du texte parasite → nettoyé ✅
- session.js doublonnait session.ts → supprimé ✅
- index.html sans Google Fonts → polices ajoutées ✅

### Nouvelles fonctionnalités
- Durée modifiable par activité (boutons +15/-15 min) ✅
- Recalcul automatique des horaires en cascade ✅
- Carte OpenStreetMap par journée (Leaflet CDN, zéro clé API) ✅
- Agenda Google Calendar style (vue Jour / Tout) ✅
- Remplacement d'un lieu par un proche de même catégorie ✅
- Seuil 200 votes avant affichage de la note ✅
- Suggestions similaires retirées de l'interface ✅
- Design DA parisienne (crème, Playfair, timeline colorée) ✅
- Couche IA multi-provider (Claude, OpenAI, Mistral, Gemini, Copilot) ✅

## Sécurité

### Ce qui est sécurisé
- Toutes les requêtes Supabase utilisent .eq('user_id', user.id)
- session.ts retourne auth.uid() (Supabase Auth), plus de localStorage
- Les clés IA ne transitent JAMAIS côté client
- Tous les appels IA passent par la Edge Function Supabase (côté serveur)
- RLS activé sur toutes les tables

### Architecture des secrets
```
Client (navigateur)
  ↓ appelle
Edge Function Supabase (serveur sécurisé)
  ↓ utilise les secrets
ANTHROPIC_API_KEY / OPENAI_API_KEY / MISTRAL_API_KEY / GEMINI_API_KEY
```

## Activer l'IA (optionnel)

### 1. Déployer la Edge Function
```bash
supabase login
supabase functions deploy ai-personalize
```

### 2. Configurer les secrets
Dans Supabase → Settings → Edge Functions → Secrets :
- ANTHROPIC_API_KEY → ta clé Claude
- OPENAI_API_KEY → ta clé OpenAI (aussi pour Copilot)
- MISTRAL_API_KEY → ta clé Mistral
- GEMINI_API_KEY → ta clé Gemini

### 3. Utiliser dans l'app
```typescript
import { personalizeWithAI } from './lib/ai-provider';

const result = await personalizeWithAI({
  provider: 'claude',  // ou 'openai', 'mistral', 'gemini', 'copilot'
  userProfile: { ... },
  currentPlan: { ... },
  instruction: "Rends la journée plus romantique",
});
```

## Tables Supabase utilisées

| Table | Usage |
|-------|-------|
| saved_plans | Voyages sauvegardés (lecture + écriture) |
| places | 65 lieux (lecture seule) |
| reviews | Notes utilisateurs (écriture) |
| user_profiles | Profils complets (lecture + écriture) |
| ugc_places | Lieux communautaires |
| feedback | Retours généraux |
| reservations | Demandes de réservation |

## Tables NE PAS CRÉER
- ~~trips~~ ← n'existe pas, pas utilisée
- ~~trip_days~~ ← n'existe pas, pas utilisée
- ~~day_plans~~ ← n'existe pas, pas utilisée
