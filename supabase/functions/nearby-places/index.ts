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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const KEY = (Deno.env.get("GOOGLE_PLACES_API_KEY") || "").trim()
// Optional: free key from pexels.com/api, for one banner photo per category
const PEXELS_KEY = (Deno.env.get("PEXELS_API_KEY") || "").trim()
const UA = "UmrahConnect/1.0 (https://myumrahconnect.com; info@myumrahconnect.com)"
// Optional: Tripadvisor Content API key (free plan: 1,000 requests a month)
const TA_KEY = (Deno.env.get("TRIPADVISOR_API_KEY") || "").trim()
const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: { persistSession: false },
})

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// The two holy mosques (distance is measured from here)
const CENTERS = {
  makkah: { lat: 21.4225, lng: 39.8262 },
  madinah: { lat: 24.4672, lng: 39.6112 },
} as const

// What to search for, in categories, and how far from the mosque (metres).
// Each category is its own Google search (up to 20 places each), so every category has enough places.
const KINDS = {
  restaurants: {
    radius: 1500,
    groups: [
      { category: "fast", types: ["fast_food_restaurant", "hamburger_restaurant", "pizza_restaurant", "sandwich_shop"] },
      { category: "arabic", types: ["middle_eastern_restaurant", "lebanese_restaurant", "turkish_restaurant"] },
      { category: "asian", types: ["indian_restaurant", "chinese_restaurant", "asian_restaurant"] },
      { category: "cafe", types: ["cafe", "coffee_shop", "bakery", "ice_cream_shop"] },
      { category: "other", types: ["restaurant", "seafood_restaurant"] },
    ],
  },
  malls: {
    radius: 3000,
    groups: [
      { category: "mall", types: ["shopping_mall"] },
      { category: "supermarket", types: ["supermarket", "grocery_store"] },
      { category: "department", types: ["department_store"] },
    ],
  },
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
  primaryTypeDisplayName?: { text?: string }
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: { latitude: number; longitude: number }
  googleMapsUri?: string
  currentOpeningHours?: { openNow?: boolean }
  businessStatus?: string
  photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[]
}

const FIELD_MASK = [
  "places.id", "places.displayName", "places.rating", "places.userRatingCount", "places.priceLevel",
  "places.formattedAddress", "places.shortFormattedAddress", "places.location", "places.googleMapsUri",
  "places.currentOpeningHours.openNow", "places.businessStatus", "places.photos", "places.primaryTypeDisplayName",
].join(",")

/** One Google search for one category. */
async function searchGroup(center: { lat: number; lng: number }, radius: number, types: readonly string[], lang: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELD_MASK },
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
  return (data?.places ?? []) as GPlace[]
}

async function searchNearby(city: keyof typeof CENTERS, kind: keyof typeof KINDS, lang: string, debug = false) {
  const center = CENTERS[city]
  const { radius, groups } = KINDS[kind]

  // All categories at once; a category that fails is skipped, the others still show
  const results = await Promise.allSettled(groups.map((g) => searchGroup(center, radius, g.types, lang)))
  if (debug) {
    return {
      debug: true,
      groups: results.map((r, i) => ({
        category: groups[i].category,
        ok: r.status === "fulfilled",
        count: r.status === "fulfilled" ? r.value.length : 0,
        error: r.status === "rejected" ? String(r.reason) : undefined,
        sample: r.status === "fulfilled" ? r.value.slice(0, 1) : undefined,
      })),
    }
  }
  if (results.every((r) => r.status === "rejected")) {
    throw new Error(String((results[0] as PromiseRejectedResult).reason))
  }

  const seenIds = new Set<string>()
  const seenPhotos = new Set<string>()
  const places: Array<{ meters: number } & Record<string, unknown>> = []
  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return
    for (const p of r.value) {
      if (!p.location || !p.displayName?.text || p.businessStatus === "CLOSED_PERMANENTLY" || seenIds.has(p.id)) continue
      // Leave out tiny or unknown shops (few reviews)
      if ((p.userRatingCount ?? 0) < (kind === "malls" ? 50 : 30)) continue
      seenIds.add(p.id)
      const loc = { lat: p.location.latitude, lng: p.location.longitude }
      const m = metres(center, loc)
      // One photo per place, never the same photo twice
      const photo = (p.photos ?? []).find((ph) => ph.name && !seenPhotos.has(ph.name))
      if (photo) seenPhotos.add(photo.name)
      const author = photo?.authorAttributions?.[0]
      places.push({
        id: p.id,
        name: p.displayName.text,
        category: groups[i].category,
        typeLabel: p.primaryTypeDisplayName?.text || "",
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
        photo: photo
          ? { source: "google", name: photo.name, url: "", author: author?.displayName || "", authorUrl: author?.uri || "", license: "" }
          : null,
      })
    }
  })
  // Closest to the mosque first
  places.sort((a, b) => a.meters - b.meters)
  // Places Google has no photo for: try a real photo of that place on Wikimedia Commons (free)
  await addWikimediaPhotos(center, places as unknown as OutPlace[])
  // Still no photo: Tripadvisor (saved for 30 days, a few new places per visit)
  await addTripadvisorPhotos(places as unknown as OutPlace[], kind)
  const banners = await categoryBanners(kind)
  const missing = (places as unknown as OutPlace[]).filter((p) => !p.photo).map((p) => p.name)
  return { places, categories: groups.map((g) => g.category), banners, missing, attribution: "Google" }
}

type OutPhoto = { source: string; name: string; url: string; author: string; authorUrl: string; license: string }
type OutPlace = { id: string; name: string; lat: number; lng: number; photo: OutPhoto | null }

// ─── Tripadvisor: real photos of restaurants and malls (free plan, so used carefully) ───
// Each place is looked up once and the answer is saved for 30 days in public.place_photos
// (also when nothing was found), and at most 12 new look-ups happen per list, so a month
// stays well under the 1,000 free requests (1 search + 1 photo request per place).
const TA_BASE = "https://api.content.tripadvisor.com/api/v1"
const TA_KEEP_DAYS = 30
const TA_MAX_NEW = 12

async function taGet(path: string) {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`${TA_BASE}${path}${sep}key=${TA_KEY}`, {
    headers: { accept: "application/json", Referer: "https://myumrahconnect.com", "User-Agent": UA },
  })
  if (!res.ok) throw new Error(`Tripadvisor ${res.status}`)
  return res.json()
}

/** Find the place on Tripadvisor (name near the same spot) and take its first photo. */
async function tripadvisorPhoto(place: OutPlace, kind: keyof typeof KINDS): Promise<OutPhoto | null> {
  const category = kind === "restaurants" ? "restaurants" : "attractions"
  const search = await taGet(
    `/location/search?searchQuery=${encodeURIComponent(place.name)}&latLong=${place.lat},${place.lng}&category=${category}&language=en`,
  )
  const nameWords = words(place.name)
  const match = (search?.data ?? []).find((loc: { name?: string }) => {
    const w = words(String(loc.name || ""))
    return nameWords.some((a) => w.some((b) => a.includes(b) || b.includes(a)))
  })
  if (!match?.location_id) return null
  const photos = await taGet(`/location/${match.location_id}/photos?language=en&limit=1`)
  const ph = photos?.data?.[0]
  const url = ph?.images?.large?.url || ph?.images?.medium?.url || ph?.images?.original?.url
  if (!url) return null
  return {
    source: "tripadvisor",
    name: String(match.location_id),
    url,
    author: ph?.user?.username || "Tripadvisor",
    authorUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(place.name)}`,
    license: "Tripadvisor",
  }
}

async function addTripadvisorPhotos(places: OutPlace[], kind: keyof typeof KINDS) {
  if (!TA_KEY) return
  const need = places.filter((p) => !p.photo)
  if (!need.length) return
  // What we already know (found or not found) from earlier look-ups
  const { data: saved } = await db.from("place_photos").select("*").in("google_place_id", need.map((p) => p.id))
  const known = new Map((saved ?? []).map((r: { google_place_id: string }) => [r.google_place_id, r]))
  const fresh = Date.now() - TA_KEEP_DAYS * 86_400_000
  let newLookups = 0
  for (const place of need) {
    const row = known.get(place.id) as { source: string; url: string; author: string; link: string; checked_at: string } | undefined
    if (row && new Date(row.checked_at).getTime() > fresh) {
      if (row.source === "tripadvisor" && row.url) {
        place.photo = { source: "tripadvisor", name: place.id, url: row.url, author: row.author || "Tripadvisor", authorUrl: row.link || "", license: "Tripadvisor" }
      }
      continue
    }
    if (newLookups >= TA_MAX_NEW) continue // the rest next time
    newLookups++
    try {
      const photo = await tripadvisorPhoto(place, kind)
      if (photo) place.photo = photo
      await db.from("place_photos").upsert({
        google_place_id: place.id,
        source: photo ? "tripadvisor" : "none",
        url: photo?.url ?? null,
        author: photo?.author ?? null,
        link: photo?.authorUrl ?? null,
        checked_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("tripadvisor", place.name, String(e))
      if (String(e).includes("429")) break // monthly or per-second limit: stop for now
    }
  }
}

// ─── Wikimedia Commons: free photos with a location (credit + licence must be shown) ───
// One search per city: all photos taken within 10 km of the mosque. A photo is used for a place only if
// it was taken within 250 m of it AND its file name contains a word from the place's name, so we never
// show a photo of the wrong place.
const GENERIC = new Set([
  "restaurant", "restaurants", "mall", "malls", "makkah", "mecca", "makka", "madinah", "medina", "madina", "cafe", "coffee",
  "hotel", "tower", "towers", "center", "centre", "the", "and", "food", "court", "shop", "store", "market", "branch",
  "مطعم", "مكة", "المدينة", "مول", "مركز", "كافيه", "مقهى", "فرع",
  // Landmark words that appear in many photo names of the mosque area (not the shop itself)
  "king", "haram", "abraj", "bait", "jabal", "omar", "zamzam", "clock", "gate", "masjid", "mosque", "nabawi",
  "souk", "foods", "panoramio", "hypermarket", "supermarket", "plaza", "royal", "diamond", "umrah", "hajj",
  "الحرم", "حرم", "ابراج", "أبراج", "البيت", "جبل", "عمر", "زمزم", "الساعة", "سوق", "المسجد", "الشريف", "المكي", "النبوي",
])

function words(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^file:/, "")
    .replace(/\.(jpe?g|png|webp|tiff?)$/i, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4 && !GENERIC.has(w))
}

const commonsCache = new Map<string, { at: number; files: { title: string; lat: number; lng: number }[] }>()

async function commonsFilesNear(center: { lat: number; lng: number }) {
  const key = `${center.lat},${center.lng}`
  const hit = commonsCache.get(key)
  if (hit && Date.now() - hit.at < 24 * 3600 * 1000) return hit.files
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=geosearch&gsnamespace=6&gslimit=500&gsradius=10000&gscoord=${center.lat}%7C${center.lng}`
  const res = await fetch(url, { headers: { "User-Agent": UA } })
  const data = await res.json().catch(() => null)
  const files = ((data?.query?.geosearch ?? []) as { title: string; lat: number; lon: number }[]).map((f) => ({ title: f.title, lat: f.lat, lng: f.lon }))
  commonsCache.set(key, { at: Date.now(), files })
  return files
}

function stripHtml(text: string) {
  return String(text || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

async function addWikimediaPhotos(center: { lat: number; lng: number }, places: OutPlace[]) {
  const need = places.filter((p) => !p.photo)
  if (!need.length) return
  let files: { title: string; lat: number; lng: number }[] = []
  try {
    files = await commonsFilesNear(center)
  } catch {
    return
  }
  const used = new Set<string>()
  const chosen = new Map<OutPlace, string>()
  for (const place of need) {
    const nameWords = words(place.name)
    if (!nameWords.length) continue
    let best: { title: string; d: number } | null = null
    for (const f of files) {
      if (used.has(f.title)) continue
      const d = metres(place, f)
      if (d > 250) continue
      const fileWords = words(f.title)
      if (!nameWords.some((w) => fileWords.includes(w))) continue
      if (!best || d < best.d) best = { title: f.title, d }
    }
    if (best) {
      used.add(best.title) // never the same photo twice
      chosen.set(place, best.title)
    }
  }
  if (!chosen.size) return

  // Image address, author and licence for the chosen files (50 per request)
  const titles = [...new Set(chosen.values())]
  const info = new Map<string, OutPhoto>()
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50)
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=500&iiextmetadatafilter=Artist%7CLicenseShortName&titles=${encodeURIComponent(batch.join("|"))}`
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } })
      const data = await res.json()
      for (const page of Object.values(data?.query?.pages ?? {}) as { title: string; imageinfo?: { thumburl?: string; url?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] }[]) {
        const ii = page.imageinfo?.[0]
        if (!ii) continue
        info.set(page.title, {
          source: "wikimedia",
          name: page.title,
          url: ii.thumburl || ii.url || "",
          author: stripHtml(ii.extmetadata?.Artist?.value || "") || "Wikimedia Commons",
          authorUrl: ii.descriptionurl || "",
          license: stripHtml(ii.extmetadata?.LicenseShortName?.value || ""),
        })
      }
    } catch {
      // skip this batch
    }
  }
  for (const [place, title] of chosen) {
    const photo = info.get(title)
    if (photo?.url) place.photo = photo
  }
}

// ─── Pexels: one banner photo per category (general photo, not of a specific place) ───
const BANNER_QUERIES: Record<string, string> = {
  fast: "fried chicken burger fast food",
  arabic: "arabic food mandi kabsa",
  asian: "indian curry biryani",
  cafe: "arabic coffee dates",
  other: "restaurant dinner table",
  mall: "shopping mall interior",
  supermarket: "supermarket aisle",
  department: "clothing store",
}
let bannerCache: { at: number; data: Record<string, unknown> } | null = null

// Without a Pexels key: the banner comes from Wikimedia Commons instead (free, no key)
const COMMONS_BANNER_QUERIES: Record<string, string> = {
  fast: "broasted chicken meal",
  arabic: "Kabsa",
  asian: "Biryani",
  cafe: "Arabic coffee dallah dates",
  other: "Saudi cuisine",
  mall: "Abraj Al Bait shopping mall",
  supermarket: "supermarket interior Saudi Arabia",
  department: "shopping mall interior clothes store",
}
let commonsBannerCache: { at: number; data: Record<string, unknown> } | null = null

async function commonsBanners() {
  if (commonsBannerCache && Date.now() - commonsBannerCache.at < 24 * 3600 * 1000) return commonsBannerCache.data
  const data: Record<string, unknown> = {}
  await Promise.all(
    Object.entries(COMMONS_BANNER_QUERIES).map(async ([category, query]) => {
      try {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(`${query} filetype:bitmap`)}&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=900&iiextmetadatafilter=Artist%7CLicenseShortName`
        const res = await fetch(url, { headers: { "User-Agent": UA } })
        const json = await res.json()
        const pages = Object.values(json?.query?.pages ?? {}) as { index?: number; title: string; imageinfo?: { thumburl?: string; width?: number; height?: number; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] }[]
        // Best search match that is a wide, big enough photo
        const pick = pages
          .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
          .find((pg) => {
            const ii = pg.imageinfo?.[0]
            return ii?.thumburl && (ii.width ?? 0) >= 600
          })
        const ii = pick?.imageinfo?.[0]
        if (ii?.thumburl) {
          const license = stripHtml(ii.extmetadata?.LicenseShortName?.value || "")
          data[category] = {
            url: ii.thumburl,
            author: `${stripHtml(ii.extmetadata?.Artist?.value || "") || "Wikimedia Commons"}${license ? ` (${license})` : ""}`,
            authorUrl: ii.descriptionurl || "",
            pageUrl: ii.descriptionurl || "https://commons.wikimedia.org",
            source: "Wikimedia Commons",
          }
        }
      } catch {
        // no banner for this category
      }
    }),
  )
  commonsBannerCache = { at: Date.now(), data }
  return data
}

async function categoryBanners(kind: keyof typeof KINDS) {
  const wantedCats = new Set<string>(KINDS[kind].groups.map((g) => g.category))
  if (!PEXELS_KEY) {
    const data = await commonsBanners()
    return Object.fromEntries(Object.entries(data).filter(([k]) => wantedCats.has(k)))
  }
  if (!bannerCache || Date.now() - bannerCache.at > 24 * 3600 * 1000) {
    const data: Record<string, unknown> = {}
    await Promise.all(
      Object.entries(BANNER_QUERIES).map(async ([category, query]) => {
        try {
          const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY },
          })
          const json = await res.json()
          const photo = json?.photos?.[0]
          if (photo?.src) {
            data[category] = {
              url: photo.src.landscape || photo.src.large || photo.src.medium,
              author: photo.photographer || "",
              authorUrl: photo.photographer_url || "",
              pageUrl: photo.url || "https://www.pexels.com",
              source: "Pexels",
            }
          }
        } catch {
          // no banner for this category
        }
      }),
    )
    bannerCache = { at: Date.now(), data }
  }
  const wanted = new Set<string>(KINDS[kind].groups.map((g) => g.category))
  return Object.fromEntries(Object.entries(bannerCache.data).filter(([k]) => wanted.has(k)))
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

  // ?tatest=<place name>: show exactly what Tripadvisor answers (search + first photo)
  const tatest = url.searchParams.get("tatest")
  if (tatest) {
    if (!TA_KEY) return json({ error: "TRIPADVISOR_API_KEY is not set" })
    const c = CENTERS[city] ?? CENTERS.makkah
    // Only the length and last 4 characters, to check the saved key is the right one (never the whole key)
    const out: Record<string, unknown> = { keyLength: TA_KEY.length, keyEndsWith: TA_KEY.slice(-4), keyHasQuotes: /["']/.test(TA_KEY) }
    try {
      const q = `/location/search?searchQuery=${encodeURIComponent(tatest)}&latLong=${c.lat},${c.lng}&language=en`
      const res = await fetch(`${TA_BASE}${q}&key=${TA_KEY}`, {
        headers: { accept: "application/json", Referer: "https://myumrahconnect.com", "User-Agent": UA },
      })
      out.searchStatus = res.status
      out.search = await res.json().catch(async () => await res.text().catch(() => ""))
      const first = (out.search as { data?: { location_id?: string }[] })?.data?.[0]
      if (first?.location_id) {
        const r2 = await fetch(`${TA_BASE}/location/${first.location_id}/photos?language=en&limit=1&key=${TA_KEY}`, {
          headers: { accept: "application/json", Referer: "https://myumrahconnect.com", "User-Agent": UA },
        })
        out.photosStatus = r2.status
        out.photos = await r2.json().catch(() => null)
      }
    } catch (e) {
      out.error = String(e)
    }
    const { count } = await db.from("place_photos").select("*", { count: "exact", head: true })
    out.savedRows = count
    return json(out)
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
