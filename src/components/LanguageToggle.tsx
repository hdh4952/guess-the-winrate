import { useLanguage } from "../i18n/LanguageContext";
import type { Lang } from "../i18n/strings";

const LANGS: Lang[] = ["ko", "en"];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="lang-toggle">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={"lang-btn" + (lang === l ? " active" : "")}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
