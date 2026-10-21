// More hotels to book on Booking.com, from budget to 5 star (Makkah and Madinah).
// Each "Book now" goes through our CJ affiliate link, made from the hotel's Booking.com page:
//   cjBooking("<slug>") -> https://www.anrdoezrs.net/click-101805153-11891539?sid=...&url=<booking.com page>
// To add a hotel: copy its Booking.com address (booking.com/hotel/sa/<slug>.html), add a row below.
// Walking times and stars are approximate; shuttle = too far to walk, the hotel runs a bus.
import type { FeaturedHotel } from "./featuredHotels"
import { HOTEL_BRAND_LOGOS } from "./hotelImages"

const CJ = "https://www.anrdoezrs.net/click-101805153-11891539"

/** Affiliate link to one Booking.com hotel page (slug = the part before .html). */
export function cjBooking(slug: string, sid = slug) {
  const page = `https://www.booking.com/hotel/sa/${slug}.html?`
  return `${CJ}?sid=${encodeURIComponent(sid.slice(0, 40))}&url=${encodeURIComponent(page)}`
}

/** Affiliate link to a Booking.com search (for hotels without a known Booking.com page). */
export function cjBookingSearch(query: string) {
  const page = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}`
  return `${CJ}?sid=${encodeURIComponent(query.slice(0, 40))}&url=${encodeURIComponent(page)}`
}

type Row = [name: string, tier: "budget" | "mid" | "luxury", stars: number, walk: number | null, logo: keyof typeof HOTEL_BRAND_LOGOS, description: string, bookingSlug: string]

/** Booking.com pages that did not open when we checked: these use a Booking.com search for the name instead. */
const SEARCH_INSTEAD = new Set(["coral-madinah", "diwan-al-bait", "royal-dar-al-eiman"])

function build(city: "Makkah" | "Madinah", rows: Row[]): FeaturedHotel[] {
  return rows.map(([name, tier, stars, walk, logo, description, bookingSlug]) => ({
    id: `more-${bookingSlug}`,
    name,
    city,
    description,
    image: HOTEL_BRAND_LOGOS[logo],
    imageFallback: HOTEL_BRAND_LOGOS.generic,
    imageType: "logo" as const,
    // Shuttle hotels: sorted last and left out of the walking-distance filter.
    walkMinutes: walk ?? 30,
    shuttle: walk === null,
    tier,
    stars,
    partners: [{ name: "Booking.com", url: SEARCH_INSTEAD.has(bookingSlug) ? cjBookingSearch(`${name} ${city}`) : cjBooking(bookingSlug) }],
  }))
}

export const MORE_MAKKAH_HOTELS: FeaturedHotel[] = build("Makkah", [
  ["Makkah Hotel", "luxury", 5, 3, "generic", "Classic 5 star right beside the Haram on Ibrahim Al Khalil Street", "makkah-hotel"],
  ["Makkah Towers", "luxury", 5, 3, "generic", "Twin towers next to the Haram with a mall below", "makkah-towers"],
  ["Address Jabal Omar Makkah", "luxury", 5, 5, "generic", "Stylish Jabal Omar tower hotel with views toward the Haram", "address-jabal-omar-makkah"],
  ["Hilton Makkah Convention Hotel", "luxury", 5, 10, "hilton", "Large Hilton with convention space, a short walk to the Haram", "hilton-makkah-convention"],
  ["M Hotel Makkah by Millennium", "luxury", 5, null, "millennium", "Big modern 5 star with a shuttle, cheaper than central towers", "m-makkah-by-millennium"],
  ["Dorrar Al Eiman Royal Hotel", "mid", 4, 3, "generic", "Steps from the Haram gates, some rooms with Haram views", "royal-dar-al-eiman"],
  ["Al Ghufran Safwah Hotel Makkah", "mid", 4, 3, "generic", "Very close to the Haram with a simple, clean setup", "dar-al-ghufran-makkah"],
  ["Emaar Grand Hotel", "mid", 4, 5, "generic", "Close to the Haram on Ibrahim Al Khalil Street, good value", "dar-al-eiman-grand"],
  ["DoubleTree by Hilton Jabal Omar Makkah", "mid", 4, 6, "hilton", "Hilton quality in the Jabal Omar district near the Haram", "doubletree-by-hilton-makkah-jabal-omar"],
  ["Makarem Ajyad Makkah Hotel", "mid", 4, 7, "generic", "Popular 4 star Ajyad hotel a few minutes walk from the Haram", "ajyad-makkah-makarim"],
  ["Manazel Ajyad Hotel (Elaf Ajyad)", "mid", 4, 8, "generic", "Comfortable Ajyad hotel with an easy walk to the Haram", "elaf-ajyad-makkah"],
  ["Novotel Makkah Thakher City", "mid", 4, null, "accor", "Modern Novotel in Thakher City with a Haram shuttle", "novotel-makkah-thaker-city"],
  ["voco Makkah", "mid", 4, null, "ihg", "Newer IHG hotel about a 12 minute drive from the Haram", "voco-makkah"],
  ["Maysan Al Maqam Hotel", "budget", 3, 8, "generic", "Budget Ajyad hotel popular with groups, a short walk to the Haram", "maysan-al-maqam"],
  ["Best Western Ajyad Makkah", "budget", 3, 10, "generic", "Simple, well rated rooms in Ajyad within walking distance of the Haram", "byst-wystrn-mk-lmkrm-mk-lmkrm"],
  ["Palestine Hotel Makkah", "budget", 3, 12, "generic", "Long running budget hotel in Misfalah, walkable to the Haram", "palestine-makkah"],
  ["Diwan Al Bait Hotel", "budget", 3, 15, "generic", "Value hotel in Jarwal, a longer but doable walk to the Haram", "diwan-al-bait"],
  ["ibis Styles Makkah", "budget", 3, 20, "accor", "Bright, affordable Accor hotel on Ibrahim Al Khalil Street", "ibis-styles-makkah"],
  ["Al Kiswah Towers Hotel", "budget", 3, null, "generic", "Large budget towers hotel with a shuttle bus to the Haram", "al-kiswah-towers"],
  ["Ramada by Wyndham Makkah Zad Al Tayseer", "budget", 4, null, "generic", "Huge, low cost Ramada with regular shuttles to the Haram", "ramada-by-wyndham-makkah-zad-al-tayseer"],
  ["Holiday Inn Makkah Al Aziziah", "budget", 4, null, "ihg", "Cheap 4 star IHG hotel in Aziziyah with a Haram shuttle", "holiday-inn-makkah-al-aziziah"],
  ["Holiday Suites Al Azizia", "budget", 3, null, "generic", "Suite style budget stay in Aziziyah, handy for Mina during Hajj", "holiday-suites-al-aziziah"],
])

export const MORE_MADINAH_HOTELS: FeaturedHotel[] = build("Madinah", [
  ["Millennium Al Aqeeq Hotel", "luxury", 5, 2, "millennium", "Upscale hotel facing the Haram with large rooms", "millennium-al-aqeeq-madinah-hotel"],
  ["Sofitel Shahd Al Madinah", "luxury", 5, 2, "accor", "Elegant French style luxury steps from the mosque", "shahd-al-madina-managed-by-accor"],
  ["Frontel Al Harithia Hotel", "luxury", 5, 2, "generic", "Five star comfort right by the Haram courtyard", "western-alharithia-madina"],
  ["InterContinental Dar Al Hijra Madinah", "luxury", 5, 10, "ihg", "Quiet luxury hotel a short walk or shuttle from the mosque", "dar-al-hijra-intercontinental"],
  ["Le Meridien Medina", "luxury", 5, null, "leMeridien", "Resort style hotel outside the centre, drive or shuttle needed", "le-meridien-madina"],
  ["Taiba Front Hotel", "mid", 4, 2, "generic", "Well reviewed hotel right across from the mosque plaza", "al-majeedi-arac-suites"],
  ["Millennium Taiba Hotel", "mid", 4, 3, "millennium", "Comfortable branded hotel a few minutes from the Haram", "millennium-taibah"],
  ["Emaar Royal Hotel", "mid", 4, 3, "generic", "Solid 4 star choice close to the northern gates", "al-eman-royal"],
  ["Artal International Hotel", "mid", 4, 5, "generic", "Busy pilgrim hotel with easy walk to the Haram", "artal-international"],
  ["Waqf Othman Bin Affan Hotel", "mid", 4, 8, "generic", "Newer charitable endowment hotel near the Haram", "fndq-wqf-thmn-bn-fn"],
  ["Province Al Sham Hotel", "mid", 4, 9, "generic", "Good value 4 star about 700 m from the mosque", "hayatt-international"],
  ["Rua Al Hijrah Hotel", "mid", 4, 12, "generic", "Large hotel a little further out with good value rooms", "coral-madinah"],
  ["Golden Tulip Al Zahabi", "budget", 3, 2, "generic", "Simple rooms just steps from the Prophet's Mosque gates", "golden-tulip-al-zahabi"],
  ["Al Ansar Golden Tulip", "budget", 3, 3, "generic", "Budget friendly hotel a short walk from the Haram", "al-ansar-golden-tulip"],
  ["Odst Al Madinah Hotel", "budget", 3, 5, "generic", "Popular value hotel about five minutes from the mosque", "odst-al-madinah"],
  ["Zowar International Hotel", "budget", 3, 5, "generic", "Basic, clean rooms within easy walking distance of the Haram", "zowar-international"],
  ["Plaza Inn Ohud Hotel", "budget", 3, 5, "generic", "Affordable stay close to the Prophet's Mosque", "al-madina-arac-inn"],
  ["Al Rawda Royal Inn", "budget", 3, 5, "generic", "No frills hotel a few minutes walk from the Haram", "dyar-international"],
  ["Ruve Al Madinah Hotel", "budget", 3, 10, "generic", "Modern budget hotel within walking distance of the mosque", "holiday-villa-madinah"],
  ["Al Mukhtara International Hotel", "budget", 3, 11, "generic", "Large economy hotel popular with Umrah groups", "mokhtara-international"],
])
