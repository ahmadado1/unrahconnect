/** Dial codes + nationality list for profile / booking forms. */

export type CountryDial = {
  code: string
  name: string
  dial: string
  flag: string
}

export type NationalityOption = {
  id: string
  label: string
  flag: string
}

export const COUNTRY_DIALS: CountryDial[] = [
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algeria", dial: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisia", dial: "+216", flag: "🇹🇳" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "SY", name: "Syria", dial: "+963", flag: "🇸🇾" },
  { code: "IQ", name: "Iraq", dial: "+964", flag: "🇮🇶" },
  { code: "YE", name: "Yemen", dial: "+967", flag: "🇾🇪" },
  { code: "SD", name: "Sudan", dial: "+249", flag: "🇸🇩" },
  { code: "SO", name: "Somalia", dial: "+252", flag: "🇸🇴" },
  { code: "ET", name: "Ethiopia", dial: "+251", flag: "🇪🇹" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "SN", name: "Senegal", dial: "+221", flag: "🇸🇳" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰" },
  { code: "AF", name: "Afghanistan", dial: "+93", flag: "🇦🇫" },
  { code: "UZ", name: "Uzbekistan", dial: "+998", flag: "🇺🇿" },
  { code: "KZ", name: "Kazakhstan", dial: "+7", flag: "🇰🇿" },
  { code: "AZ", name: "Azerbaijan", dial: "+994", flag: "🇦🇿" },
  { code: "AL", name: "Albania", dial: "+355", flag: "🇦🇱" },
  { code: "BA", name: "Bosnia and Herzegovina", dial: "+387", flag: "🇧🇦" },
  { code: "XK", name: "Kosovo", dial: "+383", flag: "🇽🇰" },
  { code: "PS", name: "Palestine", dial: "+970", flag: "🇵🇸" },
]

export const NATIONALITIES: NationalityOption[] = [
  { id: "Egyptian", label: "Egyptian", flag: "🇪🇬" },
  { id: "Saudi", label: "Saudi", flag: "🇸🇦" },
  { id: "Nigerian", label: "Nigerian", flag: "🇳🇬" },
  { id: "Pakistani", label: "Pakistani", flag: "🇵🇰" },
  { id: "Bangladeshi", label: "Bangladeshi", flag: "🇧🇩" },
  { id: "Indonesian", label: "Indonesian", flag: "🇮🇩" },
  { id: "Indian", label: "Indian", flag: "🇮🇳" },
  { id: "Turkish", label: "Turkish", flag: "🇹🇷" },
  { id: "Moroccan", label: "Moroccan", flag: "🇲🇦" },
  { id: "Algerian", label: "Algerian", flag: "🇩🇿" },
  { id: "Tunisian", label: "Tunisian", flag: "🇹🇳" },
  { id: "Emirati", label: "Emirati", flag: "🇦🇪" },
  { id: "Qatari", label: "Qatari", flag: "🇶🇦" },
  { id: "Kuwaiti", label: "Kuwaiti", flag: "🇰🇼" },
  { id: "Bahraini", label: "Bahraini", flag: "🇧🇭" },
  { id: "Omani", label: "Omani", flag: "🇴🇲" },
  { id: "Jordanian", label: "Jordanian", flag: "🇯🇴" },
  { id: "Lebanese", label: "Lebanese", flag: "🇱🇧" },
  { id: "Syrian", label: "Syrian", flag: "🇸🇾" },
  { id: "Iraqi", label: "Iraqi", flag: "🇮🇶" },
  { id: "Yemeni", label: "Yemeni", flag: "🇾🇪" },
  { id: "Sudanese", label: "Sudanese", flag: "🇸🇩" },
  { id: "Somali", label: "Somali", flag: "🇸🇴" },
  { id: "Ethiopian", label: "Ethiopian", flag: "🇪🇹" },
  { id: "Kenyan", label: "Kenyan", flag: "🇰🇪" },
  { id: "Ghanaian", label: "Ghanaian", flag: "🇬🇭" },
  { id: "Senegalese", label: "Senegalese", flag: "🇸🇳" },
  { id: "Malaysian", label: "Malaysian", flag: "🇲🇾" },
  { id: "British", label: "British", flag: "🇬🇧" },
  { id: "French", label: "French", flag: "🇫🇷" },
  { id: "German", label: "German", flag: "🇩🇪" },
  { id: "American", label: "American", flag: "🇺🇸" },
  { id: "Canadian", label: "Canadian", flag: "🇨🇦" },
  { id: "Australian", label: "Australian", flag: "🇦🇺" },
  { id: "Dutch", label: "Dutch", flag: "🇳🇱" },
  { id: "Belgian", label: "Belgian", flag: "🇧🇪" },
  { id: "Italian", label: "Italian", flag: "🇮🇹" },
  { id: "Spanish", label: "Spanish", flag: "🇪🇸" },
  { id: "Swedish", label: "Swedish", flag: "🇸🇪" },
  { id: "Norwegian", label: "Norwegian", flag: "🇳🇴" },
  { id: "Danish", label: "Danish", flag: "🇩🇰" },
  { id: "Afghan", label: "Afghan", flag: "🇦🇫" },
  { id: "Uzbek", label: "Uzbek", flag: "🇺🇿" },
  { id: "Kazakh", label: "Kazakh", flag: "🇰🇿" },
  { id: "Azerbaijani", label: "Azerbaijani", flag: "🇦🇿" },
  { id: "Albanian", label: "Albanian", flag: "🇦🇱" },
  { id: "Bosnian", label: "Bosnian", flag: "🇧🇦" },
  { id: "Kosovar", label: "Kosovar", flag: "🇽🇰" },
  { id: "Palestinian", label: "Palestinian", flag: "🇵🇸" },
]

const LOCALE_TO_COUNTRY: Record<string, string> = {
  EG: "EG",
  SA: "SA",
  NG: "NG",
  PK: "PK",
  BD: "BD",
  ID: "ID",
  IN: "IN",
  TR: "TR",
  MA: "MA",
  DZ: "DZ",
  TN: "TN",
  AE: "AE",
  QA: "QA",
  KW: "KW",
  BH: "BH",
  OM: "OM",
  JO: "JO",
  LB: "LB",
  SY: "SY",
  IQ: "IQ",
  YE: "YE",
  SD: "SD",
  SO: "SO",
  ET: "ET",
  KE: "KE",
  GH: "GH",
  SN: "SN",
  MY: "MY",
  GB: "GB",
  UK: "GB",
  FR: "FR",
  DE: "DE",
  US: "US",
  CA: "CA",
  AU: "AU",
  NL: "NL",
  BE: "BE",
  IT: "IT",
  ES: "ES",
  SE: "SE",
  NO: "NO",
  DK: "DK",
  AF: "AF",
  UZ: "UZ",
  KZ: "KZ",
  AZ: "AZ",
  AL: "AL",
  BA: "BA",
  XK: "XK",
  PS: "PS",
}

export function getCountryByCode(code: string) {
  return COUNTRY_DIALS.find(c => c.code === code) ?? COUNTRY_DIALS[0]
}

export function getCountryByDial(dial: string) {
  const normalized = dial.startsWith("+") ? dial : `+${dial}`
  return COUNTRY_DIALS.find(c => c.dial === normalized) ?? null
}

/** Best-effort device region → dial country (defaults to Egypt). */
export function detectDefaultCountryCode(): string {
  try {
    const locale =
      Intl.DateTimeFormat().resolvedOptions().locale ||
      (typeof navigator !== "undefined" ? navigator.language : "en-EG")
    const region = locale.split(/[-_]/).pop()?.toUpperCase() || ""
    if (region && LOCALE_TO_COUNTRY[region]) return LOCALE_TO_COUNTRY[region]
  } catch {
    // ignore
  }
  return "EG"
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "")
}

/** Split a stored phone like "+201234567890" into dial + local digits. */
export function parseStoredPhone(stored: string | null | undefined): {
  countryCode: string
  localNumber: string
} {
  const raw = String(stored || "").trim()
  if (!raw) {
    return { countryCode: detectDefaultCountryCode(), localNumber: "" }
  }

  const withPlus = raw.startsWith("+") ? raw : raw.startsWith("00") ? `+${raw.slice(2)}` : raw
  if (withPlus.startsWith("+")) {
    // Longest dial match first
    const sorted = [...COUNTRY_DIALS].sort((a, b) => b.dial.length - a.dial.length)
    for (const country of sorted) {
      if (withPlus.startsWith(country.dial)) {
        return {
          countryCode: country.code,
          localNumber: digitsOnly(withPlus.slice(country.dial.length)),
        }
      }
    }
  }

  return {
    countryCode: detectDefaultCountryCode(),
    localNumber: digitsOnly(raw),
  }
}

export function formatFullPhone(countryCode: string, localNumber: string) {
  const country = getCountryByCode(countryCode)
  const local = digitsOnly(localNumber).replace(/^0+/, "")
  if (!local) return ""
  return `${country.dial}${local}`
}
