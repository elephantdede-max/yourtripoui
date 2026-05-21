import { useState } from 'react';
import { Globe, X, Check } from 'lucide-react';
import { LANGUAGES, type LangCode } from '../lib/i18n';

const G = '#C9A961';
const BG = '#000000';

interface Props {
  currentLang: LangCode;
  onSelect: (lang: LangCode) => void;
  className?: string;
}

export default function LanguageSelector({ currentLang, onSelect, className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: `1.5px solid ${G}`,
          borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
          fontFamily: 'var(--f-display)', fontSize: 13, color: G,
        }}
      >
        <Globe size={13} color={G} />
        <span>{current.flag} {current.label}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: BG, border: `2px solid ${G}`,
              borderRadius: '16px 16px 0 0', padding: '20px 20px 32px',
              width: '100%', maxWidth: 430, maxHeight: '80vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 700, color: G }}>Langue / Language</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color={G} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { onSelect(lang.code); setIsOpen(false); }}
                  style={{
                    padding: '10px 12px', border: `2px solid ${G}`,
                    borderRadius: 10, cursor: 'pointer',
                    background: currentLang === lang.code ? G : BG,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'var(--f-display)', fontSize: 13,
                    color: currentLang === lang.code ? BG : G,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{lang.flag}</span>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 12 }}>{lang.label}</span>
                  {currentLang === lang.code && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
