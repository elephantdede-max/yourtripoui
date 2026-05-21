/**
 * YOUR TRIP — Edge Function : ai-generate-day
 * Deploy: supabase functions deploy ai-generate-day
 *
 * Secrets à configurer dans Supabase → Settings → Edge Functions → Secrets :
 *   GEMINI_API_KEY
 *   OPENAI_API_KEY
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `Tu es Your Trip, un expert en planification de journées touristiques personnalisées.
Génère des journées cohérentes, émotionnelles et adaptées au profil utilisateur.
RÈGLES STRICTES :
- Utilise UNIQUEMENT les lieux fournis (ne jamais inventer)
- Respecte les horaires start_hour → end_hour
- Varie les types (pas 3x le même)
- Max 5 étapes par journée
- Réponds UNIQUEMENT en JSON valide, sans markdown`;

function buildPrompt(ctx: any, label: string): string {
  return `Génère une journée pour ${label} à ${ctx.city}.
Budget: ${ctx.budget} | Mood: ${ctx.mood} | Mobilité: ${ctx.mobility}
Horaires: ${ctx.start_hour}h → ${ctx.end_hour}h
Types: ${ctx.trip_type?.join(', ')||'mix'}
Catégories favorites: ${ctx.favorite_categories?.join(', ')||'aucune'}
À éviter: ${ctx.disliked_categories?.join(', ')||'aucune'}

Lieux disponibles (utilise UNIQUEMENT ces IDs):
${JSON.stringify(ctx.available_places)}

JSON attendu:
{"title":"Titre poétique","steps":[{"place_id":"id","start_time":"HH:MM","duration":90,"why":"Raison courte"}]}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return new Response('Non autorisé', { status: 401, headers: CORS });

    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) return new Response('Non autorisé', { status: 401, headers: CORS });

    const { context, dayLabel, provider = 'gemini' } = await req.json();
    const prompt = buildPrompt(context, dayLabel);
    let text = '';

    if (provider === 'gemini') {
      const key = Deno.env.get('GEMINI_API_KEY');
      if (!key) throw new Error('GEMINI_API_KEY missing');
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{parts:[{text:SYSTEM+'\n\n'+prompt}]}], generationConfig:{ responseMimeType:'application/json', temperature:0.75, maxOutputTokens:1024 } }) }
      );
      if (!r.ok) throw new Error(`Gemini ${r.status}`);
      const d = await r.json();
      text = d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    if (provider === 'openai') {
      const key = Deno.env.get('OPENAI_API_KEY');
      if (!key) throw new Error('OPENAI_API_KEY missing');
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
        body: JSON.stringify({ model:'gpt-4o-mini', messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}], response_format:{type:'json_object'}, temperature:0.75, max_tokens:1024 })
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}`);
      const d = await r.json();
      text = d.choices?.[0]?.message?.content ?? '';
    }

    if (!text) throw new Error('Empty response');
    const parsed = JSON.parse(text.trim());
    if (!parsed?.steps?.length) throw new Error('Invalid response');

    return new Response(JSON.stringify(parsed), { headers:{...CORS,'Content-Type':'application/json'} });

  } catch(err) {
    console.error('[ai-generate-day]', err);
    return new Response(JSON.stringify(null), { status:200, headers:{...CORS,'Content-Type':'application/json'} });
  }
});
