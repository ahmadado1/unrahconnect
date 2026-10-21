// Smarter hotel search.
// Understands plain words people type, in English and some Arabic / French / Urdu / Turkish:
//   "cheap", "budget", "5 star", "luxury", "near haram", "walking", "clock tower", "shuttle",
//   brand names (hilton, movenpick, swissotel...), a city ("makkah", "medina", "مكة"),
// and small typos ("swisotel", "movenpik"). Results are sorted best match first.
import type { HotelCity } from "./hotels"
import type { CatalogHotel } from "./hotelCatalog"

export type HotelSearchResult = {
  /** City named in the search, if any (the screen switches to it) */
  city: HotelCity | null
  hotels: CatalogHotel[]
}

/** lower case, no accents (ö → o, é → e), no punctuation */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

const CITY_WORDS: Record<string, HotelCity> = {
  makkah: "Makkah", mecca: "Makkah", makka: "Makkah", mekka: "Makkah", mecque: "Makkah", mekke: "Makkah", مكة: "Makkah", مكه: "Makkah", مکہ: "Makkah",
  madinah: "Madinah", medina: "Madinah", madina: "Madinah", medine: "Madinah", المدينة: "Madinah", مدينة: "Madinah", مدینہ: "Madinah",
}

/** Words that only describe what kind of hotel (they filter, they don't need to be in the name). */
type Want = { budget?: boolean; stars?: number; near?: boolean; shuttle?: boolean; clock?: boolean }

const WANT_WORDS: Record<string, Want> = {
  cheap: { budget: true }, cheapest: { budget: true }, budget: { budget: true }, affordable: { budget: true },
  economy: { budget: true }, low: { budget: true }, value: { budget: true }, رخيص: { budget: true }, اقتصادي: { budget: true },
  pas: { budget: true }, cher: { budget: true }, ucuz: { budget: true }, سستا: { budget: true },
  luxury: { stars: 5 }, lux: { stars: 5 }, luxe: { stars: 5 }, فاخر: { stars: 5 }, lüks: { stars: 5 }, luks: { stars: 5 },
  near: { near: true }, close: { near: true }, closest: { near: true }, nearby: { near: true }, walk: { near: true },
  walking: { near: true }, قريب: { near: true }, proche: { near: true }, yakin: { near: true }, قریب: { near: true },
  shuttle: { shuttle: true }, bus: { shuttle: true }, navette: { shuttle: true }, servis: { shuttle: true },
  clock: { clock: true }, tower: { clock: true }, abraj: { clock: true }, bait: { clock: true }, الساعة: { clock: true }, ابراج: { clock: true },
  برج: { clock: true }, horloge: { clock: true }, saat: { clock: true }, kulesi: { clock: true }, کلاک: { clock: true }, ٹاور: { clock: true },
}

/** Words that add nothing ("hotel", "in", "the"...) */
const IGNORE = new Set([
  "hotel", "hotels", "the", "in", "at", "a", "an", "of", "to", "and", "with", "for", "me", "show", "find",
  "haram", "mosque", "masjid", "nabawi", "prophets", "fondouk", "otel", "oteli", "فندق", "فنادق", "ہوٹل",
  "star", "stars", "etoiles", "etoile", "yildiz", "نجوم", "rooms", "room",
])

/** Edit distance, stops early when it is clearly too far. */
function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur.push(v)
      if (v < best) best = v
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/** How well one search word matches one word of the hotel (0 = no match). */
function wordScore(q: string, w: string) {
  if (w === q) return 3
  if (w.startsWith(q) && q.length >= 2) return 2
  if (q.length >= 4 && w.includes(q)) return 1.5
  const max = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0
  if (max && distance(q, w, max) <= max) return 1
  return 0
}

type Indexed = { hotel: CatalogHotel; name: string[]; extra: string[] }

const cache = new WeakMap<CatalogHotel[], Indexed[]>()
function index(list: CatalogHotel[]) {
  let idx = cache.get(list)
  if (!idx) {
    idx = list.map(hotel => ({
      hotel,
      name: normalize(hotel.name).split(" ").filter(Boolean),
      extra: normalize(`${hotel.description} ${hotel.keywords}`).split(" ").filter(Boolean),
    }))
    cache.set(list, idx)
  }
  return idx
}

export function searchHotels(query: string, list: CatalogHotel[]): HotelSearchResult {
  const words = normalize(query).split(" ").filter(Boolean)
  let city: HotelCity | null = null
  const want: Want = {}
  const terms: string[] = []

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    // "5 star", "4 star", "5star", "five star"
    const starNum = w.match(/^([2-5])(?:star|stars|\*)?$/)?.[1] ?? { two: "2", three: "3", four: "4", five: "5" }[w]
    if (starNum && (w.length > 1 || ["star", "stars", "etoiles", "etoile", "yildiz", "نجوم"].includes(words[i + 1] ?? ""))) {
      want.stars = Number(starNum)
      continue
    }
    if (CITY_WORDS[w]) {
      city = CITY_WORDS[w]
      continue
    }
    if (WANT_WORDS[w]) {
      Object.assign(want, WANT_WORDS[w])
      // "pas cher" / "low cost": the second word is part of the same idea
      continue
    }
    if (IGNORE.has(w) || w === "cost") continue
    terms.push(w)
  }

  const scored: { hotel: CatalogHotel; score: number }[] = []
  for (const item of index(list)) {
    const h = item.hotel
    if (city && h.city !== city) continue
    if (want.budget && !(h.tier === "budget" || h.stars <= 3)) continue
    if (want.stars && h.stars !== want.stars) continue
    if (want.near && (h.shuttle || h.walkMinutes > 7)) continue
    if (want.shuttle && !h.shuttle) continue
    if (want.clock && !/clock tower/.test(normalize(h.keywords))) continue

    // Every name word must match the hotel name (or its area / description).
    let score = 0
    let ok = true
    for (const q of terms) {
      let best = 0
      for (const w of item.name) best = Math.max(best, wordScore(q, w) * 2)
      if (best === 0) for (const w of item.extra) best = Math.max(best, wordScore(q, w))
      if (best === 0) {
        ok = false
        break
      }
      score += best
    }
    if (!ok) continue
    // Closer hotels a little higher when the scores are equal.
    score += Math.max(0, 1 - h.walkMinutes / 60)
    scored.push({ hotel: h, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return { city, hotels: scored.map(s => s.hotel) }
}
