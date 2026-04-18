import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';

import en from './locales/en';
import es from './locales/es';

// Detect device locale without react-native-localize native module linking requirement
const deviceLocale: string =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      'en'
    : NativeModules.I18nManager?.localeIdentifier || 'en';

const languageCode = deviceLocale.substring(0, 2);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: languageCode,
  fallbackLng: 'en',
  interpolation: {
    // React already escapes values, so no need for i18next to do it
    escapeValue: false,
  },
});

export default i18n;
