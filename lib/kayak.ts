// Hotel prices from KAYAK, through our Supabase function "kayak-hotels" (the KAYAK key stays on the server).
import { supabase } from "@/lib/supabase"
import type { TripDetails } from "@/lib/tripDetails"

export type KayakRate = {
  provider: string
  logo: string
  room: string
  total: number | null
  freeCancel: boolean
  payLater: boolean
  url: string
}

export type KayakHotel = {
  name: string
  stars: number
  guestRating: number
  reviews: number
  image: string
  lowestRate: number | null
  rates: KayakRate[]
}

export type KayakResult =
  | { ok: true; hotels: KayakHotel[]; currency: string; sandbox: boolean }
  | { ok: false; reason: "no_dates" | "busy" | "error" }

// KAYAK asks for one id per user per app session.
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}
const TRACK_ID = uuid()

const cache = new Map<string, { at: number; value: KayakResult }>()

export async function kayakHotelPrices(
  city: "Makkah" | "Madinah",
  hotelName: string | null,
  trip: TripDetails | null
): Promise<KayakResult> {
  if (!trip?.checkIn || !trip.checkOut) return { ok: false, reason: "no_dates" }
  const k = [city, hotelName ?? "", trip.checkIn, trip.checkOut, trip.guests].join("|")
  const hit = cache.get(k)
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) return hit.value
  try {
    const { data, error } = await supabase.functions.invoke("kayak-hotels", {
      body: {
        city,
        hotelName: hotelName ?? undefined,
        checkin: trip.checkIn,
        checkout: trip.checkOut,
        guests: trip.guests,
        trackId: TRACK_ID,
        currency: "USD",
      },
    })
    if (error || !data || data.error) {
      return { ok: false, reason: data?.error === "busy" ? "busy" : "error" }
    }
    const value: KayakResult = {
      ok: true,
      hotels: Array.isArray(data.hotels) ? data.hotels : [],
      currency: String(data.currency ?? "USD"),
      sandbox: Boolean(data.sandbox),
    }
    cache.set(k, { at: Date.now(), value })
    return value
  } catch {
    return { ok: false, reason: "error" }
  }
}

/** Short name for matching ("Swissôtel Al Maqam Makkah" → "swissotel al maqam"). */
export function kayakSearchName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(makkah|mecca|madinah|medina|hotel|by|the)\b/gi, " ")
    .replace(/[^a-z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Turns on KAYAK in the app: the "Compare prices" button on hotels and the live flight prices card.
 * Off (false) until KAYAK approves us and gives the production key. Then:
 *   1. npx supabase@latest secrets set KAYAK_API_KEY=<live key>
 *   2. npx supabase@latest secrets set KAYAK_BASE_URL=<live address from KAYAK>
 *   3. change false to true below, and build the app.
 */
export const KAYAK_COMPARE_ENABLED: boolean = false

// ─── Flights ───

export type KayakFlightLeg = {
  from: string
  to: string
  /** Local time at the airport, "2026-12-10T00:20:00" */
  departure: string
  arrival: string
  minutes: number
  stops: number
  airlines: { code: string; name: string; logo: string }[]
}

export type KayakFlight = {
  id: string
  price: number | null
  displayPrice: string
  provider: string
  providerLogo: string
  url: string
  direct: boolean
  freeCancel: boolean
  legs: KayakFlightLeg[]
}

export type KayakFlightsResult =
  | { ok: true; flights: KayakFlight[]; currency: string; sandbox: boolean }
  | { ok: false; reason: "no_trip" | "busy" | "error" }

const flightCache = new Map<string, { at: number; value: KayakFlightsResult }>()

/** Return flights from the saved home airport into Jeddah/Madinah and back home from Jeddah/Madinah. */
export async function kayakFlights(
  trip: TripDetails | null,
  arriveAt: "JED" | "MED",
  returnFrom: "JED" | "MED"
): Promise<KayakFlightsResult> {
  if (!trip?.originCode || !trip.checkIn || !trip.checkOut) return { ok: false, reason: "no_trip" }
  const k = [trip.originCode, arriveAt, returnFrom, trip.checkIn, trip.checkOut, trip.guests].join("|")
  const hit = flightCache.get(k)
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) return hit.value
  try {
    const { data, error } = await supabase.functions.invoke("kayak-flights", {
      body: {
        origin: trip.originCode.toUpperCase(),
        destination: arriveAt,
        returnFrom,
        departDate: trip.checkIn,
        returnDate: trip.checkOut,
        adults: trip.guests,
        trackId: TRACK_ID,
        currency: "USD",
      },
    })
    if (error || !data || data.error) return { ok: false, reason: data?.error === "busy" ? "busy" : "error" }
    const value: KayakFlightsResult = {
      ok: true,
      flights: Array.isArray(data.flights) ? data.flights : [],
      currency: String(data.currency ?? "USD"),
      sandbox: Boolean(data.sandbox),
    }
    flightCache.set(k, { at: Date.now(), value })
    return value
  } catch {
    return { ok: false, reason: "error" }
  }
}
