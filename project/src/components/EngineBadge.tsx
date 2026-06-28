import { Sparkles, Wrench, Database } from 'lucide-react';
import { useLang } from '../lib/lang-context';

interface Props {
  source: 'ai' | 'local';
  provider?: string;
  cached?: boolean;
  autoFixed?: boolean;
  retried?: boolean;
  onRegenerate?: () => void;
}

export default function EngineBadge({ source, provider, cached, autoFixed, retried, onRegenerate }: Props) {
  const { t } = useLang();

  if (source === 'ai') {
    const Icon = cached ? Database : Sparkles;
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        background: 'rgba(201,169,97,0.06)',
        border: '1px solid rgba(201,169,97,0.15)',
        borderRadius: 999,
        fontFamily: 'var(--f-mono, monospace)',
        fontSize: 10,
        color: 'var(--text-muted)',
        letterSpacing: '0.04em',
      }}>
        <Icon size={11} strokeWidth={2} color="var(--accent, #C9A961)" />
        <span>
          {cached ? t('engine_cached') : t('engine_ai_generated')}
          {provider && !cached && ` · ${shortName(provider)}`}
          {autoFixed && ` · ${t('engine_auto_adjusted')}`}
          {retried && ` · ${t('engine_retry')}`}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 10px',
      background: 'rgba(244,238,223,0.04)',
      border: '1px solid rgba(244,238,223,0.10)',
      borderRadius: 999,
      fontFamily: 'var(--f-mono, monospace)',
      fontSize: 10,
      color: 'var(--text-faint)',
      letterSpacing: '0.04em',
    }}>
      <Wrench size={11} strokeWidth={2} color="var(--text-muted)" />
      <span>{t('engine_offline')}</span>
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: 'var(--accent, #C9A961)',
            fontFamily: 'inherit', fontSize: 10,
            textDecoration: 'underline', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            marginLeft: 4,
          }}
        >
          {t('engine_retry_ai')}
        </button>
      )}
    </div>
  );
}

function shortName(provider: string): string {
  if (provider.includes('gemini-2.5-pro')) return 'Gemini Pro';
  if (provider.includes('gemini-2.5-flash')) return 'Gemini';
  if (provider.includes('gemini')) return 'Gemini';
  if (provider.includes('groq')) return 'Groq';
  return provider.slice(0, 12);
}