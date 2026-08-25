import { HOTEL_IMAGE_PLACEHOLDER } from "./hotelImages"

export type FeaturedHotelCity = "Makkah" | "Madinah"

export type FeaturedHotel = {
  id: string
  name: string
  city: FeaturedHotelCity
  /** Short line shown under the name */
  description: string
  /** Remote image URL — placeholder until real photos are added */
  image: string
  /** Booking.com affiliate deep link (open via Linking.openURL) */
  bookingUrl: string
}

/** Featured hotels near Masjid al-Haram (Makkah). */
export const FEATURED_MAKKAH_HOTELS: FeaturedHotel[] = [
  {
    id: "featured-swissotel-al-maqam",
    name: "Swissotel Al Maqam Makkah",
    city: "Makkah",
    description: "Direct access toward Masjid al-Haram · Abraj Al-Bait area",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/swissotel-al-maqam-makkah.html?aid=4347392",
  },
  {
    id: "featured-swissotel-makkah",
    name: "Swissotel Makkah",
    city: "Makkah",
    description: "Steps from Masjid al-Haram · Abraj Al-Bait",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl: "https://www.booking.com/hotel/sa/swissotel-makkah.html?aid=4347392",
  },
  {
    id: "featured-pullman-zamzam-makkah",
    name: "Pullman ZamZam Makkah",
    city: "Makkah",
    description: "Grand suites · Direct Haram access",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/zamzam-grand-suites-managed-by-pullman.html?aid=4347392",
  },
  {
    id: "featured-movenpick-hajar",
    name: "Mövenpick Hotel & Residences Hajar Tower Makkah",
    city: "Makkah",
    description: "Clock Towers complex · Near Masjid al-Haram",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/movenpick-residence-hajar-tower-makkah.html?aid=4347392",
  },
  {
    id: "featured-marriott-makkah",
    name: "Makkah Marriott Hotel",
    city: "Makkah",
    description: "Short walk to Masjid al-Haram",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl: "https://www.booking.com/hotel/sa/makkah-marriott.html?aid=4347392",
  },
  {
    id: "featured-al-safwah",
    name: "Al Safwah Hotel",
    city: "Makkah",
    description: "Close to the Haram · Central Makkah",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl: "https://www.booking.com/hotel/sa/al-safwah.html?aid=4347392",
  },
  {
    id: "featured-hyatt-regency-makkah",
    name: "Hyatt Regency Makkah",
    city: "Makkah",
    description: "Jabal Omar · Near Masjid al-Haram",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/hyatt-regency-makkah.html?aid=4347392",
  },
  {
    id: "featured-fairmont-clock",
    name: "Makkah Clock Royal Tower, A Fairmont",
    city: "Makkah",
    description: "Iconic Clock Tower · Connected to Masjid al-Haram",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/makkah-clock-royal-tower-a-fairmont.html?aid=4347392",
  },
  {
    id: "featured-jabal-omar-jumeirah",
    name: "Jabal Omar Jumeirah Makkah",
    city: "Makkah",
    description: "Luxury stay · Short walk to the Holy Mosque",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/jabal-omar-jumeirah-makkah.html?aid=4347392",
  },
]

/** Featured hotels near Al-Masjid an-Nabawi (Madinah). */
export const FEATURED_MADINAH_HOTELS: FeaturedHotel[] = [
  {
    id: "featured-al-manakha-rotana",
    name: "Al Manakha Rotana Madinah",
    city: "Madinah",
    description: "Steps from the Prophet's Mosque",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/al-manakha-rotana-madinah-madinah.html?aid=4347392",
  },
  {
    id: "featured-anwar-movenpick",
    name: "Anwar Al Madinah Mövenpick",
    city: "Madinah",
    description: "Direct access area · Al-Masjid an-Nabawi",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/anwar-al-madinah-movenpick.html?aid=4347392",
  },
  {
    id: "featured-madinah-hilton",
    name: "Madinah Hilton",
    city: "Madinah",
    description: "Short walk to the Prophet's Mosque",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl: "https://www.booking.com/hotel/sa/madinah-hilton.html?aid=4347392",
  },
  {
    id: "featured-dar-al-iman",
    name: "Dar Al Iman InterContinental Madinah",
    city: "Madinah",
    description: "Iconic hotel facing the Prophet's Mosque",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/dar-al-iman-intercontinental.html?aid=4347392",
  },
  {
    id: "featured-elaf-taiba",
    name: "Elaf Taiba",
    city: "Madinah",
    description: "Close to Al-Masjid an-Nabawi",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl: "https://www.booking.com/hotel/sa/elaf-taiba.html?aid=4347392",
  },
  {
    id: "featured-pullman-zamzam-madinah",
    name: "Pullman Zamzam Madina",
    city: "Madinah",
    description: "Steps from the Prophet's Mosque",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/pullman-zamzam-madina.html?aid=4347392",
  },
  {
    id: "featured-mawaddah-al-salwa",
    name: "Mawaddah Al Salwa",
    city: "Madinah",
    description: "Near Al-Masjid an-Nabawi",
    image: HOTEL_IMAGE_PLACEHOLDER,
    bookingUrl:
      "https://www.booking.com/hotel/sa/mawadah-al-salwa.html?aid=4347392",
  },
]

/** Affiliate budget browse links for each holy city. */
export const FEATURED_BUDGET_URLS: Record<FeaturedHotelCity, string> = {
  Makkah: "https://www.booking.com/budget/city/sa/mecca.html?aid=4347392",
  Madinah: "https://www.booking.com/budget/region/sa/al-madinah.html?aid=4347392",
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
