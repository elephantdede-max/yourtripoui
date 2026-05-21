import { createContext, useContext, useState, useEffect } from 'react';
import { translations, type LangCode } from './i18n';
import { supabase } from './supabase';

interface LangContextType {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('fr');

  // Charger la langue sauvegardée du profil au démarrage
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('lang')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.lang) setLangState(data.lang as LangCode);
    })();
  }, []);

  // Changer la langue + sauvegarder dans Supabase
  const setLang = async (l: LangCode) => {
    setLangState(l);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({ lang: l }).eq('id', user.id);
    }
  };

  // Fonction de traduction liée à la langue courante
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