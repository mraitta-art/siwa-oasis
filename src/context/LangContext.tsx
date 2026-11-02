'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { type Lang, type Translations, getStrings } from '@/lib/i18n/vendor';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: Translations;
  isRTL: boolean;
}

export const LangContext = createContext<LangContextValue>({
  lang: 'ar',
  setLang: () => {},
  toggleLang: () => {},
  t: getStrings('ar'),
  isRTL: true,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEnRoute = pathname?.startsWith('/en');

  // Arabic-first default for bare routes (e.g. /vendor), 'en' only for /en/* routes
  const [lang, setLangState] = useState<Lang>(isEnRoute ? 'en' : 'ar');

  useEffect(() => {
    if (isEnRoute) {
      setLangState('en');
      return;
    }
    try {
      const saved = localStorage.getItem('siwa_lang_pref') as Lang | null;
      if (saved === 'ar' || saved === 'en') {
        setLangState(saved);
      } else {
        setLangState('ar');
      }
    } catch {
      setLangState('ar');
    }
  }, [isEnRoute]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('siwa_lang_pref', l); } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    const next = lang === 'en' ? 'ar' : 'en';
    setLangState(next);
    try { localStorage.setItem('siwa_lang_pref', next); } catch {}
  }, [lang]);

  const isRTL = lang === 'ar';
  const t = getStrings(lang);

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t, isRTL }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}
