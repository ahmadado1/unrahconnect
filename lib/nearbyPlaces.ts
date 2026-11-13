// Restaurants and malls near the two holy mosques, live from Google Places (through our
// "nearby-places" server function, which keeps the Google key secret).
import { supabaseUrl } from "./supabase"

const FN_URL = `${supabaseUrl}/functions/v1/nearby-places`

export type NearbyKind = "restaurants" | "malls"
export type NearbyCity = "makkah" | "madinah"

export type NearbyPlace = {
  id: string
  name: string
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
  photo: { name: string; author: string; authorUrl: string } | null
}

// Kept in memory while the app is open, so switching Makkah/Madinah is instant
const memory = new Map<string, { at: number; places: NearbyPlace[] }>()
const KEEP_MS = 30 * 60 * 1000

export async function getNearbyPlaces(city: NearbyCity, kind: NearbyKind, lang: string): Promise<NearbyPlace[]> {
  const key = `${city}:${kind}:${lang}`
  const hit = memory.get(key)
  if (hit && Date.now() - hit.at < KEEP_MS) return hit.places
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${FN_URL}?city=${city}&kind=${kind}&lang=${encodeURIComponent(lang)}`, { signal: controller.signal })
    const data = await res.json().catch(() => null)
    if (!res.ok || !Array.isArray(data?.places)) throw new Error(data?.error || "Could not load places")
    memory.set(key, { at: Date.now(), places: data.places })
    return data.places
  } finally {
    clearTimeout(timer)
  }
}

/** Image address for a place photo (the server redirects to Google's image). */
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
