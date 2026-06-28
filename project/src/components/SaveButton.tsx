import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface Props {
  /** Action async à exécuter au clic. Peut throw, on l'attrape silencieusement. */
  onSave: () => Promise<void>;
  /** Label par défaut du bouton (ex: "Enregistrer", "Mettre à jour"). */
  children: React.ReactNode;
  /** Label affiché pendant l'envoi. Défaut: "Sauvegarde…". */
  savingLabel?: string;
  /** Label affiché après succès. Défaut: "Enregistré". */
  savedLabel?: string;
  /** Durée d'affichage du "Enregistré ✓" en ms avant reset. Défaut 1500. */
  successDuration?: number;
  /** Désactivation externe (validation formulaire, etc.). */
  disabled?: boolean;
  /** Override styles (le composant a des défauts cohérents avec la DA). */
  style?: React.CSSProperties;
}

type Phase = 'idle' | 'saving' | 'saved';

export default function SaveButton({
  onSave,
  children,
  savingLabel = 'Sauvegarde…',
  savedLabel = 'Enregistré',
  successDuration = 1500,
  disabled,
  style,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');

  const handleClick = async () => {
    if (phase !== 'idle' || disabled) return;
    setPhase('saving');
    try {
      await onSave();
      if ('vibrate' in navigator) navigator.vibrate?.([10, 30, 10]);
      setPhase('saved');
      setTimeout(() => setPhase('idle'), successDuration);
    } catch (e) {
      // Échec silencieux (pas de toast d'erreur — choix validé)
      console.warn('[SaveButton] save failed', e);
      setPhase('idle');
    }
  };

  const isBusy = phase !== 'idle';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isBusy}
      style={{
        width: '100%',
        padding: 17,
        background: 'var(--grad-logo)',
        color: '#1A1208',
        border: 'none',
        borderRadius: 999,
        fontFamily: 'var(--f-body)',
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: '-0.005em',
        cursor: isBusy ? 'default' : (disabled ? 'not-allowed' : 'pointer'),
        opacity: disabled && !isBusy ? 0.5 : 1,
        boxShadow: '0 10px 28px rgba(212,168,67,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'transform 200ms ease',
        transform: phase === 'saved' ? 'scale(1.04)' : 'scale(1)',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        ...style,
      }}
    >
      {phase === 'saving' && (
        <>
          <Loader2 size={16} strokeWidth={2.4} className="save-btn-spin" />
          {savingLabel}
        </>
      )}
      {phase === 'saved' && (
        <span className="save-btn-pop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Check size={16} color="#1A1208" strokeWidth={2.6} />
          {savedLabel}
        </span>
      )}
      {phase === 'idle' && children}

      <style>{`
        @keyframes save-btn-spin { to { transform: rotate(360deg); } }
        @keyframes save-btn-pop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .save-btn-spin { animation: save-btn-spin 1s linear infinite; }
        .save-btn-pop { animation: save-btn-pop 280ms cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </button>
  );
}