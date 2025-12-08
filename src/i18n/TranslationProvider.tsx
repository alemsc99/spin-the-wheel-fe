import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import translations from './strings.json';

export type Lang = 'it' | 'en';

type TranslationsMap = Record<string, unknown>;
const translationResources = translations as Record<Lang, TranslationsMap>;

type TranslationContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const TranslationContext = createContext<TranslationContextType | null>(null);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
      return stored === 'en' ? 'en' : 'it';
    } catch (e) {
      return 'it';
    }
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('lang', l);
    } catch (e) {
      // ignore
    }
  }, []);

  const t = useCallback((key: string) => {
    try {
      const map = translationResources[lang] || {};
      const value = map[key];
      return typeof value === 'string' ? value : key;
    } catch (e) {
      return key;
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider');
  return ctx;
};

export default TranslationProvider;
