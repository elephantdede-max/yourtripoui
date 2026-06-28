/**
 * Toast Context — Notifications non-bloquantes en bas d'écran
 *
 * Usage :
 *   const { toast } = useToast();
 *   toast.success('Voyage sauvegardé');
 *   toast.error('Échec de l\'upload');
 *   toast.info('Génération en cours...');
 *   toast.warning('Quota presque atteint');
 *
 * Remplace tous les `alert()` du projet par un toast élégant.
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastApi {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<{ toast: ToastApi } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string, duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    // Vibration tactile sur erreur (iOS)
    if (type === 'error' && 'vibrate' in navigator) navigator.vibrate?.(50);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const toast: ToastApi = {
    success: (msg, dur) => add('success', msg, dur),
    error: (msg, dur) => add('error', msg, dur || 5000), // erreurs restent plus longtemps
    info: (msg, dur) => add('info', msg, dur),
    warning: (msg, dur) => add('warning', msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─────────────────────────────────────────────
// Container UI
// ─────────────────────────────────────────────

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(20px + env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100000,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      pointerEvents: 'none',
      maxWidth: 'calc(100vw - 32px)',
      width: 'auto',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
    const leaveTimer = setTimeout(() => setLeaving(true), toast.duration - 300);
    return () => clearTimeout(leaveTimer);
  }, [toast.duration]);

  const config = {
    success: { Icon: CheckCircle, color: '#4ADE80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.35)' },
    error:   { Icon: AlertCircle, color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.40)' },
    info:    { Icon: Info, color: '#C9A961', bg: 'rgba(201,169,97,0.10)', border: 'rgba(201,169,97,0.35)' },
    warning: { Icon: AlertTriangle, color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.35)' },
  }[toast.type];

  const Icon = config.Icon;

  return (
    <div style={{
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px 12px 14px',
      background: 'rgba(15,12,8,0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: `1px solid ${config.border}`,
      borderRadius: 14,
      boxShadow: '0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      fontFamily: 'var(--f-body)',
      fontSize: 14,
      color: 'var(--text)',
      minWidth: 240,
      maxWidth: 360,
      opacity: leaving ? 0 : (entered ? 1 : 0),
      transform: leaving
        ? 'translateY(20px) scale(0.95)'
        : (entered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)'),
      transition: 'opacity 280ms ease, transform 280ms cubic-bezier(0.18, 0.89, 0.32, 1.28)',
    }}>
      <div style={{
        flexShrink: 0,
        width: 26, height: 26, borderRadius: '50%',
        background: config.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} strokeWidth={2.2} color={config.color} />
      </div>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={onClose}
        aria-label="Fermer"
        style={{
          flexShrink: 0,
          background: 'none', border: 'none',
          padding: 4, cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
