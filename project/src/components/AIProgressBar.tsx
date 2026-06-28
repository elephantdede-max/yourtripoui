/**
 * AIProgressBar — Lot C
 *
 * Barre de progression pendant la génération IA, avec messages qui changent
 * selon le temps écoulé. Donne l'impression que ça avance.
 *
 * Usage : <AIProgressBar duration={12000} />
 * Affiche un message différent toutes les 2-3 secondes.
 */

import { useEffect, useState } from 'react';

interface Props {
  duration?: number;     // estimation en ms (par défaut 12s pour Gemini)
  city?: string;
  isPremium?: boolean;
}

const MESSAGES_FREE = [
  { at: 0,    text: "Analyse de vos préférences..." },
  { at: 2500, text: "Sélection des meilleurs lieux..." },
  { at: 5500, text: "Optimisation du parcours..." },
  { at: 8500, text: "Calcul des trajets..." },
  { at: 11500, text: "Finalisation..." },
];

const MESSAGES_PREMIUM = [
  { at: 0,    text: "Analyse de votre profil de goûts..." },
  { at: 2000, text: "Sélection premium des lieux..." },
  { at: 4500, text: "Création du parcours sur mesure..." },
  { at: 7500, text: "Adaptation à votre humeur..." },
  { at: 10500, text: "Touches finales..." },
];

export default function AIProgressBar({ duration = 12000, city = '', isPremium = false }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);

  const messages = isPremium ? MESSAGES_PREMIUM : MESSAGES_FREE;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(e);
      // Trouver le dernier message dont .at <= elapsed
      const idx = messages.findIndex((m, i) => {
        const next = messages[i + 1];
        return m.at <= e && (!next || next.at > e);
      });
      if (idx !== -1) setMessageIdx(idx);
    }, 100);
    return () => clearInterval(interval);
  }, [messages]);

  // Progress : capé à 95% pour qu'on n'atteigne jamais 100% avant la vraie fin
  const progress = Math.min(95, (elapsed / duration) * 95);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      alignItems: 'center',
      maxWidth: 320,
      margin: '0 auto',
    }}>
      {/* Message courant */}
      <div style={{
        fontFamily: 'var(--f-body)',
        fontSize: 14,
        color: 'var(--text-muted)',
        textAlign: 'center',
        minHeight: 20,
        transition: 'opacity 250ms ease',
      }} key={messageIdx}>
        {messages[messageIdx]?.text}
        {city && ` ${city}`}
      </div>

      {/* Barre */}
      <div style={{
        width: '100%',
        height: 4,
        background: 'rgba(244,238,223,0.08)',
        borderRadius: 999,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'var(--grad-logo, linear-gradient(90deg, #C9A961, #D4A843))',
          transition: 'width 300ms ease',
          boxShadow: '0 0 8px rgba(201,169,97,0.4)',
        }} />
      </div>

      {/* Temps écoulé (subtle) */}
      <div style={{
        fontFamily: 'var(--f-mono)',
        fontSize: 10,
        color: 'var(--text-faint, rgba(244,238,223,0.3))',
        letterSpacing: '0.05em',
      }}>
        {Math.floor(elapsed / 1000)}s
      </div>
    </div>
  );
}
