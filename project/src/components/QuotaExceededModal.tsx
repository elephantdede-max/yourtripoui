import { Crown, X } from 'lucide-react';
import { useLang } from '../lib/lang-context';
import type { QuotaInfo } from '../lib/quota';

const G = '#C9A961';

interface Props {
  quotaInfo: QuotaInfo | null;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function QuotaExceededModal({ quotaInfo, onClose, onUpgrade }: Props) {
  const { t, lang } = useLang();

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 400, padding: 20,
      fontFamily: 'var(--f-display)',
    }}>
      <div style={{
        background: '#111', border: `1.5px solid ${G}55`,
        borderRadius: 20, padding: 32, maxWidth: 380, width: '100%',
        position: 'relative', textAlign: 'center',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}>
          <X size={20} color="#888" />
        </button>

        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `${G}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Crown size={32} color={G} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: G, marginBottom: 12 }}>
          {t('quota_exceeded_title')}
        </h2>

        <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.5, marginBottom: 16 }}>
          {t('quota_exceeded_desc')}
        </p>

        {quotaInfo && (
          <div style={{
            background: '#0a0a0a', borderRadius: 12, padding: 16,
            marginBottom: 24, border: `1px solid ${G}33`,
          }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
              {t('quota_used')}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: G }}>
              {quotaInfo.used} / {quotaInfo.max}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
              {t('quota_reset')} {new Date(quotaInfo.resetDate).toLocaleDateString(lang, { day: 'numeric', month: 'long' })}
            </div>
          </div>
        )}

        <button
          onClick={onUpgrade}
          style={{
            width: '100%', padding: '14px', borderRadius: 30,
            background: G, color: '#000', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          {t('quota_upgrade')}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px',
            background: 'transparent', color: '#888', border: 'none',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          {t('quota_exceeded_close')}
        </button>
      </div>
    </div>
  );
}