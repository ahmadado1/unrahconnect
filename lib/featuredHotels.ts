import { HOTEL_BRAND_LOGOS } from "./hotelImages"

export type FeaturedHotelCity = "Makkah" | "Madinah"
export type FeaturedHotelImageType = "logo" | "photo"

export type FeaturedHotel = {
  id: string
  name: string
  city: FeaturedHotelCity
  /** Short line shown under the name */
  description: string
  image: string
  imageFallback: string
  imageType: FeaturedHotelImageType
  /** CJ tracking link wrapping the Booking.com hotel page */
  bookingUrl: string
}

function accorPhoto(code: string, shot = "ho_00") {
  return `https://www.ahstatic.com/photos/${code}_${shot}_p_1024x768.jpg`
}

function featuredAccor(code: string) {
  return featuredPhoto(accorPhoto(code, "ho_00"), accorPhoto(code, "ho_01"))
}

function featuredPhoto(
  url: string,
  fallback: string,
): Pick<FeaturedHotel, "image" | "imageFallback" | "imageType"> {
  return { image: url, imageFallback: fallback, imageType: "photo" }
}

function featuredLogo(
  logoUrl: string,
): Pick<FeaturedHotel, "image" | "imageFallback" | "imageType"> {
  return { image: logoUrl, imageFallback: logoUrl, imageType: "logo" }
}

/** Featured hotels near Masjid al-Haram (Makkah). */
export const FEATURED_MAKKAH_HOTELS: FeaturedHotel[] = [
  {
    id: "featured-swissotel-al-maqam",
    name: "Swissotel Al Maqam Makkah",
    city: "Makkah",
    description: "Direct access toward Masjid al-Haram · Abraj Al-Bait area",
    ...featuredAccor("a7x4"),
    bookingUrl:
      "https://www.anrdoezrs.net/click-101805153-11891539?sid=swissotel-almaqam&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fswissotel-al-maqam-makkah.html",
  },
  {
    id: "featured-swissotel-makkah",
    name: "Swissotel Makkah",
    city: "Makkah",
    description: "Steps from Masjid al-Haram · Abraj Al-Bait",
    ...featuredAccor("a5b9"),
    bookingUrl:
      "https://www.jdoqocy.com/click-101805153-11891539?sid=swissotel-makkah&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fswissotel-makkah.html%3Faid%3D4347392",
  },
  {
    id: "featured-pullman-zamzam-makkah",
    name: "Pullman ZamZam Makkah",
    city: "Makkah",
    description: "Grand suites · Direct Haram access",
    ...featuredAccor("6036"),
    bookingUrl:
      "https://www.tkqlhce.com/click-101805153-11891539?sid=Pullman&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fzamzam-grand-suites-managed-by-pullman.html%3F",
  },
  {
    id: "featured-movenpick-hajar",
    name: "Mövenpick Hotel & Residences Hajar Tower Makkah",
    city: "Makkah",
    description: "Clock Towers complex · Near Masjid al-Haram",
    ...featuredAccor("b4l3"),
    bookingUrl:
      "https://www.anrdoezrs.net/click-101805153-11891539?sid=Movenpick&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fmovenpick-residence-hajar-tower-makkah.html%3F",
  },
  {
    id: "featured-marriott-makkah",
    name: "Makkah Marriott Hotel",
    city: "Makkah",
    description: "Short walk to Masjid al-Haram",
    ...featuredPhoto(
      "https://www.cfmedia.vfmleonardo.com/imageRepo/2/0/189/12/426/f88S65Yk5E9T7v9s5hG6w_qcamc-terrace-0006_R.jpg",
      HOTEL_BRAND_LOGOS.marriott,
    ),
    bookingUrl:
      "https://www.kqzyfj.com/click-101805153-11891539?sid=Marriot&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fmakkah-marriott.html%3F",
  },
  {
    id: "featured-al-safwah",
    name: "Al Safwah Hotel",
    city: "Makkah",
    description: "Close to the Haram · Central Makkah",
    ...featuredLogo(HOTEL_BRAND_LOGOS.alSafwah),
    bookingUrl:
      "https://www.jdoqocy.com/click-101805153-11891539?sid=safwa&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fal-safwah.html%3F",
  },
  {
    id: "featured-hyatt-regency-makkah",
    name: "Hyatt Regency Makkah",
    city: "Makkah",
    description: "Jabal Omar · Near Masjid al-Haram",
    ...featuredPhoto(
      "https://cf.bstatic.com/xdata/images/hotel/square600/110318868.webp?k=22c56e8ddb868d285e68ba6d19a8d14c13e4f9822272efa997dce0aa6a8abf61&o=",
      HOTEL_BRAND_LOGOS.hyatt,
    ),
    bookingUrl:
      "https://www.anrdoezrs.net/click-101805153-11891539?sid=hyatt&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fhyatt-regency-makkah.html%3F",
  },
  {
    id: "featured-fairmont-clock",
    name: "Makkah Clock Royal Tower, A Fairmont",
    city: "Makkah",
    description: "Iconic Clock Tower · Connected to Masjid al-Haram",
    ...featuredAccor("a5f2"),
    bookingUrl:
      "https://www.dpbolvw.net/click-101805153-11891539?sid=royal&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fmakkah-clock-royal-tower-a-fairmont.html%3F",
  },
  {
    id: "featured-jabal-omar-jumeirah",
    name: "Jabal Omar Jumeirah Makkah",
    city: "Makkah",
    description: "Luxury stay · Short walk to the Holy Mosque",
    ...featuredPhoto(
      "https://cdn.jumeirah.com/api/public/content/51655c7cfa1e45d39f8c8e47cacd157b",
      HOTEL_BRAND_LOGOS.jumeirah,
    ),
    bookingUrl:
      "https://www.dpbolvw.net/click-101805153-11891539?sid=jumeira&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fjabal-omar-jumeirah-makkah.html%3F",
  },
]

/** Featured hotels near Al-Masjid an-Nabawi (Madinah). */
export const FEATURED_MADINAH_HOTELS: FeaturedHotel[] = [
  {
    id: "featured-al-manakha-rotana",
    name: "Al Manakha Rotana Madinah",
    city: "Madinah",
    description: "Steps from the Prophet's Mosque",
    ...featuredPhoto(
      "https://media.rotana.com/images/almanakharotana/rc_177537323169_613.jpg",
      HOTEL_BRAND_LOGOS.rotana,
    ),
    bookingUrl:
      "https://www.dpbolvw.net/click-101805153-11891539?sid=rotana&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fal-manakha-rotana-madinah-madinah.html%3F",
  },
  {
    id: "featured-anwar-movenpick",
    name: "Anwar Al Madinah Mövenpick",
    city: "Madinah",
    description: "Direct access area · Al-Masjid an-Nabawi",
    ...featuredAccor("b4m6"),
    bookingUrl:
      "https://www.tkqlhce.com/click-101805153-11891539?sid=movempick&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fanwar-al-madinah-movenpick.html%3F",
  },
  {
    id: "featured-madinah-hilton",
    name: "Madinah Hilton",
    city: "Madinah",
    description: "Short walk to the Prophet's Mosque",
    ...featuredPhoto(
      "https://media.iceportal.com/60037/photos/74116233_XL.jpg",
      HOTEL_BRAND_LOGOS.hilton,
    ),
    bookingUrl:
      "https://www.tkqlhce.com/click-101805153-11891539?sid=hilton&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fmadinah-hilton.html%3F",
  },
  {
    id: "featured-dar-al-iman",
    name: "Dar Al Iman InterContinental Madinah",
    city: "Madinah",
    description: "Iconic hotel facing the Prophet's Mosque",
    ...featuredPhoto(
      "https://cf.bstatic.com/xdata/images/hotel/max500/540226226.jpg?k=7daf802e5b5fd81814692800baa0a3ad4eef12b45ed47c18fbe1d70bfbcc9625&o=",
      HOTEL_BRAND_LOGOS.ihg,
    ),
    bookingUrl:
      "https://www.jdoqocy.com/click-101805153-11891539?sid=dar+al+iman&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fdar-al-iman-intercontinental.html%3F",
  },
  {
    id: "featured-elaf-taiba",
    name: "Elaf Taiba",
    city: "Madinah",
    description: "Close to Al-Masjid an-Nabawi",
    ...featuredPhoto(
      "https://image-tc.galaxy.tf/wijpeg-e5t954b5drwhz62i6oe28y1ub/elaf-taiba-2-2562-hdr_standard.jpg?width=800",
      HOTEL_BRAND_LOGOS.elafTaiba,
    ),
    bookingUrl:
      "https://www.kqzyfj.com/click-101805153-11891539?sid=taiba&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Felaf-taiba.html%3F",
  },
  {
    id: "featured-pullman-zamzam-madinah",
    name: "Pullman Zamzam Madina",
    city: "Madinah",
    description: "Steps from the Prophet's Mosque",
    ...featuredAccor("9245"),
    bookingUrl:
      "https://www.anrdoezrs.net/click-101805153-11891539?sid=pullman&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fpullman-zamzam-madina.html%3F",
  },
  {
    id: "featured-mawaddah-al-salwa",
    name: "Emmaar Elite",
    city: "Madinah",
    description: "Near Al-Masjid an-Nabawi",
    ...featuredLogo(HOTEL_BRAND_LOGOS.mawaddah),
    bookingUrl:
      "https://www.dpbolvw.net/click-101805153-11891539?sid=salwa&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fsa%2Fmawadah-al-salwa.html%3F",
  },
]

/** Affiliate budget browse links for each holy city. */
export const FEATURED_BUDGET_URLS: Record<FeaturedHotelCity, string> = {
  Makkah:
    "https://www.dpbolvw.net/click-101805153-11891539?sid=budget&url=https%3A%2F%2Fwww.booking.com%2Fbudget%2Fcity%2Fsa%2Fmecca.html%3F",
  Madinah:
    "https://www.anrdoezrs.net/click-101805153-11891539?sid=budget+2&url=https%3A%2F%2Fwww.booking.com%2Fbudget%2Fregion%2Fsa%2Fal-madinah.html%3F",
}

export type FeaturedHotelSection = {
  city: FeaturedHotelCity
  titleKey: string
  budgetLinkKey: string
  budgetUrl: string
  hotels: FeaturedHotel[]
}

export function getFeaturedHotelsForCity(
  city: FeaturedHotelCity | "All",
): FeaturedHotelSection[] {
  if (city === "Makkah") {
    return [
      {
        city: "Makkah",
        titleKey: "featuredHotelsMakkah",
        budgetLinkKey: "browseMoreBudgetMakkah",
        budgetUrl: FEATURED_BUDGET_URLS.Makkah,
        hotels: FEATURED_MAKKAH_HOTELS,
      },
    ]
  }
  if (city === "Madinah") {
    return [
      {
        city: "Madinah",
        titleKey: "featuredHotelsMadinah",
        budgetLinkKey: "browseMoreBudgetMadinah",
        budgetUrl: FEATURED_BUDGET_URLS.Madinah,
        hotels: FEATURED_MADINAH_HOTELS,
      },
    ]
  }
  return [
    {
      city: "Makkah",
      titleKey: "featuredHotelsMakkah",
      budgetLinkKey: "browseMoreBudgetMakkah",
      budgetUrl: FEATURED_BUDGET_URLS.Makkah,
      hotels: FEATURED_MAKKAH_HOTELS,
    },
    {
      city: "Madinah",
      titleKey: "featuredHotelsMadinah",
      budgetLinkKey: "browseMoreBudgetMadinah",
      budgetUrl: FEATURED_BUDGET_URLS.Madinah,
      hotels: FEATURED_MADINAH_HOTELS,
    },
  ]
}
