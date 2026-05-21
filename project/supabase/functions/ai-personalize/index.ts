/**
 * JORNE — Edge Function Supabase : ai-personalize
 * Déploiement : supabase functions deploy ai-personalize
 *
 * Cette fonction est le seul endroit où les clés API IA sont utilisées.
 * Elles sont stockées dans Supabase Secrets, jamais exposées au client.
 *
 * Variables à configurer dans Supabase → Settings → Edge Functions → Secrets :
 *   ANTHROPIC_API_KEY   → pour Claude
 *   OPENAI_API_KEY      → pour OpenAI et Copilot
 *   MISTRAL_API_KEY     → pour Mistral
 *   GEMINI_API_KEY      → pour Gemini
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── Vérifier l'authentification ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Non autorisé', { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response('Non autorisé', { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { provider = 'claude', userProfile, currentPlan, instruction } = body;

    // ── Construire le prompt ──
    const systemPrompt = `Tu es un expert en planification de journées touristiques personnalisées.
Tu reçois le profil de goûts d'un utilisateur et son planning actuel.
Tu dois suggérer des améliorations concrètes et justifiées.
Réponds UNIQUEMENT en JSON valide, sans markdown.`;

    const userPrompt = `Profil utilisateur : ${JSON.stringify(userProfile)}
Planning actuel : ${JSON.stringify(currentPlan)}
Instruction : ${instruction}
Retourne un JSON avec : { suggestions: [{stepId, action, reason, newPlace?}], globalAdvice }`;

    let responseText = '';

    // ── Appel au bon provider ──
    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      const data = await res.json();
      responseText = data.content?.[0]?.text ?? '{}';

    } else if (provider === 'openai' || provider === 'copilot') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY') ?? ''}`,
        },
        body: JSON.stringify({
          model: provider === 'copilot' ? 'gpt-4o' : 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content ?? '{}';

    } else if (provider === 'mistral') {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('MISTRAL_API_KEY') ?? ''}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content ?? '{}';

    } else if (provider === 'gemini') {
      const apiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      const data = await res.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    }

    // ── Parser la réponse ──
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { suggestions: [], globalAdvice: responseText };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[ai-personalize]', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
