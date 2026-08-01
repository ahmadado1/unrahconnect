/** Dial codes + nationality list for profile / booking forms. */

export type CountryDial = {
  code: string
  name: string
  dial: string
}

export type NationalityOption = {
  id: string
  label: string
}

export const COUNTRY_DIALS: CountryDial[] = [
  { code: "EG", name: "Egypt", dial: "+20" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "ID", name: "Indonesia", dial: "+62" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "TR", name: "Turkey", dial: "+90" },
  { code: "MA", name: "Morocco", dial: "+212" },
  { code: "DZ", name: "Algeria", dial: "+213" },
  { code: "TN", name: "Tunisia", dial: "+216" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "QA", name: "Qatar", dial: "+974" },
  { code: "KW", name: "Kuwait", dial: "+965" },
  { code: "BH", name: "Bahrain", dial: "+973" },
  { code: "OM", name: "Oman", dial: "+968" },
  { code: "JO", name: "Jordan", dial: "+962" },
  { code: "LB", name: "Lebanon", dial: "+961" },
  { code: "SY", name: "Syria", dial: "+963" },
  { code: "IQ", name: "Iraq", dial: "+964" },
  { code: "YE", name: "Yemen", dial: "+967" },
  { code: "SD", name: "Sudan", dial: "+249" },
  { code: "SO", name: "Somalia", dial: "+252" },
  { code: "ET", name: "Ethiopia", dial: "+251" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "SN", name: "Senegal", dial: "+221" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "BE", name: "Belgium", dial: "+32" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "AF", name: "Afghanistan", dial: "+93" },
  { code: "UZ", name: "Uzbekistan", dial: "+998" },
  { code: "KZ", name: "Kazakhstan", dial: "+7" },
  { code: "AZ", name: "Azerbaijan", dial: "+994" },
  { code: "AL", name: "Albania", dial: "+355" },
  { code: "BA", name: "Bosnia and Herzegovina", dial: "+387" },
  { code: "XK", name: "Kosovo", dial: "+383" },
  { code: "PS", name: "Palestine", dial: "+970" },
]

export const NATIONALITIES: NationalityOption[] = [
  { id: "Egyptian", label: "Egyptian" },
  { id: "Saudi", label: "Saudi" },
  { id: "Nigerian", label: "Nigerian" },
  { id: "Pakistani", label: "Pakistani" },
  { id: "Bangladeshi", label: "Bangladeshi" },
  { id: "Indonesian", label: "Indonesian" },
  { id: "Indian", label: "Indian" },
  { id: "Turkish", label: "Turkish" },
  { id: "Moroccan", label: "Moroccan" },
  { id: "Algerian", label: "Algerian" },
  { id: "Tunisian", label: "Tunisian" },
  { id: "Emirati", label: "Emirati" },
  { id: "Qatari", label: "Qatari" },
  { id: "Kuwaiti", label: "Kuwaiti" },
  { id: "Bahraini", label: "Bahraini" },
  { id: "Omani", label: "Omani" },
  { id: "Jordanian", label: "Jordanian" },
  { id: "Lebanese", label: "Lebanese" },
  { id: "Syrian", label: "Syrian" },
  { id: "Iraqi", label: "Iraqi" },
  { id: "Yemeni", label: "Yemeni" },
  { id: "Sudanese", label: "Sudanese" },
  { id: "Somali", label: "Somali" },
  { id: "Ethiopian", label: "Ethiopian" },
  { id: "Kenyan", label: "Kenyan" },
  { id: "Ghanaian", label: "Ghanaian" },
  { id: "Senegalese", label: "Senegalese" },
  { id: "Malaysian", label: "Malaysian" },
  { id: "British", label: "British" },
  { id: "French", label: "French" },
  { id: "German", label: "German" },
  { id: "American", label: "American" },
  { id: "Canadian", label: "Canadian" },
  { id: "Australian", label: "Australian" },
  { id: "Dutch", label: "Dutch" },
  { id: "Belgian", label: "Belgian" },
  { id: "Italian", label: "Italian" },
  { id: "Spanish", label: "Spanish" },
  { id: "Swedish", label: "Swedish" },
  { id: "Norwegian", label: "Norwegian" },
  { id: "Danish", label: "Danish" },
  { id: "Afghan", label: "Afghan" },
  { id: "Uzbek", label: "Uzbek" },
  { id: "Kazakh", label: "Kazakh" },
  { id: "Azerbaijani", label: "Azerbaijani" },
  { id: "Albanian", label: "Albanian" },
  { id: "Bosnian", label: "Bosnian" },
  { id: "Kosovar", label: "Kosovar" },
  { id: "Palestinian", label: "Palestinian" },
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
