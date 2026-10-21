// One list of every hotel in the app (Makkah and Madinah), each shown ONCE.
// It joins three sources:
//   • lib/hotels.ts         the hotel directory (has a detail page: address, phone, map)
//   • lib/featuredHotels.ts our partner picks with Booking.com links
//   • lib/moreHotels.ts     the bigger list, budget to 5 star
// The Hotels screen shows it as: Featured → 5 Star → 4 Star → Budget Friendly.
import { FEATURED_MADINAH_HOTELS, FEATURED_MAKKAH_HOTELS, type FeaturedHotel } from "./featuredHotels"
import HOTEL_PHOTOS from "./hotelPhotos.json"
import { HOTELS, type HotelCity } from "./hotels"
import { cjBookingSearch, MORE_MADINAH_HOTELS, MORE_MAKKAH_HOTELS } from "./moreHotels"

export type HotelTier = "budget" | "mid" | "luxury"

export type CatalogHotel = {
  id: string
  name: string
  city: HotelCity
  stars: number
  tier: HotelTier
  walkMinutes: number
  /** Too far to walk: the hotel runs a shuttle bus */
  shuttle: boolean
  description: string
  image: string
  imageFallback: string
  imageType: "logo" | "photo"
  /** Booking.com through our CJ affiliate link */
  bookingUrl: string
  /** Hotel directory id: the card opens the detail page (address, phone, map) */
  detailId?: string
  featured: boolean
  /** Extra words the search looks at (area, brand, address, amenities) */
  keywords: string
}

/** Top hotels next to the Haram / Clock Tower and next to Al-Masjid an-Nabawi. */
const FEATURED_IDS = new Set([
  // Makkah
  "fairmont-clock",
  "raffles-makkah",
  "swissotel-makkah",
  "featured-swissotel-al-maqam",
  "pullman-zamzam",
  "movenpick-hajar",
  "rotana-makkah",
  "al-safwah-orchid",
  // Madinah
  "oberoi-madinah",
  "anwar-movenpick",
  "featured-dar-al-iman",
  "dar-al-taqwa",
  "hilton-madinah",
  "featured-pullman-zamzam-madinah",
])

/** Partner hotels that are the same hotel as one in the directory: shown once, with the partner link. */
const SAME_HOTEL: Record<string, string> = {
  "featured-swissotel-makkah": "swissotel-makkah",
  "featured-pullman-zamzam-makkah": "pullman-zamzam",
  "featured-movenpick-hajar": "movenpick-hajar",
  "featured-al-safwah": "al-safwah-orchid",
  "featured-hyatt-regency-makkah": "hyatt-regency-makkah",
  "featured-fairmont-clock": "fairmont-clock",
  "featured-anwar-movenpick": "anwar-movenpick",
  "featured-madinah-hilton": "hilton-madinah",
}

/** Stars of partner hotels that are not in the directory. */
const FEATURED_STARS: Record<string, number> = {
  "featured-elaf-taiba": 4,
  "featured-mawaddah-al-salwa": 4,
}

/** Hotels in Abraj Al-Bait (the Clock Tower complex): search "clock tower" finds them. */
const CLOCK_TOWER_IDS = new Set([
  "fairmont-clock",
  "raffles-makkah",
  "swissotel-makkah",
  "featured-swissotel-al-maqam",
  "pullman-zamzam",
  "movenpick-hajar",
  "rotana-makkah",
  "al-safwah-orchid",
])

/** Booking.com page name ("slug") inside an affiliate link, used to find the hotel photo. */
function bookingSlug(url: string): string | null {
  const m = decodeURIComponent(url).match(/booking\.com\/hotel\/sa\/([^.?/]+)\.html/)
  return m ? m[1] : null
}

const PHOTOS = HOTEL_PHOTOS as Record<string, string>

/** Use the Booking.com photo when we have one; the old image becomes the fallback. */
function withPhoto(h: CatalogHotel): CatalogHotel {
  const slug = bookingSlug(h.bookingUrl)
  const photo = slug ? PHOTOS[slug] : undefined
  if (!photo) return h
  return { ...h, image: photo, imageFallback: h.image, imageType: "photo" }
}

function fromFeatured(f: FeaturedHotel, stars: number): CatalogHotel {
  return {
    id: f.id,
    name: f.name,
    city: f.city,
    stars,
    tier: f.tier ?? (stars >= 5 ? "luxury" : "mid"),
    walkMinutes: f.walkMinutes,
    shuttle: Boolean(f.shuttle),
    description: f.description,
    image: f.image,
    imageFallback: f.imageFallback,
    imageType: f.imageType,
    bookingUrl: f.partners[0]?.url ?? cjBookingSearch(`${f.name} ${f.city}`),
    featured: FEATURED_IDS.has(f.id),
    keywords: "",
  }
}

function buildCatalog(): CatalogHotel[] {
  const partnerFor = new Map<string, FeaturedHotel>()
  const featured = [...FEATURED_MAKKAH_HOTELS, ...FEATURED_MADINAH_HOTELS]
  for (const f of featured) {
    const same = SAME_HOTEL[f.id]
    if (same) partnerFor.set(same, f)
  }

  const list: CatalogHotel[] = []

  // 1. Directory hotels (with detail pages).
  for (const h of HOTELS) {
    const partner = partnerFor.get(h.id)
    list.push({
      id: h.id,
      name: h.name,
      city: h.city,
      stars: h.stars,
      tier: h.stars >= 5 ? "luxury" : "mid",
      walkMinutes: h.walkMinutes,
      shuttle: false,
      description: partner?.description ?? h.description,
      image: h.image,
      imageFallback: h.imageFallback,
      imageType: h.imageType,
      bookingUrl: partner?.partners[0]?.url ?? cjBookingSearch(`${h.name} ${h.city}`),
      detailId: h.id,
      featured: FEATURED_IDS.has(h.id),
      keywords: [h.address, h.distanceLabel, h.amenities.join(" "), CLOCK_TOWER_IDS.has(h.id) ? "clock tower abraj al bait" : ""].join(" "),
    })
  }

  // 2. Partner hotels that are not in the directory.
  for (const f of featured) {
    if (SAME_HOTEL[f.id]) continue
    const h = fromFeatured(f, FEATURED_STARS[f.id] ?? 5)
    if (CLOCK_TOWER_IDS.has(f.id)) h.keywords = "clock tower abraj al bait"
    list.push(h)
  }

  // 3. The bigger list (budget to 5 star).
  for (const f of [...MORE_MAKKAH_HOTELS, ...MORE_MADINAH_HOTELS]) {
    list.push(fromFeatured(f, f.stars ?? 4))
  }

  return list.map(withPhoto)
}

export const HOTEL_CATALOG: CatalogHotel[] = buildCatalog()

export type HotelSectionKey = "featured" | "five" | "four" | "budget"

export const HOTEL_SECTION_TITLE_KEYS: Record<HotelSectionKey, string> = {
  featured: "hotelsFeatured",
  five: "hotels5Star",
  four: "hotels4Star",
  budget: "hotelsBudget",
}

/** Which section a hotel belongs to (each hotel is in exactly one). */
export function hotelSection(h: CatalogHotel): HotelSectionKey {
  if (h.featured) return "featured"
  if (h.tier === "budget" || h.stars <= 3) return "budget"
  return h.stars >= 5 ? "five" : "four"
}

/** Closest first; shuttle hotels last. */
export function byDistance(a: CatalogHotel, b: CatalogHotel) {
  return a.walkMinutes - b.walkMinutes
}
