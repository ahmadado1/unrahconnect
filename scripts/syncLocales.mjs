import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const i18nDir = path.join(root, "i18n")

const phaseEn = JSON.parse(fs.readFileSync(path.join(root, "app/data/phaseI18n.en.json"), "utf8"))

const uiEn = {
  phaseNotFound: "Phase not found",
  goBack: "Go back",
  translating: "Translating...",
  getStarted: "Get Started",
  nextArrow: "Next →",
  onboardingWelcomeTitle: "Welcome to UmrahConnect",
  onboardingWelcomeSub: "Your complete Umrah companion",
  onboardingFeaturesTitle: "Hotels, Restaurants & Guide",
  onboardingFeaturesSub: "Everything you need for your blessed journey in one place",
  onboardingJourneyTitle: "Your journey starts here",
  onboardingJourneySub: "Find hotels, discover restaurants and learn Umrah step by step",
  ourMissionText: "UmrahConnect was created to be the most complete digital companion for pilgrims performing Umrah and Hajj. We believe every pilgrim deserves easy access to the best hotels, restaurants, and guidance — all in one place.",
  aboutHotelsDesc: "Curated hotels in Makkah and Madinah — from budget to luxury",
  aboutRestaurantsDesc: "The best halal restaurants near Masjid Al-Haram and Masjid Nabawi",
  aboutUmrahDesc: "Complete step by step Umrah guide with duas in Arabic and English",
  aboutHajjDesc: "Full Hajj guide covering every step of the pilgrimage",
  mallsShopping: "Malls & Shopping",
  aboutShoppingDesc: "Best shopping destinations near the Haram — coming soon",
  mosquesZiyarat: "Mosques & Ziyarat",
  aboutZiyaratDesc: "Historical mosques and sites to visit during your stay — coming soon",
  duasHome: "Home",
  duasSubtitle: "Supplications & remembrance",
  quranVerses: "Verses",
  quranPrev: "Prev",
  quranNext: "Next",
  endOfSurah: "End of {{name}}",
  hotelNotFound: "Hotel not found",
  viewOnBooking: "View on Booking.com →",
  restaurantNotFound: "Restaurant not found",
  checkOutAfterCheckIn: "Check-out must be after check-in.",
  selectDatesForTotal: "Select check-in and check-out dates to see your total.",
  bookingConfirmed: "Booking Confirmed!",
  backToHome: "Back to Home",
  searchAgents: "Search agents...",
  yearsExperience: "{{count}} years experience",
  pilgrimsManaged: "{{count}} pilgrims managed",
  islamicCalendarTitle: "Islamic Calendar",
  islamicCalendarSub: "Key dates & events 1447–1449 AH",
  calendarToday: "Today",
  calendarEvent: "Event",
  nextIslamicEvent: "NEXT ISLAMIC EVENT",
  daysAway: "days away",
  privacyIntroTitle: "Introduction",
  privacyIntroBody: "Welcome to UmrahConnect. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use and protect your information when you use our app.",
  privacyCollectTitle: "Information We Collect",
  privacyCollectBody: "We collect information you provide directly to us when you create an account, such as your name, email address, phone number and nationality. We also collect information about how you use our app including hotels and restaurants you view and save to favorites.",
  privacyUseTitle: "How We Use Your Information",
  privacyUseBody: "We use the information we collect to provide and improve our services, personalize your experience, process bookings and reservations, send you updates and notifications, and respond to your inquiries.",
  privacyStorageTitle: "Data Storage",
  privacyStorageBody: "Your data is stored securely using Supabase, a trusted cloud database provider. We use industry standard security measures to protect your personal information from unauthorized access.",
  privacySharingTitle: "Sharing Your Information",
  privacySharingBody: "We do not sell, trade or rent your personal information to third parties. We may share your information with hotel and restaurant partners only when necessary to complete a booking you have requested.",
  privacyRightsTitle: "Your Rights",
  privacyRightsBody: "You have the right to access, update or delete your personal information at any time through your Profile screen. You may also contact us directly to request changes to your data.",
  privacyContactBody: "If you have any questions about this Privacy Policy please contact us at info@myumrahconnect.com or via WhatsApp at +201222151335.",
  termsAcceptTitle: "Acceptance of Terms",
  termsAcceptBody: "By accessing and using UmrahConnect you accept and agree to be bound by these Terms of Service. If you do not agree to these terms please do not use the app.",
  termsUseTitle: "Use of the App",
  termsUseBody: "UmrahConnect is provided as a guide and booking platform for pilgrims. You agree to use the app only for lawful purposes and in accordance with these terms.",
  termsAccountsTitle: "User Accounts",
  termsAccountsBody: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
  termsInfoTitle: "Hotel and Restaurant Information",
  termsInfoBody: "Hotel and restaurant listings are provided for informational purposes. We strive for accuracy but cannot guarantee that all information is current or complete.",
  termsBookingsTitle: "Bookings and Payments",
  termsBookingsBody: "Bookings made through the app may be processed by third party partners. UmrahConnect is not responsible for the fulfillment of bookings made through external platforms.",
  termsLinksTitle: "External Links",
  termsLinksBody: "The app may contain links to third party websites. We are not responsible for the content or practices of those sites.",
  termsLiabilityTitle: "Limitation of Liability",
  termsLiabilityBody: "UmrahConnect is provided as is without warranties of any kind. We shall not be liable for any damages arising from your use of the app.",
  termsChangesTitle: "Changes to Terms",
  termsChangesBody: "We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.",
  termsContactBody: "If you have questions about these Terms of Service please contact us at info@myumrahconnect.com.",
  whatsapp: "WhatsApp",
  email: "Email",
  responseTime: "Response time",
}

const newEn = { ...phaseEn, ...uiEn }

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(i18nDir, file), "utf8"))
}

function saveJson(file, data) {
  const sorted = Object.fromEntries(Object.keys(data).sort().map((k) => [k, data[k]]))
  fs.writeFileSync(path.join(i18nDir, file), JSON.stringify(sorted, null, 2) + "\n")
}

const DEEPL_KEY = "21bbc1fa-0c5f-49dc-b357-f6aeea1ee557:fx"
const DEEPL_LANG = { ar: "AR", fr: "FR", tr: "TR" }

async function translateBatch(texts, targetLang) {
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
    },
    body: new URLSearchParams({
      text: texts,
      source_lang: "EN",
      target_lang: targetLang,
    }).toString(),
  })
  const data = await res.json()
  if (!data.translations) {
    console.error("DeepL error:", data)
    return texts
  }
  return data.translations.map((t) => t.text)
}

async function translateKeys(enKeys, targetLang, existing) {
  const missing = Object.keys(enKeys).filter((k) => !(k in existing))
  console.log(`Translating ${missing.length} keys to ${targetLang}...`)
  const batchSize = 40
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize)
    const texts = batch.map((k) => enKeys[k])
    const translated = await translateBatch(texts, targetLang)
    batch.forEach((key, idx) => {
      existing[key] = translated[idx]
    })
    console.log(`  ${Math.min(i + batchSize, missing.length)}/${missing.length}`)
    await new Promise((r) => setTimeout(r, 500))
  }
  return existing
}

async function main() {
  const en = loadJson("en.json")
  const mergedEn = { ...en, ...newEn }
  saveJson("en.json", mergedEn)
  console.log(`Merged ${Object.keys(newEn).length} keys into en.json`)

  for (const lang of ["ar", "fr", "tr"]) {
    const existing = loadJson(`${lang}.json`)
    const updated = await translateKeys(newEn, DEEPL_LANG[lang], existing)
    saveJson(`${lang}.json`, updated)
  }

  // Urdu: translate via DeepL using EN->UR if available, else copy EN for missing only
  const ur = loadJson("ur.json")
  const urMissing = Object.keys(newEn).filter((k) => !(k in ur))
  console.log(`Urdu: ${urMissing.length} keys to translate`)
  const urBatchSize = 40
  for (let i = 0; i < urMissing.length; i += urBatchSize) {
    const batch = urMissing.slice(i, i + urBatchSize)
    const texts = batch.map((k) => newEn[k])
    try {
      const res = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
        },
        body: new URLSearchParams({
          text: texts,
          source_lang: "EN",
          target_lang: "UR",
        }).toString(),
      })
      const data = await res.json()
      if (data.translations) {
        batch.forEach((key, idx) => {
          ur[key] = data.translations[idx].text
        })
      } else {
        batch.forEach((key) => {
          ur[key] = newEn[key]
        })
      }
    } catch {
      batch.forEach((key) => {
        ur[key] = newEn[key]
      })
    }
    console.log(`  ur ${Math.min(i + urBatchSize, urMissing.length)}/${urMissing.length}`)
    await new Promise((r) => setTimeout(r, 500))
  }
  saveJson("ur.json", ur)
  console.log("Done.")
}

main().catch(console.error)
