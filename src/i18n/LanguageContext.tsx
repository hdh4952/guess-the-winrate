import { createContext, useContext, useState, type ReactNode } from "react";
import { detectLang, LANG_KEY, type Lang } from "./strings";

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

// Default ko so components rendered without a provider (e.g. unit tests) are stable.
const LanguageContext = createContext<LanguageValue>({ lang: "ko", setLang: () => {} });

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(() => initialLang ?? detectLang());

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore persistence failures (private mode) */
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageValue {
  return useContext(LanguageContext);
}
