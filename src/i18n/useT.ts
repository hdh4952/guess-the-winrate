import { strings, type Strings } from "./strings";
import { useLanguage } from "./LanguageContext";

/** Returns the active-language string table. Usage: const t = useT(); t.next */
export function useT(): Strings {
  const { lang } = useLanguage();
  return strings[lang];
}
