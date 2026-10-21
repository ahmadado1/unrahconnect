// What the AI Guide knows about the app and the website.
// Update this file whenever features change, then redeploy:
//   npx supabase@latest functions deploy ai-guide --project-ref yqabuipymbaylholmmoi
// The hotel list comes from hotelKnowledge.ts (made from the app's hotel list).
import { hotelKnowledge } from "./hotelKnowledge.ts"

export const appKnowledge = `
WHAT UMRAHCONNECT IS
UmrahConnect is an Umrah and Hajj companion app for iPhone and Android, with a website at myumrahconnect.com. Tagline: "Your complete Umrah & Hajj companion." It was made by Ahmad Ado Muktar (founder and developer), based in Egypt. The About Us screen says "Made in Egypt."
Most of the app is free. UmrahConnect Premium is an optional subscription that adds extra features (see PREMIUM). All Quran audio is free for everyone.
The app is a guide and a middleman for travel. It does not sell Umrah or Hajj packages. Hotels, flights, eSIMs, and licensed travel agents are booked on the partner's own site, at that partner's normal prices. Partners: Booking.com for hotels, Aviasales for flights, Saily and Airalo for eSIM, and licensed agents listed in the app. The only payments UmrahConnect takes are for Premium and for agency listings.
Languages in the app: English, العربية, বাংলা, Français, اردو, Türkçe. Arabic and Urdu use right-to-left layout. Hausa is not an app language.
You can use much of the app without an account. An account saves your profile, favorites, Umrah and Hajj progress, Quran bookmarks, and Premium.

TABS AND WHERE THINGS ARE
Bottom tabs: Home, Guide, Maps, Services, Me.
Home: greeting, search, and the AI button. Next Prayer countdown. Umrah journey card (Premium users see the UmrahConnect Guide or Trip Planner card instead). A "Get Premium" card for free users. Morning and Evening Adhkar cards at their times. Quran card (start or continue reading) and the Quran player. Islamic calendar. Quick Access. A Maidabo Foundation card ("Learn more" opens maidabofoundation.com; it is not a donate button). My Bookings, if any.
Guide: prayer times and the Adhan voice button (headset). Cards: Umrah Guide, Hajj Guide, Quran Reader, Listen to the Quran, Al-Kahf (Thursday Maghrib to Friday Isha), Al-Mulk, AI Guide ("Ask anything"), Islamic Dates, Qibla Direction.
Maps: My Location, Sites (Masjid Al-Haram, Masjid Nabawi, Mina, Arafah, Zamzam Well, Safa and Marwah, Lost & Found), Makkah Places to See (including Abraj Al Bait Mall and the Clock Tower Museum). The Offline Map of Makkah and Madinah is Premium.
Services: search button. Big cards: Hotels near the Haram, Aviasales flights, Saily eSIM, Airalo, Restaurants (food), Find an Agent. Then Hospitals, Transport, Shopping. "Book a Stay" is Coming soon.
Me: name and email, then UmrahConnect Premium, Profile, Favorites, Agency Dashboard (agents only), App guide, Notifications, Settings, Rate the app, About Us, Contact Us, Logout.
App guide (Me → App guide): a short checklist of the most useful features: prayer times, Quran, Quran audio, dhikr, adhkar, duas, AI Guide, then Umrah guide and Qibla.

PREMIUM
Where: Me → UmrahConnect Premium, the "Get Premium" card on Home, or "See Premium" on any locked feature.
Premium adds: 3 more Adhan voices (Sheikh Muhammad Marwan Qassas, Sheikh Ali Ahmed Mulla, Sheikh Farooq Al-Hadrawi); all Mushaf fonts; Trip Planner (trip dates countdown and checklist, unlocks on Home after the UmrahConnect guide); Offline Map of Makkah and Madinah; guided Al-Kahf, Al-Mulk and Friday Salawat reminders; unlimited AI Guide (free users get 12 questions every 7 days).
Free for everyone: prayer times and Adhan (3 voices, full Adhan), the Quran with all reciters, verse-by-verse audio, whole surahs, downloads, tafsir, the Umrah and Hajj guides, duas, adhkar, tasbih, Qibla, maps, hotels and all services.
Plans: Monthly and Yearly. In the app you subscribe on the Premium screen and pay with Apple (App Store) or Google Play; the Premium screen shows the price in your own currency. Never quote other prices.
STORE RULE (very important): inside the app, never tell people to buy or pay for Premium on the website, and never give website prices, payment links, or OPay, MyNita or PayPal steps for Premium. Only point them to the Premium screen in the app. If someone already has Premium on their UmrahConnect account, say: log in with the same account and it unlocks automatically.
Premium on the account works everywhere: on any phone where you log in to the same account.
Restore: on the Premium screen tap "Restore purchases" (for a new phone or after reinstalling).
Cancel or manage: on the Premium screen tap "Manage subscription", or on iPhone Settings → your name → Subscriptions, on Android Google Play → Payments & subscriptions. Cancel at least 24 hours before renewal.
Never promise refunds. Apple and Google handle refunds for in-app purchases; other payment questions go to support@myumrahconnect.com.

FEATURES
Umrah steps (Guide → Umrah Guide). Seven phases with duas, tips and progress: 1 Madinah Visit, 2 Entering Ihram, 3 Arriving in Makkah, 4 Tawaf, 5 Sa'i, 6 Halq / Taqsir, 7 Umrah Complete. Includes Madinah places to visit with hadith references.
Hajj steps (Guide → Hajj Guide). Nine phases: 1 Preparation & Ihram, 2 Arriving in Makkah, 3 Day of Tarwiyah (Mina), 4 Day of Arafah, 5 Muzdalifah, 6 Day of Eid (Jamarat), 7 Days of Tashreeq, 8 Tawaf Al-Wadaa, 9 Hajj Complete.
Duas, dhikr and tasbih: Home → Quick Access → Duas. Includes the Tasbih Counter.
Adhkar: Morning Adhkar and Evening Adhkar.
Prayer times and Adhan: Home and Guide, based on your location. Voices: Sheikh Abdul Basit Abdus Samad, Sheikh Ahmad Al-Trablsy, Sheikh Mishary Rashid Alafasy (free), plus Qassas, Ali Mulla and Hadrawi (Premium). Fajr uses each sheikh's Fajr Adhan.
Full Adhan: Android plays the whole Adhan with a Stop button. iPhone allows only 30 seconds per notification sound, so the app plays the whole Adhan in parts, one after another. You may see the notification repeat while it plays; tap Stop Adhan or swipe it away to stop. The first time, the app downloads the parts for your voice (a few MB) while you have internet. Test it in Me → Notifications → Test full Adhan, then lock the phone.
Quran Reader (Guide → Quran Reader): Mushaf View (page by page) and Verse View (Arabic plus translation). Surah list, search, Go to, Bookmarks, Last read. Mushaf settings drawer: font, text size, reading view.
Quran audio (free): Guide → Listen to the Quran, or the player on Home. Choose a reciter and play whole surahs. In Verse View tap a verse's play button to hear that verse; it stops after the verse. Audio keeps playing on the lock screen with controls. Download a surah for offline listening with the Download button at the top of the surah in Read mode or in the player.
Tafsir: in Verse View tap the tafsir button on a verse. Trusted tafsirs per language, for example Ibn Kathir (English, Arabic, Urdu, Turkish, Bengali), Al-Mukhtasar, As-Sa'di, Al-Muyassar (Arabic). French has Al-Mukhtasar. Each surah's tafsir is saved for offline after the first time.
About this surah: the info button at the top of a surah shows where it was revealed, number of verses and a short introduction.
Offline Quran: mushaf pages and your language's translation download in the background ("Downloading Quran..." bar on Guide). After that, reading works without internet.
Qibla: Guide → Qibla Direction. Uses location and the compass.
Reminders: Me → Notifications. Prayer Adhan on or off per prayer, Morning and Evening Adhkar reminders, Islamic Dates, Al-Kahf and Al-Mulk reminders.
Hotels: Services → Hotels near the Haram. Switch Makkah / Madinah at the top. Sections: Featured (top hotels next to the Haram, the Clock Tower and next to Al-Masjid an-Nabawi), 5 Star, 4 Star, Budget Friendly (cheaper hotels, some a bit far with a shuttle bus). Walking filters 5, 10, 15 minutes. Search understands words like cheap, 5 star, near, shuttle, clock tower, a brand (Hilton, Mövenpick, Swissotel) or a hotel name, even with small typos. Add trip dates to see Booking.com prices for your dates. Book now finishes on Booking.com; UmrahConnect does not charge you.
Flights: Services → Aviasales. From, To (Jeddah, Madinah, or another city), Depart, Return, passengers, Search flights. Booking is on Aviasales. Never quote a fare.
eSIM: Services → Saily eSIM (Get eSIM) or Airalo (View Airalo plans). Bought on their site.
Restaurants, Transport (Haramain train, SAPTCO, Uber), Hospitals (and pharmacies like Nahdi), Shopping: in Services.
Agents: Services → Find an Agent → country → agent → Call, WhatsApp, Email, Website. Agents book on their own terms.
Favorites: Me → Favorites (hotels and restaurants, needs an account).
Language and theme: Me → Settings.
Profile and password: Me → Profile.
AI Guide: AI button on Home, or Guide → AI Guide.
Contact: Me → Contact Us. WhatsApp and phone +201222151335, info@myumrahconnect.com, support@myumrahconnect.com.
Not in the app: selling packages, Hausa, "Book a Stay" (Coming soon). If a feature is not listed here, it is not available yet.

FOR TRAVEL AGENCIES
Agencies can be listed in Find an Agent. Agencies apply and manage their listing at myumrahconnect.com/agents. Do not give agency prices or payment steps in the app; say the details are on the agencies page of the website. Listing goes live after checks. Agents also get an Agency Dashboard in the app (Me → Agency Dashboard) with clients, referral code and bookings. Pilgrims can enter an agent code in Me → Profile.

HOW TO
Sign up: login screen → Create Account. Full name, I am (Male or Female), Email, password (at least 6 characters). Or Continue with Google, Apple (iPhone) or phone.
Log in: Email and Password → Login, or Google / Apple / phone.
Reset password: Login → Forgot password?, enter email, enter the code, set a new password. While logged in: Me → Profile → Change Password.
Change language: Me → Settings → Language.
Set the Adhan voice: Guide → headset button → Choose Adhan → Preview → Select → Done. Premium voices show a lock for free users.
Get Premium: Me → UmrahConnect Premium → choose Monthly or Yearly → Subscribe → confirm with Apple or Google.
Restore Premium on a new phone: Me → UmrahConnect Premium → Restore purchases (same Apple ID or Google account), and log in to the same UmrahConnect account.
Listen to a surah offline: open the surah in Read mode or the player → Download. Downloaded surahs play without internet.
Read a tafsir: Quran Reader → Verse View → tafsir button on the verse → pick a tafsir at the top if there are several.
Find the Qibla: Guide → Qibla Direction, allow location, hold the phone flat and turn.
Book a hotel: Services → Hotels near the Haram → choose Makkah or Madinah → pick a hotel → Book now → finish on Booking.com.
Delete your account: Me → Profile → Delete Account, choose a reason. Or email info@myumrahconnect.com with subject "Delete My Account" (done within 30 days). Cancel any App Store / Google Play subscription separately in the store.

${hotelKnowledge}

WEBSITE
https://myumrahconnect.com. Home (features, screenshots, download buttons), /account (your account), /agents (for travel agencies), /hotels, /contact, /advertise, /privacy-policy, /terms, /delete-account.
Emails: info@myumrahconnect.com, support@myumrahconnect.com. WhatsApp and phone: +201222151335. Instagram: @umrahconnectapp.

STORES
App Store: https://apps.apple.com/app/id6778753426
Google Play: https://play.google.com/store/apps/details?id=com.myumrahconnect.app
To update, open the store and tap Update. To review, rate the app on the store (Me → Rate the app).

PRIVACY AND TERMS
Privacy: https://www.myumrahconnect.com/privacy-policy. Terms: https://www.myumrahconnect.com/terms. In the app: Me → Settings.
We collect name, email and language for an account; Quran progress, bookmarks and preferences; location only for prayer times, Qibla and weather (no location history). We do not sell personal data. Data is stored with Supabase. In-app purchases are handled by Apple or Google (through RevenueCat); we never see card details.
Partner bookings happen on the partner's site under their terms. Listings can be out of date. Prayer times can differ slightly from a local mosque. Religious text is for learning and worship; a personal ruling should go to a qualified scholar. You must be at least 13 to use the app.
`.trim()
