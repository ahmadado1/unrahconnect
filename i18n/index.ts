import AsyncStorage from "@react-native-async-storage/async-storage"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import ar from "./ar.json"
import bn from "./bn.json"
import en from "./en.json"
import fr from "./fr.json"
import tr from "./tr.json"
import ur from "./ur.json"

function humanizeKey(key: string): string {
  return key
    .replace(/[._]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, c => c.toUpperCase())
}

// Sync init first so the app never mounts without i18n ready.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    bn: { translation: bn },
    fr: { translation: fr },
    ur: { translation: ur },
    tr: { translation: tr },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
  // If a key is missing from the active language, fall back to English.
  // If it's also missing from English, never show the raw identifier.
  parseMissingKeyHandler: (key: string) => {
    const fromEn = i18n.getResource("en", "translation", key)
    if (typeof fromEn === "string" && fromEn.length > 0) return fromEn
    if (__DEV__) {
      console.warn(`[i18n] Missing translation key: ${key}`)
    }
    return humanizeKey(key)
  },
})

// Restore saved language after storage is available.
AsyncStorage.getItem("language")
  .then(savedLang => {
    if (savedLang && savedLang !== i18n.language) {
      return i18n.changeLanguage(savedLang)
    }
  })
  .catch(console.warn)

export default i18n
