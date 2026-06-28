import { useState, useEffect } from 'react';
import Logo from './Logo';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';

interface Props { lang: LangCode; onReady: () => void; }

export default function LoadingScreen({ onReady }: Props) {
  const { t } = useLang();
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const MESSAGES = [
    t('step_analyze'),
    t('step_select'),
    t('step_route'),
    t('step_finalize'),
  ];

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIdx(i => Math.min(i + 1, MESSAGES.length - 1)), 900);
    const progTimer = setInterval(() => setProgress(p => Math.min(p + 2, 95)), 60);
    const doneTimer = setTimeout(onReady, 3200);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); clearTimeout(doneTimer); };
  }, [onReady]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>

      <div style={{
        marginBottom: 28,
        animation: 'yt-pulse 2.4s ease-in-out infinite',
      }}>
        <Logo.Icon size={80} />
      </div>

      <div style={{ marginBottom: 36 }}>
        <Logo.Wordmark size={32} />
      </div>

      <h2 style={{
        fontFamily: 'var(--f-display)',
        fontSize: 22,
        fontWeight: 400,
        fontStyle: 'italic',
        color: 'var(--text)',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: '-0.01em',
      }}>
        {t('preparing')}
      </h2>

      <p style={{
        fontFamily: 'var(--f-body)',
        fontSize: 14,
        color: 'var(--text-muted)',
        marginBottom: 36,
        textAlign: 'center',
        minHeight: 22,
        transition: 'opacity 300ms',
      }}>
        {MESSAGES[msgIdx]}
      </p>

      <div style={{
        width: 200, height: 3,
        background: 'var(--bg-elevated)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'width 60ms linear',
          boxShadow: '0 0 8px var(--accent)',
        }} />
      </div>

      <p style={{
        marginTop: 14,
        fontSize: 11,
        fontFamily: 'var(--f-mono)',
        color: 'var(--text-faint)',
        letterSpacing: '0.15em',
      }}>
        {progress}%
      </p>

      <style>{`
        @keyframes yt-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}