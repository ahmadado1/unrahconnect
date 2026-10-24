// Short tafsir (explanation) of a verse, from trusted, well-known tafsirs in each app language.
//
// Source: the open "Tafsir API" (github.com/spa5k/tafsir_api, MIT licence), plain JSON files
// served by the jsDelivr CDN. No key needed. Each surah is saved on the phone the first time,
// so it works offline after that.
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system/legacy"

export type TafsirEdition = {
  /** Folder name in the Tafsir API */
  slug: string
  /** Shown to the user */
  name: string
  author: string
}

/**
 * Trusted tafsirs per language. The FIRST one is the default (Ibn Kathir: the most detailed).
 * Hausa has no tafsir yet, so Hausa users get the English ones.
 */
export const TAFSIRS: Record<string, TafsirEdition[]> = {
  en: [
    { slug: "en-tafisr-ibn-kathir", name: "Ibn Kathir", author: "Hafiz Ibn Kathir (abridged)" },
    { slug: "en-tafsir-al-mukhtasar", name: "Al-Mukhtasar", author: "Tafsir Center for Quranic Studies" },
  ],
  ar: [
    { slug: "ar-tafsir-ibn-kathir", name: "ابن كثير", author: "الحافظ ابن كثير" },
    { slug: "ar-tafsir-as-saadi", name: "السعدي", author: "عبد الرحمن بن ناصر السعدي" },
    { slug: "ar-tafsir-muyassar", name: "الميسر", author: "مجمع الملك فهد لطباعة المصحف الشريف" },
  ],
  fr: [
    { slug: "french-mokhtasar", name: "Al-Mukhtasar (abrégé)", author: "Centre Tafsir des études coraniques" },
  ],
  ur: [
    { slug: "ur-tafseer-ibn-e-kaseer", name: "ابن کثیر", author: "حافظ ابن کثیر" },
    { slug: "ur-tafsir-as-saadi-urdu", name: "السعدی", author: "عبد الرحمن بن ناصر السعدی" },
  ],
  tr: [
    { slug: "tr-tafsir-ibne-kathir", name: "İbn Kesîr", author: "Hâfız İbn Kesîr" },
    { slug: "turkish-mokhtasar", name: "El-Muhtasar", author: "Tefsir Araştırmaları Merkezi" },
    { slug: "turkish-tafsir-as-saadi-turkish", name: "Sa'dî", author: "Abdurrahman b. Nâsır es-Sa'dî" },
  ],
  bn: [
    { slug: "bn-tafseer-ibn-e-kaseer", name: "ইবনে কাসীর", author: "হাফিজ ইবনে কাসীর (তাওহীদ পাবলিকেশন)" },
    { slug: "bengali-mokhtasar", name: "আল-মুখতাসার", author: "তাফসীর সেন্টার ফর কুরআনিক স্টাডিজ" },
    { slug: "bn-tafsir-abu-bakr-zakaria", name: "আবু বকর জাকারিয়া", author: "বাদশাহ ফাহাদ কুরআন মুদ্রণ কমপ্লেক্স" },
    { slug: "bn-tafsir-ahsanul-bayaan", name: "আহসানুল বায়ান", author: "বায়ান ফাউন্ডেশন" },
  ],
}

const CDN = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir"
const RAW = "https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir"
const CHOICE_KEY = (lang: string) => `tafsir_choice_v2_${lang}`
const DIR = `${FileSystem.documentDirectory}tafsir/`

/** App language → tafsir language (Hausa and unknown → English). */
export function tafsirLanguage(appLanguage: string) {
  const lang = String(appLanguage || "en").slice(0, 2).toLowerCase()
  return TAFSIRS[lang] ? lang : "en"
}

export function tafsirsFor(appLanguage: string) {
  return TAFSIRS[tafsirLanguage(appLanguage)]
}

/** The tafsir the user picked for this language (or the default). */
export async function chosenTafsir(appLanguage: string): Promise<TafsirEdition> {
  const list = tafsirsFor(appLanguage)
  const saved = await AsyncStorage.getItem(CHOICE_KEY(tafsirLanguage(appLanguage))).catch(() => null)
  return list.find(e => e.slug === saved) ?? list[0]
}

export async function saveTafsirChoice(appLanguage: string, slug: string) {
  await AsyncStorage.setItem(CHOICE_KEY(tafsirLanguage(appLanguage)), slug).catch(() => {})
}

type TafsirRow = { ayah: number | string; text: string }
type SurahFile = { ayahs?: TafsirRow[] } | TafsirRow[]

/** Saved surah (offline), as ayah → text. */
async function readSaved(slug: string, surah: number): Promise<Map<number, string> | null> {
  try {
    const path = `${DIR}${slug}/${surah}.json`
    const info = await FileSystem.getInfoAsync(path)
    if (!info.exists) return null
    return toMap(JSON.parse(await FileSystem.readAsStringAsync(path)) as SurahFile)
  } catch {
    return null
  }
}

function toMap(json: SurahFile): Map<number, string> {
  const list = Array.isArray(json) ? json : (json.ayahs ?? [])
  const map = new Map<number, string>()
  for (const row of list) {
    const n = Number(row?.ayah)
    if (Number.isFinite(n) && n > 0) map.set(n, String(row.text ?? ""))
  }
  return map
}

async function fetchJson(path: string) {
  for (const base of [CDN, RAW]) {
    try {
      const res = await fetch(`${base}/${path}`)
      if (res.ok) return await res.json()
    } catch {}
  }
  return null
}

/** Download the whole surah once and keep it on the phone (in the background). */
async function saveSurah(slug: string, surah: number) {
  const json = (await fetchJson(`${slug}/${surah}.json`)) as SurahFile | null
  if (!json) return null
  try {
    await FileSystem.makeDirectoryAsync(`${DIR}${slug}/`, { intermediates: true }).catch(() => {})
    await FileSystem.writeAsStringAsync(`${DIR}${slug}/${surah}.json`, JSON.stringify(json))
  } catch {}
  return toMap(json)
}

export type TafsirResult = {
  text: string
  /** Some tafsirs explain a group of verses together: this is the verse where that explanation starts. */
  fromAyah: number
  edition: TafsirEdition
}

/**
 * Tafsir of one verse. Long tafsirs (like Ibn Kathir) explain several verses at once and leave the
 * others empty: then we show the explanation of the group, starting at the closest verse before.
 */
export async function getTafsir(edition: TafsirEdition, surah: number, ayah: number): Promise<TafsirResult | null> {
  let map = await readSaved(edition.slug, surah)
  if (!map) {
    const online = await isOnline()
    if (!online) {
      // No internet and this tafsir isn't saved: use another saved tafsir of the same language.
      const other = await savedOtherEdition(edition, surah)
      if (other) return pickFromMap(other.map, ayah, other.edition)
      return null
    }
    // Quick answer for this verse while the whole surah downloads for offline use.
    const single = (await fetchJson(`${edition.slug}/${surah}/${ayah}.json`)) as { text?: string } | null
    const savePromise = saveSurah(edition.slug, surah)
    if (single?.text && single.text.trim()) return { text: clean(single.text), fromAyah: ayah, edition }
    map = await savePromise
  }
  if (!map) {
    // Download failed (weak internet): fall back to another saved tafsir.
    const other = await savedOtherEdition(edition, surah)
    return other ? pickFromMap(other.map, ayah, other.edition) : null
  }
  return pickFromMap(map, ayah, edition)
}

function pickFromMap(map: Map<number, string>, ayah: number, edition: TafsirEdition): TafsirResult | null {
  for (let n = ayah; n >= 1; n--) {
    const text = map.get(n)
    if (text && text.trim()) return { text: clean(text), fromAyah: n, edition }
  }
  return null
}

/** Quick internet check (3 seconds), so offline users don't wait for long timeouts. */
async function isOnline(): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    await fetch(`${CDN}/editions.json`, { method: "HEAD", signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/** Another tafsir of the same language that is saved for this surah. */
async function savedOtherEdition(edition: TafsirEdition, surah: number) {
  const lang = Object.keys(TAFSIRS).find(l => TAFSIRS[l].some(e => e.slug === edition.slug)) ?? "en"
  for (const other of TAFSIRS[lang]) {
    if (other.slug === edition.slug) continue
    const map = await readSaved(other.slug, surah)
    if (map) return { edition: other, map }
  }
  return null
}

// ─── Offline ───────────────────────────────────────────────────────────────

export const TOTAL_SURAHS = 114

/** How many surahs of this tafsir are saved on the phone (0..114). */
export async function savedTafsirCount(slug: string): Promise<number> {
  try {
    const files = await FileSystem.readDirectoryAsync(`${DIR}${slug}/`)
    return files.filter(name => /^\d+\.json$/.test(name)).length
  } catch {
    return 0
  }
}

/** Save the surah being read, in the background, so its tafsir also works with no internet. */
export async function prefetchTafsirSurah(appLanguage: string, surah: number) {
  try {
    const edition = await chosenTafsir(appLanguage)
    if (await readSaved(edition.slug, surah)) return
    await saveSurah(edition.slug, surah)
  } catch {}
}

const wholeRuns = new Map<string, { cancelled: boolean }>()

/**
 * Download all 114 surahs of one tafsir (3 at a time). Already saved surahs are skipped, so it
 * continues where it stopped. onProgress gets (saved, 114). Returns true when complete.
 */
export async function downloadWholeTafsir(
  edition: TafsirEdition,
  onProgress?: (saved: number, total: number) => void
): Promise<boolean> {
  if (wholeRuns.has(edition.slug)) return false
  const run = { cancelled: false }
  wholeRuns.set(edition.slug, run)
  try {
    const missing: number[] = []
    for (let s = 1; s <= TOTAL_SURAHS; s++) {
      if (!(await FileSystem.getInfoAsync(`${DIR}${edition.slug}/${s}.json`).catch(() => ({ exists: false }))).exists) missing.push(s)
    }
    let saved = TOTAL_SURAHS - missing.length
    onProgress?.(saved, TOTAL_SURAHS)
    let failed = 0
    for (let i = 0; i < missing.length; i += 3) {
      if (run.cancelled) return false
      const results = await Promise.all(missing.slice(i, i + 3).map(s => saveSurah(edition.slug, s)))
      saved += results.filter(Boolean).length
      failed += results.filter(r => !r).length
      onProgress?.(saved, TOTAL_SURAHS)
      if (failed >= 6) return false // internet gone: stop, try again later
    }
    return failed === 0
  } finally {
    wholeRuns.delete(edition.slug)
  }
}

export function cancelWholeTafsir(slug: string) {
  const run = wholeRuns.get(slug)
  if (run) run.cancelled = true
}

/** Remove HTML tags some tafsirs contain, keep paragraphs. */
function clean(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
