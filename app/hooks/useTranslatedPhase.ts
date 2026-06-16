import i18n from "@/i18n"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"

const DEEPL_KEY = "21bbc1fa-0c5f-49dc-b357-f6aeea1ee557:fx"

const DEEPL_LANG: Record<string, string> = {
  ar: "AR",
  fr: "FR",
  tr: "TR",
}

async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text) return text
  const cacheKey = `trans_${targetLang}_${text.slice(0, 40).replace(/\s/g, "_")}`
  const cached = await AsyncStorage.getItem(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      },
      body: new URLSearchParams({
        text,
        source_lang: "EN",
        target_lang: targetLang,
      }).toString(),
    })
    const data = await res.json()
    const translated = data.translations?.[0]?.text || text
    await AsyncStorage.setItem(cacheKey, translated)
    return translated
  } catch {
    return text
  }
}

async function translatePhase(phase: any, targetLang: string) {
  const [title, description] = await Promise.all([
    translateText(phase.title, targetLang),
    translateText(phase.description, targetLang),
  ])

  const steps = await Promise.all(
    phase.steps.map((s: string) => translateText(s, targetLang))
  )

  const tips = await Promise.all(
    phase.tips.map((t: string) => translateText(t, targetLang))
  )

  const duas = await Promise.all(
    phase.duas.map(async (dua: any) => ({
      ...dua,
      title: await translateText(dua.title, targetLang),
      translation: await translateText(dua.translation, targetLang),
    }))
  )

  const femaleNote = phase.femaleNote
    ? await translateText(phase.femaleNote, targetLang)
    : undefined

  return { ...phase, title, description, steps, tips, duas, femaleNote }
}

export function useTranslatedPhase(phase: any) {
  // Always start with the original phase — never undefined
  const [translated, setTranslated] = useState(phase)
  const [loading, setLoading] = useState(false)
  const lang = i18n.language

  // Keep translated in sync if phase changes
  useEffect(() => {
    setTranslated(phase)
  }, [phase?.id])

  useEffect(() => {
    if (!phase) return

    const targetLang = DEEPL_LANG[lang]
    if (!targetLang) return  // English or Urdu — use as-is

    setLoading(true)
    translatePhase(phase, targetLang)
      .then(setTranslated)
      .catch(() => setTranslated(phase))  // on error fall back to English
      .finally(() => setLoading(false))
  }, [lang, phase?.id])

  return { translated, loading }
}

export default {}