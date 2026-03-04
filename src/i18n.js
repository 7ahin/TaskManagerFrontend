import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ja from './locales/ja.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ms from './locales/ms.json';

const resources = {
  en: { translation: en },
  ja: { translation: ja },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  ms: { translation: ms },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("taskSenpai.language") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
