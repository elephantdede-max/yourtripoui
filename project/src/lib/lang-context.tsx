import { createContext, useContext, useState, useEffect } from 'react';
import { translations, type LangCode, setGlobalLang, getGlobalLang } from './i18n';
import { supabase } from './supabase';

interface LangContextType {
  lang: LangCode;
  setLang: (l: LangCode) => Promise<void>;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: React.ReactNode }) {
  // On lit la langue déjà initialisée dans i18n.ts (localStorage ou navigateur)
  const [lang, setLangState] = useState<LangCode>(getGlobalLang());

  // Si user connecté → la langue de son profil prend le dessus
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('lang')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.lang && data.lang !== lang) {
        setGlobalLang(data.lang as LangCode);
        setLangState(data.lang as LangCode);
      }
    })();
  }, []);

  const setLang = async (l: LangCode) => {
    setGlobalLang(l);       // 1. Variable globale + localStorage (synchrone)
    setLangState(l);        // 2. State React → re-render des composants qui consomment useLang()
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({ lang: l }).eq('id', user.id);
    }
  };

  const t = (key: string): string => {
    const dict = translations[lang] || translations.fr;
    return dict[key] || translations.fr[key] || key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}