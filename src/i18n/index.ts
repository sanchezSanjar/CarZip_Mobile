import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { secureStorage } from '@/auth/secure-storage';

import appEn from './app/en.json';
import appKr from './app/kr.json';
import appRu from './app/ru.json';
import appUz from './app/uz.json';
import sharedEn from './shared/en.json';
import sharedKr from './shared/kr.json';
import sharedRu from './shared/ru.json';
import sharedUz from './shared/uz.json';
import serverMessages from './shared/server-messages.json';

/**
 * The four languages of the website: English, Korean, Russian, Uzbek. Each language = the app's own texts
 * (./app) + the ones shared with the website (./shared: enum labels and the server's errors, copied by
 * scripts/sync-web-texts.mjs). The codes are the website's: "kr" for Korean.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kr', label: '한국어' },
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: "O'zbekcha" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const LANGUAGE_KEY = 'carzip.language';

/** the phone's language when CarZip has it (ko -> kr), otherwise English */
function deviceLanguage(): LanguageCode {
  const code = getLocales()[0]?.languageCode;
  if (code === 'ko') return 'kr';
  if (code === 'ru' || code === 'uz') return code;
  return 'en';
}

// the app's own instance (not the i18next global): every screen and helper uses this one
const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...appEn, ...sharedEn } },
    kr: { translation: { ...appKr, ...sharedKr } },
    ru: { translation: { ...appRu, ...sharedRu } },
    uz: { translation: { ...appUz, ...sharedUz } },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
  returnObjects: true, // the weekday names are a list
});

/** app start: the language chosen last time, if any */
export async function loadLanguageChoice(): Promise<void> {
  const saved = await secureStorage.get(LANGUAGE_KEY).catch(() => null);
  if (saved && LANGUAGES.some((language) => language.code === saved)) await i18n.changeLanguage(saved);
}

/** the member picked a language on the Me screen: used now and remembered */
export async function chooseLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  await secureStorage.set(LANGUAGE_KEY, code).catch(() => undefined);
}

/**
 * The server writes its messages in English for people (backend API.md §3). The common ones are translated,
 * like on the website; any other message stays as the server wrote it.
 */
export function translateServerMessage(message: string): string {
  const key = (serverMessages as Record<string, string>)[message];
  return key ? i18n.t(key) : message;
}

export default i18n;
