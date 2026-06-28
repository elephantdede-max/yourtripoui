import { useState } from 'react';
import { X } from 'lucide-react';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';

const G = '#C9A961';
const BG = '#000000';

interface Props {
  title: string;
  description: string;
  className?: string;
  lang?: LangCode;
}

export default function Tooltip({ title, description, className = '' }: Props) {
  const { t } = useLang();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
        style={{
          width: 22, height: 22, borderRadius: '50%',
          border: `1.5px solid ${G}`, background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          fontFamily: 'var(--f-display)', fontSize: 13, fontWeight: 700, color: G,
        }}
      >
        ?
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: BG, border: `2px solid ${G}`, borderRadius: 16,
              padding: '24px 20px', maxWidth: 360, width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 700, color: G }}>{title}</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color={G} />
              </button>
            </div>
            <p style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: '#888', lineHeight: 1.6 }}>{description}</p>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%', marginTop: 20, padding: '12px',
                background: G, border: 'none', borderRadius: 24, cursor: 'pointer',
                fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 700, color: BG,
              }}
            >
              {t('understood')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}