// Supabase Edge Function: restaurants and malls near Masjid al-Haram (Makkah) and Masjid an-Nabawi (Madinah),
// with real photos, ratings, "open now" and walking distance, from the official Google Places API (New).
// The Google key never goes in the app: the app asks this function.
//
// Secret (Supabase → Edge Functions → Secrets):
//   GOOGLE_PLACES_API_KEY   a Google Cloud key restricted to "Places API (New)"
//
// GET ?city=makkah|madinah&kind=restaurants|malls&lang=en
//   → { places: [{ id, name, rating, ratingCount, priceLevel, openNow, address, lat, lng, meters, walkMinutes,
//                  mapsUrl, photo: { name, author, authorUrl } | null }], attribution }
// GET ?photo=places/…/photos/…&w=600
//   → redirects to the photo (Google's short-lived image link)
//
// Costs are kept low: each list is kept for 6 hours per server and only the first photo of each place is used.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const KEY = (Deno.env.get("GOOGLE_PLACES_API_KEY") || "").trim()

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// The two holy mosques (distance is measured from here)
const CENTERS = {
  makkah: { lat: 21.4225, lng: 39.8262 },
  madinah: { lat: 24.4672, lng: 39.6112 },
} as const

// What to search for, and how far from the mosque (metres)
const KINDS = {
  restaurants: { types: ["restaurant", "fast_food_restaurant", "cafe"], radius: 1500 },
  malls: { types: ["shopping_mall", "department_store"], radius: 3000 },
} as const

const LANGS = new Set(["en", "ar", "fr", "tr", "ur", "bn"])
const CACHE_MS = 6 * 60 * 60 * 1000
const cache = new Map<string, { at: number; body: unknown }>()

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } })
}

/** Straight-line distance in metres. */
function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

type GPlace = {
  id: string
  displayName?: { text?: string }
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: { latitude: number; longitude: number }
  googleMapsUri?: string
  currentOpeningHours?: { openNow?: boolean }
  businessStatus?: string
  photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[]
}

async function searchNearby(city: keyof typeof CENTERS, kind: keyof typeof KINDS, lang: string, debug = false) {
  const center = CENTERS[city]
  const { types, radius } = KINDS[kind]
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": [
        "places.id", "places.displayName", "places.rating", "places.userRatingCount", "places.priceLevel",
        "places.formattedAddress", "places.shortFormattedAddress", "places.location", "places.googleMapsUri",
        "places.currentOpeningHours.openNow", "places.businessStatus", "places.photos",
      ].join(","),
    },
    body: JSON.stringify({
      includedPrimaryTypes: types,
      excludedPrimaryTypes: ["lodging", "hotel", "resort_hotel"],
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      languageCode: lang,
      regionCode: "SA",
      locationRestriction: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius } },
    }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error?.message || `Google Places error ${res.status}`)
  // ?debug=1: show what Google sent for the first two places (to check photos)
  if (debug) return { debug: true, sample: (data?.places ?? []).slice(0, 2), count: (data?.places ?? []).length }

  const seenPhotos = new Set<string>()
  const places = ((data?.places ?? []) as GPlace[])
    .filter((p) => p.location && p.displayName?.text && p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) => {
      const loc = { lat: p.location!.latitude, lng: p.location!.longitude }
      const m = metres(center, loc)
      // One photo per place, never the same photo twice
      const photo = (p.photos ?? []).find((ph) => ph.name && !seenPhotos.has(ph.name))
      if (photo) seenPhotos.add(photo.name)
      const author = photo?.authorAttributions?.[0]
      return {
        id: p.id,
        name: p.displayName!.text!,
        rating: p.rating ?? null,
        ratingCount: p.userRatingCount ?? 0,
        priceLevel: p.priceLevel ?? null,
        openNow: p.currentOpeningHours?.openNow ?? null,
        address: p.shortFormattedAddress || p.formattedAddress || "",
        lat: loc.lat,
        lng: loc.lng,
        meters: m,
        // Walking is longer than a straight line: ~1.3× the distance at ~75 m per minute
        walkMinutes: Math.max(1, Math.round((m * 1.3) / 75)),
        mapsUrl: p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`,
        photo: photo ? { name: photo.name, author: author?.displayName || "", authorUrl: author?.uri || "" } : null,
      }
    })
    // Closest to the mosque first
    .sort((a, b) => a.meters - b.meters)

  return { places, attribution: "Google" }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors })
  if (!KEY) return json({ error: "GOOGLE_PLACES_API_KEY is not set" }, 500)

  const url = new URL(req.url)

  // ─── Photo: send the app to Google's image link ───
  const photo = url.searchParams.get("photo")
  if (photo) {
    if (!/^places\/[\w-]+\/photos\/[\w-]+$/.test(photo)) return json({ error: "Bad photo" }, 400)
    const w = Math.min(1200, Math.max(200, Number(url.searchParams.get("w")) || 600))
    const res = await fetch(`https://places.googleapis.com/v1/${photo}/media?maxWidthPx=${w}&skipHttpRedirect=true&key=${KEY}`)
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.photoUri) return json({ error: "Photo not available" }, 404)
    return new Response(null, { status: 302, headers: { ...cors, Location: data.photoUri, "Cache-Control": "public, max-age=3600" } })
  }

  // ─── List ───
  const city = (url.searchParams.get("city") || "makkah").toLowerCase() as keyof typeof CENTERS
  const kind = (url.searchParams.get("kind") || "restaurants").toLowerCase() as keyof typeof KINDS
  const langRaw = (url.searchParams.get("lang") || "en").slice(0, 2).toLowerCase()
  const lang = LANGS.has(langRaw) ? langRaw : "en"
  if (!CENTERS[city] || !KINDS[kind]) return json({ error: "Unknown city or kind" }, 400)

  // ?details=<place id>: ask Google for that one place's photos (check whether photos exist at all)
  const details = url.searchParams.get("details")
  if (details) {
    if (!/^[\w-]+$/.test(details)) return json({ error: "Bad id" }, 400)
    const res = await fetch(`https://places.googleapis.com/v1/places/${details}`, {
      headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "id,displayName,photos" },
    })
    return json(await res.json().catch(() => ({ error: res.status })), res.ok ? 200 : 502)
  }

  if (url.searchParams.get("debug") === "1") {
    try {
      return json(await searchNearby(city, kind, lang, true))
    } catch (e) {
      return json({ error: String(e) }, 502)
    }
  }

  const cacheKey = `${city}:${kind}:${lang}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_MS) return json(hit.body, 200, { "Cache-Control": "public, max-age=1800" })

  try {
    const body = await searchNearby(city, kind, lang)
    cache.set(cacheKey, { at: Date.now(), body })
    return json(body, 200, { "Cache-Control": "public, max-age=1800" })
  } catch (e) {
    console.error("nearby-places", String(e))
    if (hit) return json(hit.body) // Google failed: give the last list we had
    return json({ error: String(e) }, 502)
  }
})
