import type { TripDetails } from "@/lib/tripDetails"

function setStayParams(url: URL, trip: TripDetails) {
  const guests = Math.min(9, Math.max(1, Math.round(trip.guests)))
  url.searchParams.set("checkin", trip.checkIn)
  url.searchParams.set("checkout", trip.checkOut)
  url.searchParams.set("group_adults", String(guests))
  url.searchParams.set("no_rooms", String(Math.max(1, Math.ceil(guests / 2))))
  url.searchParams.set("group_children", "0")
}

/**
 * Adds stay dates and guests to a Booking.com link.
 * Commission Junction wrappers keep their click id and sid; only the inner url changes.
 */
export function applyStayToBookingUrl(rawUrl: string, trip: TripDetails | null): string {
  if (!trip?.checkIn || !trip.checkOut) return rawUrl
  try {
    const wrapped = rawUrl.match(/([?&]url=)([^&]*)/)
    if (wrapped) {
      const inner = new URL(decodeURIComponent(wrapped[2]))
      setStayParams(inner, trip)
      return rawUrl.replace(wrapped[0], `${wrapped[1]}${encodeURIComponent(inner.toString())}`)
    }
    const direct = new URL(rawUrl)
    if (direct.hostname.toLowerCase().includes("booking.com")) {
      setStayParams(direct, trip)
      return direct.toString()
    }
    return rawUrl
  } catch {
    return rawUrl
  }
}
