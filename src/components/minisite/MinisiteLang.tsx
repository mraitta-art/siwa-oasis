'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MINISITE_LANG_KEY, label, type MinisiteLang } from '@/lib/minisite-i18n';

/**
 * MinisiteLang — one language for a whole minisite.
 *
 * The sectional body used to keep this state to itself while the flat landing
 * page had none, so a visitor could switch to English on `/slug` and land on
 * Arabic at `/slug/section`. The provider now owns the answer once, and every
 * surface — flat landing page, section tab, hero, claim banner — reads it.
 *
 * The address still seeds the first paint: the server passes `initialLang` from
 * `pathLocale()`, so `/en/<slug>` renders English HTML and a returning visitor's
 * stored choice is applied after mount. localStorage is only ever read inside an
 * effect, never during render, which keeps the server and client markup
 * identical on the first pass.
 */

interface MinisiteLangValue {
  lang: MinisiteLang;
  /** Convenience for the `ar ? … : …` idiom already used across the renderers. */
  ar: boolean;
  setLang: (next: MinisiteLang) => void;
  toggle: () => void;
}

const MinisiteLangContext = createContext<MinisiteLangValue | null>(null);

function applyDocumentDirection(lang: MinisiteLang) {
  if (typeof document === 'undefined') return;
  try {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  } catch {
    // A locked-down browser can refuse the write; the container's own `dir`
    // attribute still mirrors the minisite.
  }
}

export function MinisiteLangProvider({
  initialLang = 'ar',
  children,
}: {
  initialLang?: MinisiteLang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<MinisiteLang>(initialLang);

  const setLang = useCallback((next: MinisiteLang) => {
    setLangState(next);
    try {
      localStorage.setItem(MINISITE_LANG_KEY, next);
    } catch {
      // Private mode: the choice lasts for the visit, which is enough.
    }
    applyDocumentDirection(next);
  }, []);

  const toggle = useCallback(() => setLang(lang === 'ar' ? 'en' : 'ar'), [lang, setLang]);

  // Adopt a stored preference after mount, then keep <html> in step with it.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(MINISITE_LANG_KEY);
    } catch {
      stored = null;
    }
    const next: MinisiteLang = stored === 'ar' || stored === 'en' ? stored : initialLang;
    setLangState(next);
    applyDocumentDirection(next);
    // `initialLang` is the server's answer for this URL and cannot change
    // mid-mount; re-running on it would fight the visitor's own choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<MinisiteLangValue>(
    () => ({ lang, ar: lang === 'ar', setLang, toggle }),
    [lang, setLang, toggle]
  );

  return <MinisiteLangContext.Provider value={value}>{children}</MinisiteLangContext.Provider>;
}

/**
 * The language of the minisite. Outside a provider — an admin preview or a
 * vendor review link, where there is no address to seed a locale — it behaves as
 * its own Arabic-first store instead of throwing, so a shared component can be
 * rendered anywhere.
 */
export function useMinisiteLang(): MinisiteLangValue {
  const ctx = useMinisiteLangMaybe();
  const [standalone, setStandalone] = useState<MinisiteLang>('ar');
  const setLang = useCallback((next: MinisiteLang) => {
    setStandalone(next);
    try {
      localStorage.setItem(MINISITE_LANG_KEY, next);
    } catch {
      /* ignored */
    }
    applyDocumentDirection(next);
  }, []);
  const toggle = useCallback(() => setLang(standalone === 'ar' ? 'en' : 'ar'), [standalone, setLang]);

  useEffect(() => {
    if (ctx) return;
    try {
      const stored = localStorage.getItem(MINISITE_LANG_KEY);
      if (stored === 'ar' || stored === 'en') {
        setStandalone(stored);
        applyDocumentDirection(stored);
      }
    } catch {
      /* ignored */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo<MinisiteLangValue>(
    () =>
      ctx ?? {
        lang: standalone,
        ar: standalone === 'ar',
        setLang,
        toggle,
      },
    [ctx, standalone, setLang, toggle]
  );
}

function useMinisiteLangMaybe(): MinisiteLangValue | null {
  return useContext(MinisiteLangContext);
}

/**
 * The EN / عربي control. It used to appear only when an admin flipped
 * `enable_minisite_multilingual`, which left most minisites unable to reach
 * English at all — the platform is Arabic-first and English-complete everywhere
 * else, so the toggle is always here.
 */
export function MinisiteLangToggle({
  accent,
  size = 'md',
  compact = false,
}: {
  accent: string;
  size?: 'sm' | 'md';
  compact?: boolean;
}) {
  const { lang, setLang } = useMinisiteLang();
  const ar = lang === 'ar';
  const pill: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    background: 'rgba(15,23,42,0.06)',
    borderRadius: 999,
    padding: size === 'sm' ? '2px' : '3px',
    border: '1px solid var(--border)',
  };
  const button = (active: boolean): React.CSSProperties => ({
    border: 'none',
    cursor: 'pointer',
    borderRadius: 999,
    padding: size === 'sm' ? '2px 8px' : '3px 10px',
    fontSize: size === 'sm' ? '0.62rem' : '0.66rem',
    fontWeight: 900,
    letterSpacing: '0.4px',
    transition: 'background 0.2s, color 0.2s',
    background: active ? accent : 'transparent',
    color: active ? '#ffffff' : 'var(--text-light)',
  });

  // Compact is the mobile header: one button that names the language it will
  // switch to, rather than two controls in a narrow bar.
  if (compact) {
    return (
      <button type="button" style={button(true)} onClick={() => setLang(ar ? 'en' : 'ar')}>
        {ar ? 'English' : label('ar', true)}
      </button>
    );
  }

  return (
    <div style={pill} role="group" aria-label={ar ? 'لغة الصفحة' : 'Page language'} dir="ltr">
      <button type="button" style={button(!ar)} onClick={() => setLang('en')}>
        EN
      </button>
      <button type="button" style={button(ar)} onClick={() => setLang('ar')}>
        {label('ar', true)}
      </button>
    </div>
  );
}
