'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Lang, type Translations, getStrings } from '@/lib/i18n/vendor';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: Translations;
  isRTL: boolean;
}

export const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: getStrings('en'),
  isRTL: false,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vendor_lang') as Lang | null;
      if (saved === 'ar' || saved === 'en') {
        setLangState(saved);
      }
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('vendor_lang', l); } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'ar' : 'en');
  }, [lang, setLang]);

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
