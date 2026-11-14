// The ONLY screens the AI guide may link to. Each key is turned into a button by the app
// (app/AIGuideScreen.js has the same keys → real routes). Keep both lists in sync.
// Format the AI must use: [LINK: key | Button label]

export const APP_SCREENS: { key: string; what: string }[] = [
  // Tabs
  { key: "home", what: "Home tab: next prayer countdown, Quran card, adhkar cards, Quick Access" },
  { key: "guide", what: "Guide tab: prayer times + Adhan voice, Umrah/Hajj guides, Quran, Qibla, Islamic dates" },
  { key: "maps", what: "Maps tab: all sites, My Location, Makkah places" },
  { key: "services", what: "Services tab: hotels, flights, eSIM, restaurants, Find an Agent, hospitals, transport, shopping" },
  { key: "me", what: "Me tab (My Agency for agencies): profile, favorites, notifications, settings, contact" },
  // Umrah / Hajj
  { key: "umrah-guide", what: "Umrah Guide: the 7 steps with progress" },
  { key: "umrah/1", what: "Umrah step 1: Madinah visit" },
  { key: "umrah/2", what: "Umrah step 2: Ihram and intention" },
  { key: "umrah/3", what: "Umrah step 3: arriving in Makkah" },
  { key: "umrah/4", what: "Umrah step 4: Tawaf" },
  { key: "umrah/5", what: "Umrah step 5: Sa'i (Safa and Marwah)" },
  { key: "umrah/6", what: "Umrah step 6: Halq / Taqsir" },
  { key: "umrah/7", what: "Umrah step 7: Umrah complete" },
  { key: "hajj", what: "Hajj Guide overview (9 steps)" },
  { key: "hajj/1", what: "Hajj step 1: preparation and Ihram" },
  { key: "hajj/2", what: "Hajj step 2: arriving in Makkah" },
  { key: "hajj/3", what: "Hajj step 3: Day of Tarwiyah in Mina" },
  { key: "hajj/4", what: "Hajj step 4: Day of Arafah" },
  { key: "hajj/5", what: "Hajj step 5: Muzdalifah" },
  { key: "hajj/6", what: "Hajj step 6: Day of Eid, Jamarat" },
  { key: "hajj/7", what: "Hajj step 7: Days of Tashreeq" },
  { key: "hajj/8", what: "Hajj step 8: Tawaf al-Wadaa (farewell)" },
  { key: "hajj/9", what: "Hajj step 9: Hajj complete" },
  { key: "makkah-companion", what: "Makkah companion: Tawaf and Sa'i counters, My duas (Premium)" },
  { key: "miqat-alert", what: "Miqat alert (reminder before the Miqat, Premium)" },
  { key: "trip-planner", what: "Trip Planner: trip countdown and checklist (Premium)" },
  // Quran and worship
  { key: "quran", what: "Quran Reader: surah list, Mushaf and Verse view, bookmarks" },
  { key: "quran/N", what: "Open surah number N (1 to 114), e.g. quran/36 for Ya-Sin" },
  { key: "quran-listen", what: "Listen to the Quran: reciters, whole surahs, downloads" },
  { key: "kahf", what: "Al-Kahf page (Friday reading and reminder)" },
  { key: "mulk", what: "Al-Mulk page (nightly reading and reminder)" },
  { key: "duas", what: "Duas and the Tasbih counter" },
  { key: "dhikr", what: "Today's dhikr" },
  { key: "morning-adhkar", what: "Morning Adhkar" },
  { key: "evening-adhkar", what: "Evening Adhkar" },
  { key: "qiblah", what: "Qibla compass" },
  { key: "islamic-calendar", what: "Islamic (Hijri) calendar and important dates" },
  // Maps
  { key: "maps/haram", what: "Masjid al-Haram (Makkah) map and gates" },
  { key: "maps/nabawi", what: "Masjid an-Nabawi (Madinah) map, Rawdah" },
  { key: "maps/mina", what: "Mina map" },
  { key: "maps/arafah", what: "Arafah map" },
  { key: "maps/zamzam", what: "Zamzam water locations" },
  { key: "maps/safa", what: "Safa and Marwah" },
  { key: "maps/hospital-makkah", what: "Hospitals and pharmacies (Nahdi)" },
  { key: "maps/lost-found", what: "Lost & Found in the Haram" },
  { key: "offline-map", what: "Offline map of Makkah and Madinah (Premium)" },
  { key: "makkah-places", what: "Makkah places to see" },
  { key: "makkah-place/abraj-mall", what: "Abraj Al Bait Mall" },
  { key: "makkah-place/clock-tower-museum", what: "Clock Tower Museum (with video)" },
  // Services
  { key: "hotels", what: "Hotels near the Haram (Makkah / Madinah, Book now on Booking.com)" },
  { key: "flights", what: "Flights (Aviasales search)" },
  { key: "esim", what: "Saily eSIM" },
  { key: "airalo", what: "Airalo eSIM plans" },
  { key: "restaurants", what: "Restaurants near the Haram / Nabawi (live photos, ratings, open now, walking time)" },
  { key: "malls", what: "Malls and shopping centres near the Haram / Nabawi (live)" },
  { key: "transport", what: "Transport: airport taxi (Booking.com), Haramain train, SAPTCO buses, Uber" },
  { key: "tours", what: "Tours & ziyarah trips: search a holy site or city (Makkah, Madinah, Jeddah, Taif, AlUla, Riyadh) and book tours on Booking.com" },
  { key: "shopping", what: "Malls and shopping (same as malls)" },
  { key: "find-agent", what: "Find an Agent: verified travel agencies by country" },
  { key: "scan-agent", what: "Scan an agency's QR code" },
  // Account and app
  { key: "profile", what: "Profile: name, phone, agent code, change password, delete account" },
  { key: "favorites", what: "Favorites (saved hotels and restaurants)" },
  { key: "notifications", what: "Notifications: Adhan per prayer, adhkar, Kahf/Mulk reminders, test full Adhan" },
  { key: "notification-check", what: "Check my reminders (finds what blocks the Adhan)" },
  { key: "settings", what: "Settings: language, dark mode, privacy, terms" },
  { key: "premium", what: "UmrahConnect Premium (pilgrims only; never for agencies)" },
  { key: "start-guide", what: "App guide: checklist of the most useful features" },
  { key: "contact", what: "Contact Us" },
  { key: "about", what: "About Us" },
  // Agencies
  { key: "agency-dashboard", what: "Agency Dashboard (agencies only): pilgrims, contacts, QR, announcements, earnings" },
  { key: "agency-apply", what: "Agency application: agency details and documents (agencies only)" },
]

// Premium-only screens: free pilgrims see a lock there; check the USER account before linking.
export const PREMIUM_ONLY_KEYS = ["trip-planner", "offline-map", "makkah-companion", "miqat-alert"]

export const appScreensText = APP_SCREENS.map((s) => `- ${s.key} → ${s.what}`).join("\n")
