// Restaurants and malls near the two holy mosques, live from Google Places (through our
// "nearby-places" server function, which keeps the Google key secret).
import { CHAIN_LOGOS } from "./restaurantImages"
import { supabaseUrl } from "./supabase"

const FN_URL = `${supabaseUrl}/functions/v1/nearby-places`

export type NearbyKind = "restaurants" | "malls"
export type NearbyCity = "makkah" | "madinah"

export type NearbyCategory = "fast" | "arabic" | "asian" | "cafe" | "other" | "mall" | "supermarket" | "department"

export type NearbyPlace = {
  id: string
  name: string
  /** Our category (one Google search each) */
  category: NearbyCategory
  /** Google's own label, e.g. "Fast Food Restaurant" (in the app language) */
  typeLabel: string
  rating: number | null
  ratingCount: number
  priceLevel: string | null
  openNow: boolean | null
  address: string
  lat: number
  lng: number
  meters: number
  walkMinutes: number
  mapsUrl: string
  /**
   * google: url is empty, load it with nearbyPhotoUrl(name)
   * wikimedia: url is the image; show author + licence
   */
  photo: { source: "google" | "wikimedia"; name: string; url: string; author: string; authorUrl: string; license: string } | null
}

/** One general photo per category (Pexels), shown as a banner, never as a specific place. */
export type CategoryBanner = { url: string; author: string; authorUrl: string; pageUrl: string; source?: string }

export type NearbyResult = { places: NearbyPlace[]; banners: Partial<Record<string, CategoryBanner>>; missing: string[] }

// Kept in memory while the app is open, so switching Makkah/Madinah is instant
const memory = new Map<string, { at: number; result: NearbyResult }>()
const KEEP_MS = 30 * 60 * 1000

export async function getNearbyPlaces(city: NearbyCity, kind: NearbyKind, lang: string): Promise<NearbyResult> {
  const key = `${city}:${kind}:${lang}`
  const hit = memory.get(key)
  if (hit && Date.now() - hit.at < KEEP_MS) return hit.result
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${FN_URL}?city=${city}&kind=${kind}&lang=${encodeURIComponent(lang)}`, { signal: controller.signal })
    const data = await res.json().catch(() => null)
    if (!res.ok || !Array.isArray(data?.places)) throw new Error(data?.error || "Could not load places")
    const result: NearbyResult = { places: data.places, banners: data.banners ?? {}, missing: data.missing ?? [] }
    memory.set(key, { at: Date.now(), result })
    return result
  } finally {
    clearTimeout(timer)
  }
}

/** Image address for a place photo: Wikimedia gives it directly, Google goes through our server. */
export function placePhotoUrl(photo: NonNullable<NearbyPlace["photo"]>, width = 300) {
  return photo.url || nearbyPhotoUrl(photo.name, width)
}

/** Image address for a Google place photo (the server redirects to Google's image). */
export function nearbyPhotoUrl(photoName: string, width = 600) {
  return `${FN_URL}?photo=${encodeURIComponent(photoName).replace(/%2F/g, "/")}&w=${width}`
}

/** "350 m" / "1.2 km" */
export function formatMeters(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`
}

/** Google price level → $, $$, $$$ */
export function priceSymbols(level: string | null) {
  switch (level) {
    case "PRICE_LEVEL_INEXPENSIVE": return "$"
    case "PRICE_LEVEL_MODERATE": return "$$"
    case "PRICE_LEVEL_EXPENSIVE": return "$$$"
    case "PRICE_LEVEL_VERY_EXPENSIVE": return "$$$$"
    default: return ""
  }
}

/** Brand logo for well-known chains (used when Google has no photo). */
const CHAIN_MATCH: [RegExp, keyof typeof CHAIN_LOGOS][] = [
  [/al\s*baik|البيك/i, "alBaik"], [/\bkfc\b|كنتاكي/i, "kfc"], [/mc\s*donald|ماكدونالدز/i, "mcdonalds"],
  [/burger\s*king|برجر كنج/i, "burgerKing"], [/pizza\s*hut|بيتزا هت/i, "pizzaHut"], [/subway|صب واي/i, "subway"],
  [/starbucks|ستاربكس/i, "starbucks"], [/popeyes|بوبايز/i, "popeyes"], [/shake\s*shack/i, "shakeShack"],
  [/domino|دومينوز/i, "dominos"], [/tim\s*horton/i, "timHortons"], [/hardee|هارديز/i, "hardees"],
  [/nando/i, "nandos"], [/kudu|كودو/i, "kudu"], [/herfy|هرفي/i, "herfy"], [/tazaj|الطازج/i, "alTazaj"],
  [/romansiah|الرومانسية/i, "romansiah"], [/bateel|بتيل/i, "bateel"],
]

export function chainLogo(name: string): string | null {
  for (const [re, key] of CHAIN_MATCH) if (re.test(name)) return CHAIN_LOGOS[key]
  return null
}
