import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { supabase } from './supabase';

interface ThemeColors {
  gold: string;     // couleur principale (toujours doré pâle)
  accent: string;   // couleur d'identité (doré Free / violet Premium)
  isPremium: boolean;
}

const ThemeContext = createContext<ThemeColors>({
  gold: '#C9A961',
  accent: '#C9A961',
  isPremium: false,
});

const FREE_GOLD = '#C9A961';
const PREMIUM_ACCENT = '#A855F7'; // violet améthyste

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) { setIsPremium(false); return; }
    supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsPremium(data?.is_premium === true));
  }, [user]);

  const value: ThemeColors = {
    gold: FREE_GOLD,
    accent: isPremium ? PREMIUM_ACCENT : FREE_GOLD,
    isPremium,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors() {
  return useContext(ThemeContext);
}