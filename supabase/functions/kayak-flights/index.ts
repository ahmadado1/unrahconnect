// Supabase Edge Function: flight prices from KAYAK (KAYAK Affiliate Network, Flights Search API).
// The KAYAK key must never be inside the app, so the app asks this function.
//
// How KAYAK flights work: we start a search, then keep asking ("polling") until KAYAK says
// "complete". This function does the polling itself (up to about 25 seconds) and gives the app
// a short, clean list.
//
// Secrets: KAYAK_API_KEY (same key as hotels), optional KAYAK_BASE_URL (default: sandbox).
//
// Body: { origin: "LHR", destination: "JED"|"MED", departDate: "YYYY-MM-DD",
//         returnDate?: "YYYY-MM-DD", returnFrom?: "JED"|"MED", adults: number,
//         trackId: UUID (one per app session), currency?: "USD" }
//   returnFrom lets pilgrims fly into Jeddah and home from Madinah (or the other way).
// Reply: { flights: [{ id, price, displayPrice, provider, providerLogo, url, direct, freeCancel,
//          legs: [{ from, to, departure, arrival, minutes, stops, airlines: [{code,name,logo}] }] }],
//          currency, complete, sandbox }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IATA = /^[A-Z]{3}$/

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

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
  const origin = String(body?.origin ?? "").toUpperCase()
  const destination = String(body?.destination ?? "").toUpperCase()
  const returnFrom = String(body?.returnFrom ?? destination).toUpperCase()
  const departDate = String(body?.departDate ?? "")
  const returnDate = body?.returnDate ? String(body.returnDate) : ""
  const trackId = String(body?.trackId ?? "")
  const adults = Math.min(8, Math.max(1, Math.round(Number(body?.adults) || 1)))
  const currency = /^[A-Z]{3}$/.test(String(body?.currency)) ? String(body.currency) : "USD"
  if (
    !IATA.test(origin) || !IATA.test(destination) || !IATA.test(returnFrom) ||
    !DATE.test(departDate) || (returnDate && (!DATE.test(returnDate) || returnDate < departDate)) ||
    !UUID.test(trackId)
  ) {
    return reply({ error: "bad_input" }, 400)
  }

  const airports = (code: string) => ({ locationType: "airports", airports: [code] })
  const legs: Any[] = [{ origin: airports(origin), destination: airports(destination), date: departDate, flex: "exact" }]
  if (returnDate) legs.push({ origin: airports(returnFrom), destination: airports(origin), date: returnDate, flex: "exact" })

  const resultParameters = {
    currency,
    priceMode: "total",
    pageNumber: 1,
    pageSize: 20,
    sort: { key: "price", direction: "asc" },
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || ""
  const headers: Record<string, string> = {
    "User-Agent": req.headers.get("user-agent") || "UmrahConnect/1.0",
    Accept: "application/json",
    "Content-Type": "application/json",
  }
  if (ip) headers["x-original-client-ip"] = ip

  const hide = (s: string) => s.split(key).join("***")

  async function poll(payload: unknown, cluster?: string): Promise<{ ok: true; json: Any } | { ok: false; status: number; detail: string }> {
    const q = new URLSearchParams({ apiKey: key!, userTrackId: trackId })
    if (cluster) q.set("cluster", cluster)
    try {
      const res = await fetch(`${base}/i/api/affiliate/search/flight/v1/poll?${q}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) return { ok: false, status: res.status, detail: hide((await res.text()).slice(0, 400)) }
      return { ok: true, json: await res.json() }
    } catch (e) {
      return { ok: false, status: 0, detail: hide(String(e)) }
    }
  }

  // 1) Start the search.
  let r = await poll({
    searchStartParameters: { cabin: "economy", passengers: Array(adults).fill("ADT"), legs },
    resultParameters,
  })
  if (!r.ok) {
    console.error("kayak flights start", r.status, r.detail)
    return reply({ error: r.status === 429 ? "busy" : "kayak_error", status: r.status, detail: r.detail }, 502)
  }
  let json = r.json
  const searchId = String(json?.searchId ?? "")
  const cluster = String(json?.cluster ?? "")

  // 2) Keep asking until KAYAK has all the prices (or about 25 seconds pass).
  const until = Date.now() + 25_000
  while (json?.status !== "complete" && searchId && Date.now() < until) {
    await sleep(1500)
    r = await poll({ searchId, resultParameters }, cluster)
    if (!r.ok) break
    json = r.json
  }

  const legMap: Any = json?.legs ?? {}
  const segMap: Any = json?.segments ?? {}
  const airlines: Any = json?.airlines ?? {}
  const providers: Any = json?.providers ?? {}
  const results: Any[] = Array.isArray(json?.results) ? json.results : []

  const flights = results
    .map(res => {
      const option: Any = (res?.bookingOptions ?? []).find((o: Any) => o?.type === "regular" && o?.bookingUrl)
      if (!option) return null
      const provider = providers[option.providerCode] ?? {}
      const badges: string[] = (option.badges ?? []).map((b: Any) => String(b?.code))
      const legsOut = (res?.legs ?? []).map((l: Any) => {
        const leg = legMap[l?.id] ?? {}
        const segs: Any[] = (leg.segments ?? []).map((s: Any) => segMap[s?.id]).filter(Boolean)
        const codes = [...new Set(segs.map(s => String(s.airline)))]
        return {
          from: String(segs[0]?.origin ?? ""),
          to: String(segs[segs.length - 1]?.destination ?? ""),
          departure: String(leg.departureTime ?? ""),
          arrival: String(leg.arrivalTime ?? ""),
          minutes: Number(leg.duration) || 0,
          stops: Math.max(0, segs.length - 1),
          airlines: codes.map(c => ({ code: c, name: String(airlines[c]?.displayName ?? c), logo: String(airlines[c]?.logoUrl ?? "") })),
        }
      })
      return {
        id: String(res.id),
        price: Number(option?.fees?.totalPrice?.price ?? option?.displayPrice?.price) || null,
        displayPrice: String(option?.fees?.totalPrice?.displayPrice ?? option?.displayPrice?.displayPrice ?? ""),
        provider: String(provider?.displayName ?? option.providerCode ?? ""),
        providerLogo: String(provider?.logoUrls?.horizontalImageUrl ?? provider?.logoUrls?.imageUrl ?? ""),
        url: String(option.bookingUrl),
        // Counted from the flights themselves (the "direct" badge can mean "book direct").
        direct: legsOut.length > 0 && legsOut.every((l: Any) => l.stops === 0),
        freeCancel: badges.includes("freeCancellation"),
        legs: legsOut,
      }
    })
    .filter(Boolean)

  return reply({
    flights,
    currency: String(json?.currency ?? currency),
    complete: json?.status === "complete",
    sandbox: base.includes("sandbox"),
  })
})
