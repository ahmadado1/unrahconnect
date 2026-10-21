// Supabase Edge Function: hotel prices from KAYAK (KAYAK Affiliate Network, Hotels Search API).
// The KAYAK key must never be inside the app, so the app asks this function.
//
// Secrets (Supabase Dashboard > Edge Functions > Secrets, or `npx supabase@latest secrets set ...`):
//   KAYAK_API_KEY    the key from KAYAK (sandbox keys expire after 3 months)
//   KAYAK_BASE_URL   optional. Default is the sandbox: https://sandbox-en-us.kayakaffiliates.com
//                    When KAYAK approves production, set it to the base URL they give you.
//
// Body: { city: "Makkah"|"Madinah", hotelName?: string, checkin: "YYYY-MM-DD", checkout: "YYYY-MM-DD",
//         guests: number, trackId: string (UUID, one per app session), currency?: string }
// Reply: { hotels: [{ name, stars, guestRating, reviews, image, lowestRate, rates: [{ provider, logo,
//          room, total, freeCancel, payLater, url }] }], currency }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Near the Kaaba and the Prophet's Mosque.
const CENTERS: Record<string, string> = {
  Makkah: "klatlon:21.4225,39.8262",
  Madinah: "klatlon:24.4672,39.6111",
  // Only for testing the sandbox, which has US hotels only.
  TestUS: "klatlon:40.7580,-73.9855",
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
}

// deno-lint-ignore no-explicit-any
type Any = any

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST") return reply({ error: "method" }, 405)

  const key = Deno.env.get("KAYAK_API_KEY")
  if (!key) return reply({ error: "not_configured" }, 503)
  const base = (Deno.env.get("KAYAK_BASE_URL") || "https://sandbox-en-us.kayakaffiliates.com").replace(/\/$/, "")

  let body: Any
  try {
    body = await req.json()
  } catch {
    return reply({ error: "bad_json" }, 400)
  }
  const destination = CENTERS[String(body?.city)]
  const checkin = String(body?.checkin ?? "")
  const checkout = String(body?.checkout ?? "")
  const trackId = String(body?.trackId ?? "")
  const guests = Math.min(8, Math.max(1, Math.round(Number(body?.guests) || 2)))
  const currency = /^[A-Z]{3}$/.test(String(body?.currency)) ? String(body.currency) : "USD"
  const hotelName = String(body?.hotelName ?? "").slice(0, 80).trim()
  if (!destination || !DATE.test(checkin) || !DATE.test(checkout) || checkout <= checkin || !UUID.test(trackId)) {
    return reply({ error: "bad_input" }, 400)
  }

  // One room for up to 2 people, otherwise several rooms of 2 (e.g. 5 guests → "2|2|1").
  const rooms: number[] = []
  for (let left = guests; left > 0; left -= 2) rooms.push(Math.min(2, left))

  const params = new URLSearchParams({
    apiKey: key,
    userTrackId: trackId,
    destination,
    checkin,
    checkout,
    rooms: rooms.join("|"),
    currencyCode: currency,
    languageCode: "en",
    sortField: hotelName ? "popularity" : "distance",
    pageSize: hotelName ? "5" : "20",
    onlyIfComplete: "true",
    searchTimeout: "20",
    includeTaxesInTotal: "true",
    responseOptions: "images,topRates",
  })
  if (hotelName) params.set("hotelName", hotelName)

  // KAYAK needs the real traveller's IP and browser/app identity.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || ""
  const headers: Record<string, string> = {
    "User-Agent": req.headers.get("user-agent") || "UmrahConnect/1.0",
    Accept: "application/json",
  }
  if (ip) headers["x-original-client-ip"] = ip

  let json: Any
  try {
    const res = await fetch(`${base}/api/3.0/hotels?${params}`, { headers })
    if (!res.ok) {
      // KAYAK's own message, with our key removed, so problems can be seen quickly.
      const detail = (await res.text()).slice(0, 400).split(key).join("***")
      console.error("kayak", res.status, detail)
      return reply({ error: res.status === 429 ? "busy" : "kayak_error", status: res.status, detail }, 502)
    }
    json = await res.json()
  } catch (e) {
    console.error("kayak fetch", String(e))
    return reply({ error: "kayak_error", detail: String(e).split(key).join("***") }, 502)
  }

  const providers: Any[] = Array.isArray(json?.providers) ? json.providers : []
  const results: Any[] = Array.isArray(json?.results) ? json.results : Array.isArray(json?.hotels) ? json.hotels : []

  const hotels = results.slice(0, hotelName ? 3 : 20).map(h => {
    const rates: Any[] = Array.isArray(h?.rates) ? h.rates : []
    return {
      name: String(h?.name ?? ""),
      stars: Number(h?.starRating) || 0,
      guestRating: Number(h?.guestRating) || 0,
      reviews: Number(h?.numberOfReviews) || 0,
      image: String(h?.images?.large ?? h?.images?.small ?? h?.images?.[0]?.large ?? ""),
      lowestRate: Number(h?.lowestRate ?? h?.lowestRate?.amount) || null,
      rates: rates
        .filter(r => r?.bookUri)
        .map(r => {
          const p = providers[Number(r?.providerIndex)] ?? {}
          return {
            provider: String(p?.name ?? r?.providerName ?? "KAYAK"),
            logo: String(p?.logo ?? ""),
            room: String(r?.roomName ?? ""),
            total: Number(r?.totalRate ?? r?.totalRate?.amount) || null,
            freeCancel: Boolean(r?.hasFreeCancellation),
            payLater: Boolean(r?.canPayLater),
            url: String(r.bookUri),
          }
        })
        .sort((a, b) => (a.total ?? 1e12) - (b.total ?? 1e12))
        .slice(0, 6),
    }
  })

  return reply({ hotels, currency, sandbox: base.includes("sandbox") })
})
