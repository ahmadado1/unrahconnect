// Tours & ziyarah: a short list of Saudi places, each opening Booking.com "things to do"
// for that city through our CJ account (link 11891539 allows deep links, like the hotel links).
export type TourCity = {
  id: string
  slug: string // Booking.com city page: booking.com/things-to-do/city/sa/<slug>.html
  nameKey: string
  highlightsKey: string
  photo?: number
  icon: string
  color: string
  // Words people may search for (English, Arabic, common spellings)
  words: string[]
}

export const TOUR_CITIES: TourCity[] = [
  {
    id: "makkah", slug: "mecca", nameKey: "tourMakkah", highlightsKey: "tourMakkahHi",
    photo: require("../assets/photos/tawaf-header.jpg"), icon: "moon", color: "#1E3A5F",
    words: ["makkah", "mecca", "makka", "macca", "haram", "masjid al haram", "masjid al-haram", "kaaba", "kabah", "hira", "jabal nour", "jabal al nour", "thawr", "mina", "arafat", "arafah", "muzdalifah", "clock tower", "ziyarah", "ziyarat", "مكة", "الحرم", "الكعبة", "حراء", "ثور", "منى", "عرفات", "مزدلفة"],
  },
  {
    id: "madinah", slug: "medina", nameKey: "tourMadinah", highlightsKey: "tourMadinahHi",
    photo: require("../assets/photos/masjid-nabawi.jpg"), icon: "leaf", color: "#2F6B4F",
    words: ["madinah", "medina", "madina", "nabawi", "nabawa", "masjid an nabawi", "prophet mosque", "quba", "uhud", "qiblatayn", "baqi", "seven mosques", "ziyarah", "ziyarat", "المدينة", "النبوي", "قباء", "أحد", "احد", "القبلتين", "البقيع"],
  },
  {
    id: "jeddah", slug: "jiddah", nameKey: "tourJeddah", highlightsKey: "tourJeddahHi",
    icon: "boat", color: "#2B6CB0",
    words: ["jeddah", "jiddah", "jedda", "corniche", "balad", "al balad", "red sea", "floating mosque", "جدة", "البلد", "الكورنيش"],
  },
  {
    id: "taif", slug: "taif", nameKey: "tourTaif", highlightsKey: "tourTaifHi",
    icon: "flower", color: "#B83280",
    words: ["taif", "ta'if", "al hada", "hada", "shafa", "rose", "roses", "الطائف", "الهدا", "الشفا", "الورد"],
  },
  {
    id: "alula", slug: "al-ula", nameKey: "tourAlula", highlightsKey: "tourAlulaHi",
    icon: "image", color: "#C05621",
    words: ["alula", "al ula", "al-ula", "hegra", "madain saleh", "mada'in salih", "elephant rock", "العلا", "الحجر", "مدائن صالح"],
  },
  {
    id: "riyadh", slug: "riyadh-sa", nameKey: "tourRiyadh", highlightsKey: "tourRiyadhHi",
    icon: "business", color: "#4A5568",
    words: ["riyadh", "riyad", "diriyah", "boulevard", "edge of the world", "kingdom tower", "الرياض", "الدرعية", "البوليفارد"],
  },
]

export function tourLink(city: TourCity) {
  const dest = `https://www.booking.com/things-to-do/city/sa/${city.slug}.html`
  return `https://www.kqzyfj.com/click-101805153-11891539?sid=app-tours-${city.id}&url=${encodeURIComponent(dest)}`
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ًͯ-ْ]/g, "").replace(/[-'’]/g, " ").replace(/\s+/g, " ").trim()
}

/** Places that match what was typed (by city, landmark or mosque name). Empty search: all. */
export function searchTours(query: string, nameOf: (c: TourCity) => string): TourCity[] {
  const q = norm(query)
  if (!q) return TOUR_CITIES
  return TOUR_CITIES.filter(c =>
    norm(nameOf(c)).includes(q) || c.words.some(w => { const n = norm(w); return n.includes(q) || (q.length >= 4 && q.includes(n)) }),
  )
}
