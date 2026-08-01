import { HOTEL_BRAND_LOGOS, HOTEL_IMAGE_PLACEHOLDER } from "./hotelImages"

export type HotelCity = "Makkah" | "Madinah"

export type HotelImageType = "logo" | "photo"

export type Hotel = {
  id: string
  name: string
  city: HotelCity
  stars: 4 | 5
  walkMinutes: number
  distanceLabel: string
  address: string
  phone: string
  website: string
  lat: number
  lng: number
  image: string
  imageFallback: string
  imageType: HotelImageType
  brandAccent: string
  description: string
  amenities: string[]
}

function hotelPhoto(
  url: string,
  fallback = HOTEL_IMAGE_PLACEHOLDER
): Pick<Hotel, "image" | "imageFallback" | "imageType"> {
  return { image: url, imageFallback: fallback, imageType: "photo" }
}

function hotelLogo(
  logoUrl: string,
  fallback = logoUrl
): Pick<Hotel, "image" | "imageFallback" | "imageType"> {
  return { image: logoUrl, imageFallback: fallback, imageType: "logo" }
}

export const HOTELS: Hotel[] = [
  // ═══════════════════════════════════════════
  // MAKKAH · 5-Star · Abraj Al-Bait / near Haram
  // ═══════════════════════════════════════════
  {
    id: "fairmont-clock",
    name: "Fairmont Makkah Clock Royal Tower",
    city: "Makkah",
    stars: 5,
    walkMinutes: 1,
    distanceLabel: "1 min · connected to Masjid al-Haram",
    address: "King Abdul Aziz Endowment, Abraj Al Bait Complex, Makkah 21955",
    phone: "+966125717777",
    website: "https://www.fairmont.com/en/hotels/makkah/makkah-clock-royal-tower.html",
    lat: 21.418981,
    lng: 39.825229,
    ...hotelPhoto("https://upload.wikimedia.org/wikipedia/commons/4/4a/Abraj-al-Bait_largest_clock_tower_in_the_world.jpg", "https://makkah-madinah.accor.com/wp-content/uploads/2024/05/Makkah-Clock-Royal-Tower-A-Fairmont-Hotel-3.jpg"),
    brandAccent: "#8B1E3F",
    description:
      "Iconic Clock Tower hotel in Abraj Al-Bait with direct access to Masjid al-Haram and Kaaba views from select rooms.",
    amenities: ["Kaaba view rooms", "Multiple restaurants", "Prayer facilities", "Spa", "Free WiFi"],
  },
  {
    id: "swissotel-makkah",
    name: "Swissôtel Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 2,
    distanceLabel: "2 min · Abraj Al-Bait",
    address: "King Abdul Aziz Endowment, Ajyad Street, Abraj Al Bait, Makkah 21955",
    phone: "+966125718888",
    website: "https://www.swissotel.com/hotels/makkah/",
    lat: 21.4185,
    lng: 39.8258,
    ...hotelLogo(HOTEL_BRAND_LOGOS.swissotel),
    brandAccent: "#C9A84C",
    description:
      "Contemporary 5-star hotel inside Abraj Al-Bait with private entrances toward Masjid al-Haram.",
    amenities: ["Haram access", "Restaurants", "Business centre", "Prayer area", "Free WiFi"],
  },
  {
    id: "pullman-zamzam",
    name: "Pullman Zamzam Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 2,
    distanceLabel: "2 min · Abraj Al-Bait",
    address: "Abraj Al Bait Complex, King Abdel Aziz Endowment, Makkah 21955",
    phone: "+966125715555",
    website: "https://www.pullman-zamzam-makkah.com",
    lat: 21.417864,
    lng: 39.825472,
    ...hotelLogo(HOTEL_BRAND_LOGOS.pullman),
    brandAccent: "#E4002B",
    description:
      "Modern Pullman hotel inside the Clock Towers complex, steps from the Holy Mosque.",
    amenities: ["Family rooms", "Restaurants", "Prayer facilities", "Shopping access", "Free WiFi"],
  },
  {
    id: "conrad-makkah",
    name: "Conrad Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 5,
    distanceLabel: "5 min walk · Jabal Omar",
    address: "Jabal Omar Development, Ibrahim Al Khalil Road, Makkah 24231",
    phone: "+966125717000",
    website: "https://www.hilton.com/en/hotels/makcici-conrad-jabal-omar-makkah/",
    lat: 21.4195,
    lng: 39.8228,
    ...hotelPhoto("https://media.iceportal.com/68124/photos/73541428_XL.jpg", HOTEL_BRAND_LOGOS.conrad),
    brandAccent: "#1B365D",
    description:
      "Luxury Conrad hotel in Jabal Omar with Haram and Kaaba views from select rooms.",
    amenities: ["Haram views", "Spa", "Fine dining", "Fitness centre", "Free WiFi"],
  },
  {
    id: "raffles-makkah",
    name: "Raffles Makkah Palace",
    city: "Makkah",
    stars: 5,
    walkMinutes: 2,
    distanceLabel: "2 min · Abraj Al-Bait",
    address: "King Abdul Aziz Endowment, Abraj Al Bait, Makkah 21955",
    phone: "+966125717800",
    website: "https://all.accor.com/hotel/A5E4/index.en.shtml",
    lat: 21.4179,
    lng: 39.8250,
    ...hotelPhoto("https://makkah-madinah.accor.com/wp-content/uploads/2024/05/accor-Raffles-Makkah-Palace-6-2200x1200.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/4a/Abraj-al-Bait_largest_clock_tower_in_the_world.jpg"),
    brandAccent: "#8B1E3F",
    description:
      "Ultra-luxury all-suite Raffles hotel in the Clock Towers with direct Kaaba views.",
    amenities: ["All suites", "Kaaba views", "Fine dining", "Butler service", "Free WiFi"],
  },
  {
    id: "hilton-suites-makkah",
    name: "Hilton Suites Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 5,
    distanceLabel: "5 min walk · Jabal Omar",
    address: "Jabal Omar, Ibrahim Al Khalil Road, Makkah 21955",
    phone: "+966125567000",
    website: "https://www.hilton.com/en/hotels/maksuhi-hilton-suites-jabal-omar-makkah/",
    lat: 21.4198,
    lng: 39.8235,
    ...hotelLogo(HOTEL_BRAND_LOGOS.hilton),
    brandAccent: "#1B4F9C",
    description:
      "Spacious Hilton suites overlooking the Haram area with shopping and dining nearby.",
    amenities: ["Suites", "Prayer hall", "Fitness centre", "Restaurants", "Free WiFi"],
  },
  {
    id: "movenpick-hajar",
    name: "Mövenpick Hajar Tower Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min · Abraj Al-Bait",
    address: "The Clock Towers, Abraj Al Bait, Makkah 21955",
    phone: "+966125717171",
    website: "https://movenpick.accor.com/en/middle-east/saudi-arabia/makkah/hotel-makkah.html",
    lat: 21.4186,
    lng: 39.8255,
    ...hotelLogo(HOTEL_BRAND_LOGOS.movenpick),
    brandAccent: "#E85D04",
    description:
      "Hajar Tower residence hotel facing King Abdul Aziz Gate with Kaaba views.",
    amenities: ["Kaaba views", "Residences", "Restaurants", "Prayer facilities", "Free WiFi"],
  },
  {
    id: "dar-al-tawhid",
    name: "InterContinental Dar Al Tawhid Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 5,
    distanceLabel: "5 min walk to Masjid al-Haram",
    address: "Ibrahim Al Khalil Road, Makkah 24231",
    phone: "+966125707000",
    website: "https://www.ihg.com/intercontinental/hotels/us/en/makkah/qcahd/hoteldetail",
    lat: 21.4210,
    lng: 39.8240,
    ...hotelPhoto("https://www.cfmedia.vfmleonardo.com/imageRepo/5/0/91/747/497/QCAHD_4178759583_R.jpg", HOTEL_BRAND_LOGOS.ihg),
    brandAccent: "#6B2D5B",
    description:
      "Iconic InterContinental near King Fahad Gate with a private prayer hall.",
    amenities: ["Private prayer hall", "VIP lounge", "Kids club", "Restaurants", "Free WiFi"],
  },
  {
    id: "marriott-makkah",
    name: "Jabal Omar Marriott Hotel Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 6,
    distanceLabel: "6 min walk to Masjid al-Haram",
    address: "Umm Al Qura Street, Jabal Omar, Makkah 21955",
    phone: "+966125296666",
    website: "https://www.marriott.com/en-us/hotels/qcamc-jabal-omar-marriott-hotel-makkah/overview/",
    lat: 21.4202,
    lng: 39.8220,
    ...hotelPhoto("https://www.cfmedia.vfmleonardo.com/imageRepo/2/0/189/12/426/f88S65Yk5E9T7v9s5hG6w_qcamc-terrace-0006_R.jpg", "https://media.iceportal.com/91740/photos/63948416_XL.jpg"),
    brandAccent: "#A81C1C",
    description:
      "5-star Marriott in Jabal Omar, a short walk to Masjid al-Haram.",
    amenities: ["Prayer hall", "Restaurants", "Meeting rooms", "Shopping mall access", "Free WiFi"],
  },
  {
    id: "sheraton-jabal",
    name: "Sheraton Makkah Jabal Al Kaaba",
    city: "Makkah",
    stars: 5,
    walkMinutes: 8,
    distanceLabel: "8 min walk to Masjid al-Haram",
    address: "Jabal Al Kaaba District, Makkah 24231",
    phone: "+966125518900",
    website: "https://www.marriott.com/en-us/hotels/jedsm-sheraton-makkah-jabal-al-kaaba-hotel/overview/",
    lat: 21.4228,
    lng: 39.8195,
    ...hotelPhoto("https://www.cfmedia.vfmleonardo.com/imageRepo/2/0/189/502/251/6HNFVZf1h0iTIujCh6Q5SA_jedsm-exterior-6610_R.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/4a/Abraj-al-Bait_largest_clock_tower_in_the_world.jpg"),
    brandAccent: "#1B4F9C",
    description:
      "Sheraton hotel in the Jabal Al Kaaba area with easy access to the Holy Mosque.",
    amenities: ["Restaurants", "Meeting facilities", "Fitness centre", "Free WiFi"],
  },
  {
    id: "hyatt-regency-makkah",
    name: "Hyatt Regency Makkah Jabal Omar",
    city: "Makkah",
    stars: 5,
    walkMinutes: 6,
    distanceLabel: "6 min walk to Masjid al-Haram",
    address: "Ibrahim Al Khalil Street, Jabal Omar, Makkah 21955",
    phone: "+966125771234",
    website: "https://www.hyatt.com/hyatt-regency/en-US/jedhr-jabal-omar-hyatt-regency-makkah",
    lat: 21.4203,
    lng: 39.8224,
    ...hotelLogo(HOTEL_BRAND_LOGOS.hyatt),
    brandAccent: "#C9A84C",
    description:
      "Hyatt Regency in the Jabal Omar development, a short walk from Masjid al-Haram.",
    amenities: ["Restaurants", "Meeting rooms", "Fitness centre", "Prayer facilities", "Free WiFi"],
  },
  {
    id: "rotana-makkah",
    name: "Al Marwa Rayhaan by Rotana",
    city: "Makkah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min · Ajyad / Clock Tower area",
    address: "Ajyad Street, opposite Abraj Al Bait, Makkah 24231",
    phone: "+966125714444",
    website:
      "https://www.rotana.com/rayhaanhotelandresorts/kingdomofsaudiarabia/makkah/almarwarayhaanbyrotana",
    lat: 21.4175,
    lng: 39.8265,
    ...hotelPhoto("https://www.cfmedia.vfmleonardo.com/imageRepo/3/0/46/258/780/Al_Marwa_Rayhaan_by_Rotana_R.jpg", "https://upload.wikimedia.org/wikipedia/en/f/f4/Abraj-al-Bait-Towers.JPG"),
    brandAccent: "#C9A84C",
    description:
      "Rotana’s Al Marwa Rayhaan on Ajyad Street near the Clock Tower complex and Masjid al-Haram.",
    amenities: ["Haram-area location", "Restaurants", "Prayer facilities", "Free WiFi"],
  },
  {
    id: "al-safwah-orchid",
    name: "Al Safwah Royale Orchid Hotel",
    city: "Makkah",
    stars: 5,
    walkMinutes: 2,
    distanceLabel: "2 min · facing King Abdulaziz Gate",
    address: "Ajyad Street, opposite King Abdulaziz Gate, Makkah 24231",
    phone: "+966125727000",
    website: "https://alsafwahorchid.com.sa/",
    lat: 21.4192,
    lng: 39.8268,
    ...hotelLogo(HOTEL_BRAND_LOGOS.generic),
    brandAccent: "#1E3A5F",
    description:
      "High-rise hotel facing King Abdulaziz Gate of Masjid al-Haram with Kaaba-view rooms.",
    amenities: ["Kaaba / Haram views", "Restaurants", "Business centre", "Free WiFi"],
  },
  {
    id: "anjum-makkah",
    name: "Anjum Hotel Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 4,
    distanceLabel: "4 min walk to Masjid al-Haram",
    address: "Umm Al Qura Street / Ibrahim Al Khalil Road, Makkah 24231",
    phone: "+966125629999",
    website: "https://www.anjumhotel.com/",
    lat: 21.4218,
    lng: 39.8232,
    ...hotelLogo(HOTEL_BRAND_LOGOS.anjum),
    brandAccent: "#1E3A5F",
    description:
      "Well-known 5-star pilgrim hotel near Ibrahim Al Khalil Road and Masjid al-Haram.",
    amenities: ["Restaurants", "Prayer facilities", "Family rooms", "Free WiFi"],
  },
  {
    id: "radisson-blu-makkah",
    name: "Radisson Blu Hotel Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 12,
    distanceLabel: "12 min by taxi · Aziziyah",
    address: "Al Hidaya Complex, Aziziyah District, Makkah 24243",
    phone: "+966125477000",
    website: "https://www.radissonhotels.com/en-us/hotels/radisson-blu-makkah",
    lat: 21.4050,
    lng: 39.8450,
    ...hotelLogo(HOTEL_BRAND_LOGOS.radissonBlu),
    brandAccent: "#003B70",
    description:
      "Large Radisson Blu property in Aziziyah — typically reached by a short taxi ride to the Haram.",
    amenities: ["Restaurants", "Shopping gallery", "Meeting rooms", "Free WiFi"],
  },

  // ═══════════════════════════════════════════
  // MAKKAH · 4-Star
  // ═══════════════════════════════════════════
  {
    id: "le-meridien-towers",
    name: "Le Méridien Towers Makkah",
    city: "Makkah",
    stars: 4,
    walkMinutes: 12,
    distanceLabel: "12 min walk to Masjid al-Haram",
    address: "Kudai Road, Kudai Area, Makkah 21955",
    phone: "+966125399999",
    website: "https://www.marriott.com/en-us/hotels/jedmk-le-meridien-towers-makkah/overview/",
    lat: 21.4105,
    lng: 39.8305,
    ...hotelPhoto("https://www.cfmedia.vfmleonardo.com/imageRepo/2/0/189/279/682/XWdSoTOHY0WHTneP0ahw_jedmk-towers-8259_R.jpg", "https://upload.wikimedia.org/wikipedia/en/f/f4/Abraj-al-Bait-Towers.JPG"),
    brandAccent: "#A81C1C",
    description:
      "Stylish Le Méridien towers in Kudai, about a 12-minute walk to Masjid al-Haram.",
    amenities: ["Restaurants", "Business centre", "Fitness centre", "Free WiFi"],
  },
  {
    id: "elaf-kinda",
    name: "Elaf Kinda Hotel",
    city: "Makkah",
    stars: 4,
    walkMinutes: 4,
    distanceLabel: "4 min walk · Al Mesial Street",
    address: "Al Mesial Street, Misfalah, Makkah 24231",
    phone: "+966125743535",
    website: "https://elafgroup.com/hotel/elaf-kinda/",
    lat: 21.4168,
    lng: 39.8275,
    ...hotelPhoto("https://elafgroup.com/wp-content/uploads/2022/05/Kinda1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/4a/Abraj-al-Bait_largest_clock_tower_in_the_world.jpg"),
    brandAccent: "#1E3A5F",
    description:
      "Elaf Kinda on Al Mesial Street near the Clock Tower, close to King Abdulaziz and King Fahad Gates.",
    amenities: ["Haram views", "Shopping nearby", "Restaurants", "Free WiFi"],
  },
  {
    id: "elaf-bakkah",
    name: "Elaf Bakkah Hotel",
    city: "Makkah",
    stars: 4,
    walkMinutes: 15,
    distanceLabel: "15 min by taxi · Aziziyah",
    address: "Mahbas Al-Jin, Al-Azizyah, Makkah 24243",
    phone: "+966122116444",
    website: "https://elafgroup.com/hotel/elaf-bakkah/",
    lat: 21.4080,
    lng: 39.8480,
    ...hotelLogo(HOTEL_BRAND_LOGOS.elaf),
    brandAccent: "#1E3A5F",
    description:
      "Elaf Bakkah in Aziziyah with city views — a short taxi or shuttle to Masjid al-Haram.",
    amenities: ["Restaurants", "City views", "Prayer facilities", "Free WiFi"],
  },
  {
    id: "millennium-naseem",
    name: "Millennium Makkah Al Naseem",
    city: "Makkah",
    stars: 4,
    walkMinutes: 15,
    distanceLabel: "15 min by taxi · Al Naseem",
    address: "Taif Road, 3rd Ring Road, Al Naseem, Makkah 24245",
    phone: "+966125509700",
    website: "https://www.millenniumhotels.com/en/makkah/millennium-makkah-al-naseem/",
    lat: 21.3890,
    lng: 39.8500,
    ...hotelLogo(HOTEL_BRAND_LOGOS.millennium),
    brandAccent: "#1E3A5F",
    description:
      "Comfortable Millennium hotel in Al Naseem on the 3rd Ring Road.",
    amenities: ["Restaurants", "Parking", "Meeting rooms", "Free WiFi"],
  },
  {
    id: "makkah-millennium",
    name: "Makkah Millennium Hotel",
    city: "Makkah",
    stars: 4,
    walkMinutes: 10,
    distanceLabel: "10 min walk · Ajyad area",
    address: "Ajyad Street area, near Abraj Al Bait, Makkah 24231",
    phone: "+966125727888",
    website: "https://www.millenniumhotels.com/en/destination/saudi-arabia/makkah/",
    lat: 21.4165,
    lng: 39.8278,
    ...hotelLogo(HOTEL_BRAND_LOGOS.millennium),
    brandAccent: "#1E3A5F",
    description:
      "Millennium Hotels property serving pilgrims with convenient access toward Masjid al-Haram.",
    amenities: ["Restaurants", "Parking", "Free WiFi"],
  },

  // ═══════════════════════════════════════════
  // MADINAH · 5-Star
  // ═══════════════════════════════════════════
  {
    id: "oberoi-madinah",
    name: "Oberoi Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 1,
    distanceLabel: "1 min · facing Masjid al-Nabawi",
    address: "Abizar Road, Central Area, Madinah 42311",
    phone: "+966148282222",
    website: "https://www.oberoihotels.com/hotels-in-madina/",
    lat: 24.4690,
    lng: 39.6085,
    ...hotelPhoto("https://upload.wikimedia.org/wikipedia/en/b/b8/The_Oberoi_Madina.JPG", HOTEL_BRAND_LOGOS.oberoi),
    brandAccent: "#1E3A5F",
    description:
      "Luxury Oberoi property directly facing Masjid al-Nabawi.",
    amenities: ["Luxury suites", "Fine dining", "Spa", "Prayer facilities", "Free WiFi"],
  },
  {
    id: "anwar-movenpick",
    name: "Anwar Al Madinah Mövenpick Hotel",
    city: "Madinah",
    stars: 5,
    walkMinutes: 2,
    distanceLabel: "2 min walk to Masjid al-Nabawi",
    address: "Central Zone, Al Khalidiya, Madinah 42311",
    phone: "+9668002444416",
    website: "https://movenpick.accor.com/en/middle-east/saudi-arabia/madinah/hotel-madinah-anwar.html",
    lat: 24.4678,
    lng: 39.6105,
    ...hotelPhoto("https://m.ahstatic.com/is/image/accorhotels/HCM_P_1064748?fmt=jpg&wid=800", "https://m.ahstatic.com/is/image/accorhotels/Anwar_Al_Madinah_x_i129039?fmt=jpg&wid=800"),
    brandAccent: "#E85D04",
    description:
      "5-star Mövenpick near the Ladies' Prayer Entrance with shopping nearby.",
    amenities: ["Near ladies entrance", "Mall access", "Restaurants", "Prayer facilities", "Free WiFi"],
  },
  {
    id: "hilton-madinah",
    name: "Hilton Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min walk to Masjid al-Nabawi",
    address: "King Fahd Road, Bada'ah, Madinah 41419",
    phone: "+966148209999",
    website: "https://www.hilton.com/en/hotels/medhihi-madinah-hilton/",
    lat: 24.47205,
    lng: 39.61064,
    ...hotelPhoto("https://media.iceportal.com/60037/photos/74116233_XL.jpg", "https://media.iceportal.com/60037/photos/74116245_XL.jpg"),
    brandAccent: "#1B4F9C",
    description:
      "Classic Hilton opposite Masjid al-Nabawi on King Fahd Road.",
    amenities: ["Opposite Nabawi", "Restaurants", "Business centre", "Free WiFi"],
  },
  {
    id: "dar-al-taqwa",
    name: "Dar Al Taqwa Hotel",
    city: "Madinah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min · facing King Fahd Gate",
    address: "Off Al Sitteen Street, facing King Fahd Gate 23, Madinah 42311",
    phone: "+966148291111",
    website: "https://www.taqwamadinah.com",
    lat: 24.4685,
    lng: 39.6120,
    ...hotelLogo(HOTEL_BRAND_LOGOS.generic),
    brandAccent: "#1E3A5F",
    description:
      "5-star hotel facing King Fahd Gate of Masjid al-Nabawi.",
    amenities: ["Facing Nabawi gate", "Restaurant", "Lobby shop", "Free WiFi"],
  },
  {
    id: "crowne-plaza-madinah",
    name: "Crowne Plaza Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 5,
    distanceLabel: "5 min walk to Masjid al-Nabawi",
    address: "King Faisal Road, Central Area, Madinah 42311",
    phone: "+966148185000",
    website: "https://www.ihg.com/crowneplaza/hotels/us/en/madinah/medin/hoteldetail",
    lat: 24.4660,
    lng: 39.6100,
    ...hotelPhoto("https://www.cfmedia.vfmleonardo.com/imageRepo/6/0/102/264/764/MEDIN_1774790826_R.jpg", HOTEL_BRAND_LOGOS.ihg),
    brandAccent: "#6B2D5B",
    description:
      "IHG Crowne Plaza near Bab Al Salam with Haram-view rooms.",
    amenities: ["Haram view rooms", "Restaurants", "Meeting rooms", "Gym access", "Free WiFi"],
  },
  {
    id: "al-masa-madinah",
    name: "Al Masa Hotel Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 4,
    distanceLabel: "4 min walk to Masjid al-Nabawi",
    address: "Central Area near Masjid al-Nabawi, Madinah 42311",
    phone: "+966148260000",
    website: "https://www.daraleiman.com",
    lat: 24.4688,
    lng: 39.6118,
    ...hotelLogo(HOTEL_BRAND_LOGOS.generic),
    brandAccent: "#1E3A5F",
    description:
      "Well-known pilgrim hotel in the central zone near Masjid al-Nabawi.",
    amenities: ["Restaurant", "Prayer area", "24hr reception", "Free WiFi"],
  },
  {
    id: "shaza-madinah",
    name: "Shaza Al Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 5,
    distanceLabel: "5 min walk to Masjid al-Nabawi",
    address: "King Fahad Road, Central Area, Madinah 41476",
    phone: "+966148290001",
    website: "https://www.shazahotels.com/en/our-hotels/shaza-al-madina",
    lat: 24.4675,
    lng: 39.6095,
    ...hotelPhoto("https://upload.wikimedia.org/wikipedia/commons/8/8f/Shaza_Al_Madina_Hotel_Exterior.jpg", "https://cf.bstatic.com/xdata/images/hotel/max1024x768/656395009.jpg?k=1dc195f7d4edd1a7536cad824cb5ffdaf00c4ae761856b2cf001033e3e14a6cf&o="),
    brandAccent: "#C9A84C",
    description:
      "Luxury Shaza hotel on King Fahad Road in the central area near Masjid al-Nabawi.",
    amenities: ["Luxury rooms", "Fine dining", "Spa", "Meeting rooms", "Free WiFi"],
  },
  {
    id: "marriott-madinah",
    name: "Marriott Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 10,
    distanceLabel: "10 min walk to Masjid al-Nabawi",
    address: "King Faisal Road, opposite Madinah Governor Office, Madinah 41476",
    phone: "+966148180000",
    website: "https://www.marriott.com/en-us/hotels/medmc-madinah-marriott-hotel/overview/",
    lat: 24.4645,
    lng: 39.6080,
    ...hotelLogo(HOTEL_BRAND_LOGOS.marriott),
    brandAccent: "#A81C1C",
    description:
      "Madinah Marriott on King Faisal Road with full Marriott amenities.",
    amenities: ["Restaurants", "Meeting rooms", "Fitness centre", "Free WiFi"],
  },
  {
    id: "radisson-blu-madinah",
    name: "Radisson Blu Hotel Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 8,
    distanceLabel: "8 min walk to Masjid al-Nabawi",
    address: "Abu Ubaida Ibn Al Jarrah Street, off King Fahd Road, Madinah 42311",
    phone: "+966148291010",
    website: "https://www.radissonhotels.com/en-us/hotels/radisson-blu-madinah",
    lat: 24.4705,
    lng: 39.6140,
    ...hotelLogo(HOTEL_BRAND_LOGOS.radissonBlu),
    brandAccent: "#003B70",
    description:
      "Radisson Blu (Al Muna Kareem) near King Fahd Road, a short walk from Masjid al-Nabawi.",
    amenities: ["Restaurants", "Meeting rooms", "Fitness centre", "Free WiFi"],
  },
  {
    id: "sheraton-madinah",
    name: "Sheraton Al Madinah Hotel",
    city: "Madinah",
    stars: 5,
    walkMinutes: 12,
    distanceLabel: "12 min walk · northwest central zone",
    address: "Northwest Central Area, Madinah 42311",
    phone: "+966148180800",
    website: "https://www.marriott.com/en-us/destination/saudi-arabia/madinah.mi",
    lat: 24.4712,
    lng: 39.6058,
    ...hotelLogo(HOTEL_BRAND_LOGOS.sheraton),
    brandAccent: "#1B4F9C",
    description:
      "Sheraton landmark hotel in central Madinah within walking distance of Masjid al-Nabawi.",
    amenities: ["Restaurants", "Meeting facilities", "Free WiFi"],
  },

  // ═══════════════════════════════════════════
  // MADINAH · 4-Star
  // ═══════════════════════════════════════════
  {
    id: "al-shohada",
    name: "Al Shohada Hotel",
    city: "Madinah",
    stars: 4,
    walkMinutes: 8,
    distanceLabel: "8 min walk to Masjid al-Nabawi",
    address: "Sayyid Al Shohadaa Street, Madinah 42313",
    phone: "+966148227222",
    website: "https://www.google.com/maps/search/?api=1&query=Al+Shohada+Hotel+Madinah",
    lat: 24.4725,
    lng: 39.6155,
    ...hotelLogo(HOTEL_BRAND_LOGOS.generic),
    brandAccent: "#1E3A5F",
    description:
      "Well-known pilgrim hotel on Sayyid Al Shohadaa Street near Masjid al-Nabawi.",
    amenities: ["Restaurant", "24hr reception", "Prayer area", "Free WiFi"],
  },
  {
    id: "al-haram-madinah",
    name: "Al Haram Hotel Madinah",
    city: "Madinah",
    stars: 4,
    walkMinutes: 5,
    distanceLabel: "5 min walk to Masjid al-Nabawi",
    address: "Central Area near Masjid an-Nabawi, Madinah 42311",
    phone: "+966148261000",
    website: "https://www.daraleiman.com",
    lat: 24.4680,
    lng: 39.6135,
    ...hotelLogo(HOTEL_BRAND_LOGOS.generic),
    brandAccent: "#1E3A5F",
    description:
      "Pilgrim-focused hotel in the central Madinah zone within walking distance of Masjid al-Nabawi.",
    amenities: ["Restaurant", "Prayer area", "24hr reception", "Free WiFi"],
  },
  {
    id: "dallah-taibah",
    name: "Dallah Taibah Hotel",
    city: "Madinah",
    stars: 4,
    walkMinutes: 8,
    distanceLabel: "8 min walk to Masjid al-Nabawi",
    address: "Abi Zar Street, Markaziah, Madinah 42311",
    phone: "+966148290055",
    website: "https://www.dallahtaibah.com",
    lat: 24.4695,
    lng: 39.6075,
    ...hotelPhoto("https://www.dallahtaibah.com/wp-content/uploads/2022/03/MainPage1.jpg", HOTEL_BRAND_LOGOS.dallah),
    brandAccent: "#1E3A5F",
    description:
      "Dallah Taibah on Abi Zar Street in the central district near Masjid al-Nabawi.",
    amenities: ["Restaurant", "Prayer facilities", "Family rooms", "Free WiFi"],
  },
  {
    id: "anwar-al-madinah",
    name: "Anwar Al Madinah Hotel",
    city: "Madinah",
    stars: 4,
    walkMinutes: 3,
    distanceLabel: "3 min walk to Masjid al-Nabawi",
    address: "Central Zone, Al Khalidiya, Madinah 42311",
    phone: "+966148220000",
    website: "https://movenpick.accor.com/en/middle-east/saudi-arabia/madinah/hotel-madinah-anwar.html",
    lat: 24.4670,
    lng: 39.6108,
    ...hotelLogo(HOTEL_BRAND_LOGOS.movenpick),
    brandAccent: "#E85D04",
    description:
      "Central-zone hotel near the Anwar Al Madinah complex and Masjid al-Nabawi.",
    amenities: ["Restaurant", "Shopping nearby", "Free WiFi"],
  },
  {
    id: "saja-madinah",
    name: "Saja Al Madinah Hotel",
    city: "Madinah",
    stars: 4,
    walkMinutes: 5,
    distanceLabel: "5 min walk to Masjid al-Nabawi",
    address: "King Faisal Street, Northern Central Zone, Madinah 42311",
    phone: "+966148404040",
    website: "https://www.warwickhotels.com/saja-by-warwick-madinah",
    lat: 24.4710,
    lng: 39.6125,
    ...hotelLogo(HOTEL_BRAND_LOGOS.generic),
    brandAccent: "#1E3A5F",
    description:
      "Popular 4-star pilgrim hotel (Saja by Warwick) within walking distance of Masjid al-Nabawi.",
    amenities: ["Restaurant", "Prayer area", "24hr reception", "Free WiFi"],
  },
]

export type HotelSection = {
  city: HotelCity
  stars: 4 | 5
  title: string
  hotels: Hotel[]
}

export function getHotelById(id: string | undefined): Hotel | undefined {
  if (!id) return undefined
  return HOTELS.find(h => h.id === id)
}

export function filterHotels(options: {
  search?: string
  city?: "All" | HotelCity
  stars?: "All" | 4 | 5
}): Hotel[] {
  const { search = "", city = "All", stars = "All" } = options
  const q = search.trim().toLowerCase()

  return HOTELS.filter(hotel => {
    if (city !== "All" && hotel.city !== city) return false
    if (stars !== "All" && hotel.stars !== stars) return false
    if (q && !hotel.name.toLowerCase().includes(q) && !hotel.address.toLowerCase().includes(q)) {
      return false
    }
    return true
  })
}

/** Group filtered hotels into Makkah 5-Star | Makkah 4-Star | Madinah 5-Star | Madinah 4-Star */
export function groupHotelsIntoSections(hotels: Hotel[]): HotelSection[] {
  const sections: HotelSection[] = [
    { city: "Makkah", stars: 5, title: "Makkah 5-Star", hotels: [] },
    { city: "Makkah", stars: 4, title: "Makkah 4-Star", hotels: [] },
    { city: "Madinah", stars: 5, title: "Madinah 5-Star", hotels: [] },
    { city: "Madinah", stars: 4, title: "Madinah 4-Star", hotels: [] },
  ]

  for (const hotel of hotels) {
    const section = sections.find(s => s.city === hotel.city && s.stars === hotel.stars)
    section?.hotels.push(hotel)
  }

  return sections.filter(s => s.hotels.length > 0)
}

/** Prefer place name + address so Maps resolves the real venue (not a nearby approximate pin). */
function hotelPlaceQuery(hotel: Hotel) {
  const parts = [hotel.name, hotel.address || hotel.city, "Saudi Arabia"].filter(Boolean)
  return parts.join(", ")
}

export function openHotelDirections(hotel: Hotel) {
  const query = hotelPlaceQuery(hotel)
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=walking`
}

export function openHotelDirectionsApple(hotel: Hotel) {
  const query = hotelPlaceQuery(hotel)
  return `http://maps.apple.com/?daddr=${encodeURIComponent(query)}&dirflg=w`
}

export function formatPhoneDisplay(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "")
  if (digits.startsWith("+966")) {
    const rest = digits.slice(4)
    if (rest.length >= 9) {
      return `+966 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`
    }
  }
  return phone
}
