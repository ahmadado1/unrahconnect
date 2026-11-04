// "About this surah": background, themes and main lessons, from the Quran Foundation (Quran.com).
// The app asks our Supabase function "surah-info" (it holds the secret key), then keeps the
// answer on the phone so it opens instantly and offline next time.
import { supabase } from "@/lib/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"

export type SurahInfoBlock = { kind: "heading" | "text"; text: string }
export type SurahInfo = { blocks: SurahInfoBlock[]; short: string; source: string }

const LANGS = ["en", "ar", "fr", "ur", "tr", "bn"]
const KEY = (surah: number, lang: string) => `surah_info_v1_${lang}_${surah}`

function infoLanguage(appLanguage: string) {
  const lang = String(appLanguage || "en").slice(0, 2).toLowerCase()
  return LANGS.includes(lang) ? lang : "en"
}

/** The text comes as simple HTML (<h2>, <p>). Turn it into headings and paragraphs. */
function toBlocks(html: string): SurahInfoBlock[] {
  const blocks: SurahInfoBlock[] = []
  const parts = html.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)/i)
  for (const part of parts) {
    const isHeading = /^<h[1-6]/i.test(part)
    const text = part
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
    if (text) blocks.push({ kind: isHeading ? "heading" : "text", text })
  }
  return blocks
}

/** Returns null when it is not available (no internet the first time, or not set up yet). */
export async function getSurahInfo(surah: number, appLanguage: string): Promise<SurahInfo | null> {
  const lang = infoLanguage(appLanguage)
  try {
    const saved = await AsyncStorage.getItem(KEY(surah, lang))
    if (saved) return JSON.parse(saved) as SurahInfo
  } catch {}
  const save = async (raw: { text?: unknown; short_text?: unknown; source?: unknown }) => {
    const info: SurahInfo = { blocks: toBlocks(String(raw.text)), short: String(raw.short_text ?? ""), source: String(raw.source ?? "") }
    await AsyncStorage.setItem(KEY(surah, lang), JSON.stringify(info)).catch(() => {})
    return info
  }
  // 1) Our Supabase function (Quran Foundation API, cached in the database).
  try {
    const { data, error } = await supabase.functions.invoke("surah-info", { body: { surah, lang } })
    if (!error && data?.text) return await save(data)
  } catch {}
  // 2) Fallback: Quran.com's public API (no key). Falls back to English if this language has no text.
  for (const l of lang === "en" ? ["en"] : [lang, "en"]) {
    try {
      const res = await fetch(`https://api.quran.com/api/v4/chapters/${surah}/info?language=${l}`)
      if (!res.ok) continue
      const json = await res.json()
      const info = json?.chapter_info
      if (info?.text) return await save(info)
    } catch {}
  }
  return null
}
