export type HotelCity = "Makkah" | "Madinah"

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
  description: string
  amenities: string[]
}

export const HOTELS: Hotel[] = [
  // ═══════════════════════════════════════════
  // MAKKAH · 5★ · Abraj Al-Bait (directly connected)
  // ═══════════════════════════════════════════
  {
    id: "fairmont-clock",
    name: "Fairmont Makkah Clock Royal Tower",
    city: "Makkah",
    stars: 5,
    walkMinutes: 1,
    distanceLabel: "1 min · Abraj Al-Bait",
    address: "King Abdul Aziz Endowment, Abraj Al Bait Complex, Makkah 21955",
    phone: "+966125717777",
    website: "https://www.fairmont.com/makkah/",
    lat: 21.4180,
    lng: 39.8252,
    image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400",
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
    address: "King Abdul Aziz Endowment, Ajyad Street, Abraj Al Bait, Makkah",
    phone: "+966125718222",
    website: "https://www.swissotel.com/hotels/makkah/",
    lat: 21.4185,
    lng: 39.8258,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
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
    website: "https://pullman.accor.com/en/hotels/makkah/6036.html",
    lat: 21.4183,
    lng: 39.8261,
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400",
    description:
      "Modern Pullman hotel inside the Clock Towers complex, steps from the Holy Mosque.",
    amenities: ["Family rooms", "Restaurants", "Prayer facilities", "Shopping access", "Free WiFi"],
  },
  {
    id: "conrad-makkah",
    name: "Conrad Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min · Abraj / Jabal Omar",
    address: "Jabal Omar, Ibrahim Al Khalil Road, Makkah 21955",
    phone: "+966125267700",
    website: "https://www.hilton.com/en/hotels/makcici-conrad-jabal-omar-makkah/",
    lat: 21.4195,
    lng: 39.8228,
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400",
    description:
      "Luxury Conrad hotel minutes from Masjid al-Haram with Haram and Kaaba views.",
    amenities: ["Haram views", "Spa", "Fine dining", "Fitness centre", "Free WiFi"],
  },
  {
    id: "raffles-makkah",
    name: "Raffles Makkah Palace",
    city: "Makkah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min · Abraj Al-Bait",
    address: "King Abdul Aziz Endowment, Abraj Al Bait, Makkah 21955",
    phone: "+966125717800",
    website: "https://all.accor.com/hotel/A5E4/index.en.shtml",
    lat: 21.4179,
    lng: 39.8250,
    image: "https://images.unsplash.com/photo-1551882547-ff40c4a49f7e?w=400",
    description:
      "Ultra-luxury all-suite Raffles hotel in the Clock Towers with direct Kaaba views.",
    amenities: ["All suites", "Kaaba views", "Fine dining", "Butler service", "Free WiFi"],
  },
  {
    id: "hilton-suites-makkah",
    name: "Hilton Suites Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min · Abraj / Jabal Omar",
    address: "Jabal Omar, Ibrahim Al Khalil Road, Makkah 21955",
    phone: "+966125567000",
    website: "https://www.hilton.com/en/hotels/maksuhi-hilton-suites-jabal-omar-makkah/",
    lat: 21.4198,
    lng: 39.8235,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400",
    description:
      "Spacious Hilton suites overlooking the Haram area with shopping and dining nearby.",
    amenities: ["Suites", "Prayer hall", "Fitness centre", "Restaurants", "Free WiFi"],
  },
  {
    id: "movenpick-hajar",
    name: "Mövenpick Hajar Tower Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 4,
    distanceLabel: "4 min · Abraj Al-Bait",
    address: "The Clock Towers, Abraj Al Bait, Makkah 21955",
    phone: "+966125717171",
    website: "https://movenpick.accor.com/en/middle-east/saudi-arabia/makkah/hotel-makkah.html",
    lat: 21.4186,
    lng: 39.8255,
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400",
    description:
      "Hajar Tower residence hotel facing King Abdul Aziz Gate with Kaaba views.",
    amenities: ["Kaaba views", "Residences", "Restaurants", "Prayer facilities", "Free WiFi"],
  },

  // ═══════════════════════════════════════════
  // MAKKAH · 5★ · Under ~10 min walk
  // ═══════════════════════════════════════════
  {
    id: "dar-al-tawhid",
    name: "InterContinental Dar Al Tawhid Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 5,
    distanceLabel: "5 min walk to Masjid al-Haram",
    address: "Ibrahim Al Khalil Road, Makkah",
    phone: "+966125295000",
    website: "https://www.ihg.com/intercontinental/hotels/us/en/makkah/qcahd/hoteldetail",
    lat: 21.4210,
    lng: 39.8240,
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400",
    description:
      "Iconic InterContinental near King Fahad Gate with a private prayer hall.",
    amenities: ["Private prayer hall", "VIP lounge", "Kids club", "Restaurants", "Free WiFi"],
  },
  {
    id: "marriott-makkah",
    name: "Jabal Omar Marriott Hotel Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 5,
    distanceLabel: "5 min walk to Masjid al-Haram",
    address: "Umm Al Qura / Jabal Omar, Makkah 21955",
    phone: "+966125296666",
    website: "https://www.marriott.com/en-us/hotels/qcamc-jabal-omar-marriott-hotel-makkah/overview/",
    lat: 21.4202,
    lng: 39.8220,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
    description:
      "5-star Marriott in Jabal Omar, about a 5-minute walk to Masjid al-Haram.",
    amenities: ["Prayer hall", "Restaurants", "Meeting rooms", "Shopping mall access", "Free WiFi"],
  },
  {
    id: "sheraton-jabal",
    name: "Sheraton Makkah Jabal Al Kaaba",
    city: "Makkah",
    stars: 5,
    walkMinutes: 6,
    distanceLabel: "6 min walk to Masjid al-Haram",
    address: "Jabal Al Kaaba, Makkah 24231",
    phone: "+966125518900",
    website: "https://www.marriott.com/en-us/hotels/jedsm-sheraton-makkah-jabal-al-kaaba-hotel/overview/",
    lat: 21.4228,
    lng: 39.8195,
    image: "https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?w=400",
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
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400",
    description:
      "Hyatt Regency in the Jabal Omar development, a short walk from Masjid al-Haram.",
    amenities: ["Restaurants", "Meeting rooms", "Fitness centre", "Prayer facilities", "Free WiFi"],
  },
  {
    id: "rotana-makkah",
    name: "Al Marwa Rayhaan by Rotana",
    city: "Makkah",
    stars: 5,
    walkMinutes: 4,
    distanceLabel: "4 min · Ajyad / Clock Tower area",
    address: "Ajyad Street, Clock Tower Complex, Makkah 24231",
    phone: "+966125714444",
    website: "https://www.rotana.com/rayhaanhotelandresorts/kingdomofsaudiarabia/makkah/almarwarayhaanbyrotana",
    lat: 21.4175,
    lng: 39.8265,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400",
    description:
      "Rotana’s Al Marwa Rayhaan on Ajyad Street near the Clock Tower complex and Masjid al-Haram.",
    amenities: ["Haram-area location", "Restaurants", "Prayer facilities", "Free WiFi"],
  },
  {
    id: "al-safwah-orchid",
    name: "Al Safwah Royale Orchid Hotel",
    city: "Makkah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min · facing King Abdulaziz Gate",
    address: "Ajyad Street, opposite King Abdulaziz Gate, Makkah 24231",
    phone: "+966125768888",
    website: "https://alsafwahorchid.com.sa/",
    lat: 21.4192,
    lng: 39.8268,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400",
    description:
      "High-rise hotel facing King Abdulaziz Gate of Masjid al-Haram with Kaaba-view rooms.",
    amenities: ["Kaaba / Haram views", "Restaurants", "Business centre", "Free WiFi"],
  },
  {
    id: "anjum-makkah",
    name: "Anjum Hotel Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 7,
    distanceLabel: "7 min walk to Masjid al-Haram",
    address: "Ibrahim Al Khalil Road, Makkah",
    phone: "+966125727000",
    website: "https://www.google.com/maps/search/?api=1&query=Anjum+Hotel+Makkah",
    lat: 21.4235,
    lng: 39.8210,
    image: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=400",
    description:
      "Well-known 5-star pilgrim hotel on Ibrahim Al Khalil Road near Masjid al-Haram.",
    amenities: ["Restaurants", "Prayer facilities", "Family rooms", "Free WiFi"],
  },
  {
    id: "radisson-blu-makkah",
    name: "Radisson Blu Hotel Makkah",
    city: "Makkah",
    stars: 5,
    walkMinutes: 12,
    distanceLabel: "12 min by taxi · Aziziyah",
    address: "Al Hidaya Complex, Aziziyah District, Makkah",
    phone: "+966125477000",
    website: "https://www.radissonhotels.com/en-us/hotels/radisson-blu-makkah",
    lat: 21.4050,
    lng: 39.8450,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
    description:
      "Large Radisson Blu property in Aziziyah — typically reached by a short taxi ride to the Haram.",
    amenities: ["Restaurants", "Shopping gallery", "Meeting rooms", "Free WiFi"],
  },

  // ═══════════════════════════════════════════
  // MAKKAH · 4★
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
    image: "https://images.unsplash.com/photo-1587213811864-c84bfc8c9838?w=400",
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
    address: "Al Mesial Street, Misfalah, Makkah",
    phone: "+966125743535",
    website: "https://elafgroup.com/hotel/elaf-kinda/",
    lat: 21.4168,
    lng: 39.8275,
    image: "https://images.unsplash.com/photo-1551882547-ff40c4a49f7e?w=400",
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
    distanceLabel: "15 min · Mahbas Al-Jin / Aziziyah",
    address: "Mahbas Al-Jin, Al-Azizyah, Makkah",
    phone: "+966122116444",
    website: "https://elafgroup.com/hotel/elaf-bakkah/",
    lat: 21.4080,
    lng: 39.8480,
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400",
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
    image: "https://images.unsplash.com/photo-1461696114087-397271a7aedc?w=400",
    description:
      "Comfortable Millennium hotel in Al Naseem on the 3rd Ring Road.",
    amenities: ["Restaurants", "Parking", "Meeting rooms", "Free WiFi"],
  },
  {
    id: "makkah-millennium",
    name: "Makkah Millennium Hotel",
    city: "Makkah",
    stars: 4,
    walkMinutes: 18,
    distanceLabel: "18 min by taxi to Masjid al-Haram",
    address: "Makkah, near 3rd Ring Road",
    phone: "+966125509700",
    website: "https://www.millenniumhotels.com/en/destination/saudi-arabia/makkah/",
    lat: 21.3920,
    lng: 39.8480,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
    description:
      "Millennium Hotels property serving pilgrims with shuttle/taxi access to the Haram.",
    amenities: ["Restaurants", "Parking", "Free WiFi"],
  },

  // ═══════════════════════════════════════════
  // MADINAH · 5★ · Under ~5 min walk
  // ═══════════════════════════════════════════
  {
    id: "oberoi-madinah",
    name: "Oberoi Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 1,
    distanceLabel: "1 min · facing Masjid al-Nabawi",
    address: "Abizar Road, Madinah",
    phone: "+966148282222",
    website: "https://www.oberoihotels.com/hotels-in-madina/",
    lat: 24.4690,
    lng: 39.6085,
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400",
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
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400",
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
    address: "King Fahd Street, opposite Prophet's Mosque, Madinah 41419",
    phone: "+966148219100",
    website: "https://www.hilton.com/en/hotels/medhihi-madinah-hilton/",
    lat: 24.4672,
    lng: 39.6112,
    image: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=400",
    description:
      "Classic Hilton opposite Masjid al-Nabawi on King Fahd Street.",
    amenities: ["Opposite Nabawi", "Restaurants", "Business centre", "Free WiFi"],
  },
  {
    id: "dar-al-taqwa",
    name: "Dar Al Taqwa Hotel",
    city: "Madinah",
    stars: 5,
    walkMinutes: 3,
    distanceLabel: "3 min walk to Masjid al-Nabawi",
    address: "Off Al Sitteen Street, facing King Fahd Gate 23, Madinah",
    phone: "+966148291111",
    website: "https://taqwamadinah.com",
    lat: 24.4685,
    lng: 39.6120,
    image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=400",
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
    address: "King Faisal Street, between 1st Ring Road, Madinah",
    phone: "+966148185000",
    website: "https://www.ihg.com/crowneplaza/hotels/us/en/madinah/medin/hoteldetail",
    lat: 24.4660,
    lng: 39.6100,
    image: "https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=400",
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
    address: "Central Area near Masjid al-Nabawi, Madinah",
    phone: "+966148260000",
    website: "https://www.google.com/maps/search/?api=1&query=Al+Masa+Hotel+Madinah",
    lat: 24.4688,
    lng: 39.6118,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400",
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
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400",
    description:
      "Luxury Shaza hotel on King Fahad Road in the central area near Masjid al-Nabawi.",
    amenities: ["Luxury rooms", "Fine dining", "Spa", "Meeting rooms", "Free WiFi"],
  },

  // ═══════════════════════════════════════════
  // MADINAH · 5★ · 5–15 min walk
  // ═══════════════════════════════════════════
  {
    id: "marriott-madinah",
    name: "Marriott Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 10,
    distanceLabel: "10 min walk to Masjid al-Nabawi",
    address: "King Faisal Street, opposite Madinah Governor Office, Madinah 41476",
    phone: "+966148180000",
    website: "https://www.marriott.com/en-us/hotels/medmc-madinah-marriott-hotel/overview/",
    lat: 24.4645,
    lng: 39.6080,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    description:
      "Madinah Marriott on King Faisal Street with full Marriott amenities.",
    amenities: ["Restaurants", "Meeting rooms", "Fitness centre", "Free WiFi"],
  },
  {
    id: "radisson-blu-madinah",
    name: "Radisson Blu Hotel Madinah",
    city: "Madinah",
    stars: 5,
    walkMinutes: 8,
    distanceLabel: "8 min walk to Masjid al-Nabawi",
    address: "Abu Ubaida Ibn Al Jarrah, off King Fahd Street, Madinah",
    phone: "+966148291010",
    website: "https://www.radissonhotels.com/en-us/hotels/radisson-blu-madinah",
    lat: 24.4705,
    lng: 39.6140,
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400",
    description:
      "Radisson Blu (Al Muna Kareem) near King Fahd Street, a short walk from Masjid al-Nabawi.",
    amenities: ["Restaurants", "Meeting rooms", "Fitness centre", "Free WiFi"],
  },
  {
    id: "sheraton-madinah",
    name: "Sheraton Al Madinah Hotel",
    city: "Madinah",
    stars: 5,
    walkMinutes: 12,
    distanceLabel: "12 min walk to Masjid al-Nabawi",
    address: "King Fahd Road area, Madinah",
    phone: "+966148180800",
    website: "https://www.marriott.com/en-us/destination/saudi-arabia/madinah.mi",
    lat: 24.4655,
    lng: 39.6155,
    image: "https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?w=400",
    description:
      "Sheraton / Marriott-branded stay in Madinah within walking distance of Masjid al-Nabawi.",
    amenities: ["Restaurants", "Meeting facilities", "Free WiFi"],
  },

  // ═══════════════════════════════════════════
  // MADINAH · 4★
  // ═══════════════════════════════════════════
  {
    id: "al-shohada",
    name: "Al Shohada Hotel",
    city: "Madinah",
    stars: 4,
    walkMinutes: 5,
    distanceLabel: "5 min walk to Masjid al-Nabawi",
    address: "Sayyid Al Shohadaa Street, Madinah 42313",
    phone: "+966148227222",
    website: "https://www.google.com/maps/search/?api=1&query=Al+Shohada+Hotel+Madinah",
    lat: 24.4725,
    lng: 39.6155,
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400",
    description:
      "Well-known pilgrim hotel on Sayyid Al Shohadaa Street near Masjid al-Nabawi.",
    amenities: ["Restaurant", "24hr reception", "Prayer area", "Free WiFi"],
  },
  {
    id: "al-haram-madinah",
    name: "Al Haram Hotel Madinah",
    city: "Madinah",
    stars: 4,
    walkMinutes: 7,
    distanceLabel: "7 min walk to Masjid al-Nabawi",
    address: "Central Area near Masjid an-Nabawi, Madinah",
    phone: "+966148261000",
    website: "https://www.google.com/maps/search/?api=1&query=Al+Haram+Hotel+Madinah",
    lat: 24.4680,
    lng: 39.6135,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400",
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
    address: "Abi Zar Street, Markaziah, Madinah",
    phone: "+966148290055",
    website: "https://www.google.com/maps/search/?api=1&query=Dallah+Taibah+Hotel+Madinah",
    lat: 24.4695,
    lng: 39.6075,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400",
    description:
      "Dallah Taibah on Abi Zar Street in the central district near Masjid al-Nabawi.",
    amenities: ["Restaurant", "Prayer facilities", "Family rooms", "Free WiFi"],
  },
  {
    id: "anwar-al-madinah",
    name: "Anwar Al Madinah Hotel",
    city: "Madinah",
    stars: 4,
    walkMinutes: 6,
    distanceLabel: "6 min walk to Masjid al-Nabawi",
    address: "Central Zone, Madinah",
    phone: "+966148220000",
    website: "https://www.google.com/maps/search/?api=1&query=Anwar+Al+Madinah+Hotel",
    lat: 24.4670,
    lng: 39.6108,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400",
    description:
      "Central-zone hotel near the Anwar Al Madinah complex and Masjid al-Nabawi.",
    amenities: ["Restaurant", "Shopping nearby", "Free WiFi"],
  },
  {
    id: "saja-madinah",
    name: "Saja Al Madinah Hotel",
    city: "Madinah",
    stars: 4,
    walkMinutes: 9,
    distanceLabel: "9 min walk to Masjid al-Nabawi",
    address: "Central Area, Madinah",
    phone: "+966148225555",
    website: "https://www.google.com/maps/search/?api=1&query=Saja+Al+Madinah+Hotel",
    lat: 24.4710,
    lng: 39.6125,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
    description:
      "Popular 4-star pilgrim hotel within walking distance of Masjid al-Nabawi.",
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

/** Group filtered hotels into Makkah 5★ | Makkah 4★ | Madinah 5★ | Madinah 4★ */
export function groupHotelsIntoSections(hotels: Hotel[]): HotelSection[] {
  const sections: HotelSection[] = [
    { city: "Makkah", stars: 5, title: "Makkah 5★", hotels: [] },
    { city: "Makkah", stars: 4, title: "Makkah 4★", hotels: [] },
    { city: "Madinah", stars: 5, title: "Madinah 5★", hotels: [] },
    { city: "Madinah", stars: 4, title: "Madinah 4★", hotels: [] },
  ]

  for (const hotel of hotels) {
    const section = sections.find(s => s.city === hotel.city && s.stars === hotel.stars)
    section?.hotels.push(hotel)
  }

  return sections.filter(s => s.hotels.length > 0)
}

export function openHotelDirections(hotel: Hotel) {
  const lat = Number(hotel.lat)
  const lng = Number(hotel.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name)}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`
}

export function openHotelDirectionsApple(hotel: Hotel) {
  const lat = Number(hotel.lat)
  const lng = Number(hotel.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return `http://maps.apple.com/?q=${encodeURIComponent(hotel.name)}`
  }
  return `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
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
