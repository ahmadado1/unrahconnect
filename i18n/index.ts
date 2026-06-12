import AsyncStorage from "@react-native-async-storage/async-storage"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import ar from "./ar.json"
import en from "./en.json"
import fr from "./fr.json"
import tr from "./tr.json"
import ur from "./ur.json"

const initI18n = async () => {
  const savedLang = await AsyncStorage.getItem("language")

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
        fr: { translation: fr },
        ur: { translation: ur },
        tr: { translation: tr },
      },
      lng: savedLang || "en",
      fallbackLng: "en",
      interpolation: { escapeValue: false },
    })
}

initI18n()

export default i18n