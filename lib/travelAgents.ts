/** Travel agents directory — countries local, agents from Supabase (+ cache). */

import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "@/lib/supabase"

export type TravelAgentCountry = {
  id: string
  name: string
  /** Flag emoji shown in the country selector. */
  flag: string
  comingSoon?: boolean
}

/** DB row shape for public.travel_agents */
export type TravelAgentRow = {
  id: string
  name: string
  country: string
  city: string
  address: string | null
  phone: string | null
  website: string | null
  whatsapp: string | null
  email: string | null
  featured: boolean
}

/** App-facing agent model (compatible with existing UI). */
export type TravelAgent = {
  id: string
  countryId: string
  agencyName: string
  city: string
  address: string
  phone: string | null
  phone2?: string | null
  email: string | null
  website?: string | null
  whatsapp?: string | null
  services: string[]
  featured: boolean
}

export const TRAVEL_AGENT_CONTACT_EMAIL = "info@myumrahconnect.com"
export const GET_FEATURED_URL = "https://myumrahconnect.com/advertise"

export const DEFAULT_AGENT_SERVICES = [
  "Umrah Packages",
  "Hajj Services",
  "Flight Booking",
  "Hotel Booking",
] as const

export const TRAVEL_AGENT_COUNTRIES: TravelAgentCountry[] = [
  { id: "nigeria", name: "Nigeria", flag: "🇳🇬" },
  { id: "niger", name: "Niger", flag: "🇳🇪" },
  { id: "burkina-faso", name: "Burkina Faso", flag: "🇧🇫" },
  { id: "mali", name: "Mali", flag: "🇲🇱" },
  { id: "chad", name: "Chad", flag: "🇹🇩" },
  { id: "egypt", name: "Egypt", flag: "🇪🇬" },
  { id: "uae", name: "UAE", flag: "🇦🇪" },
  { id: "jordan", name: "Jordan", flag: "🇯🇴" },
  { id: "south-africa", name: "South Africa", flag: "🇿🇦" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", comingSoon: true },
  { id: "pakistan", name: "Pakistan", flag: "🇵🇰" },
  { id: "india", name: "India", flag: "🇮🇳" },
  { id: "malaysia", name: "Malaysia", flag: "🇲🇾" },
  { id: "bangladesh", name: "Bangladesh", flag: "🇧🇩" },
  { id: "indonesia", name: "Indonesia", flag: "🇮🇩" },
  { id: "france", name: "France", flag: "🇫🇷", comingSoon: true },
  { id: "algeria", name: "Algeria", flag: "🇩🇿" },
  { id: "morocco", name: "Morocco", flag: "🇲🇦" },
  { id: "turkey", name: "Turkey", flag: "🇹🇷" },
]

const CACHE_KEY = "travel_agents_cache_v1"
const CACHE_TS_KEY = "travel_agents_cache_ts_v1"

let memoryCache: TravelAgent[] | null = null

function mapRow(row: TravelAgentRow): TravelAgent {
  const whatsapp = row.whatsapp ?? null
  const phone = row.phone ?? null
  return {
    id: row.id,
    countryId: row.country,
    agencyName: row.name,
    city: row.city ?? "",
    address: row.address ?? "",
    phone,
    phone2: whatsapp && whatsapp !== phone ? whatsapp : null,
    email: row.email ?? null,
    website: row.website ?? null,
    whatsapp,
    services: [...DEFAULT_AGENT_SERVICES],
    featured: !!row.featured,
  }
}

export function sortAgents(agents: TravelAgent[]): TravelAgent[] {
  return agents.slice().sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      a.city.localeCompare(b.city) ||
      a.agencyName.localeCompare(b.agencyName)
  )
}

async function readDiskCache(): Promise<TravelAgent[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const rows = JSON.parse(raw) as TravelAgent[]
    return Array.isArray(rows) ? rows : null
  } catch {
    return null
  }
}

async function writeDiskCache(agents: TravelAgent[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(agents))
    await AsyncStorage.setItem(CACHE_TS_KEY, String(Date.now()))
  } catch (e) {
    console.warn("[TravelAgents] cache write failed", e)
  }
}

/** Instant cache (memory → disk). Does not hit the network. */
export async function getCachedAgents(): Promise<TravelAgent[]> {
  if (memoryCache) return memoryCache
  const disk = await readDiskCache()
  if (disk) {
    memoryCache = disk
    return disk
  }
  return []
}

export async function getCachedAgentsForCountry(countryId: string): Promise<TravelAgent[]> {
  const all = await getCachedAgents()
  return sortAgents(all.filter(a => a.countryId === countryId))
}

async function fetchAgentsFromSupabase(): Promise<TravelAgent[]> {
  const { data, error } = await supabase
    .from("travel_agents")
    .select("id, name, country, city, address, phone, website, whatsapp, email, featured")
    .order("featured", { ascending: false })
    .order("city", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.warn("[TravelAgents] fetch error:", error.message)
    throw error
  }

  return (data as TravelAgentRow[] | null)?.map(mapRow) ?? []
}

/**
 * Load agents for a country: return cache immediately via callback,
 * then refresh from Supabase and update cache.
 */
export async function loadAgentsForCountry(
  countryId: string,
  onCache?: (agents: TravelAgent[]) => void
): Promise<TravelAgent[]> {
  const cached = await getCachedAgentsForCountry(countryId)
  onCache?.(cached)

  try {
    const fresh = await fetchAgentsFromSupabase()
    memoryCache = fresh
    await writeDiskCache(fresh)
    return sortAgents(fresh.filter(a => a.countryId === countryId))
  } catch {
    return cached
  }
}

export async function loadAgentById(
  id: string,
  onCache?: (agent: TravelAgent | null) => void
): Promise<TravelAgent | null> {
  const cachedAll = await getCachedAgents()
  const fromCache = cachedAll.find(a => a.id === id) ?? null
  onCache?.(fromCache)

  try {
    const { data, error } = await supabase
      .from("travel_agents")
      .select("id, name, country, city, address, phone, website, whatsapp, email, featured")
      .eq("id", id)
      .maybeSingle()

    if (error) throw error
    if (!data) return fromCache

    const agent = mapRow(data as TravelAgentRow)
    // Merge into cache
    const next = cachedAll.filter(a => a.id !== agent.id)
    next.push(agent)
    memoryCache = next
    await writeDiskCache(next)
    return agent
  } catch {
    return fromCache
  }
}

export async function getAgentCountForCountry(countryId: string): Promise<number> {
  const agents = await getCachedAgentsForCountry(countryId)
  if (agents.length > 0) return agents.length

  try {
    const { count, error } = await supabase
      .from("travel_agents")
      .select("id", { count: "exact", head: true })
      .eq("country", countryId)
    if (error) throw error
    return count ?? 0
  } catch {
    return 0
  }
}

/** Prefetch all agents into cache (call from countries index if desired). */
export async function prefetchTravelAgents(): Promise<void> {
  const cached = await getCachedAgents()
  if (cached.length) {
    // Still refresh in background
    fetchAgentsFromSupabase()
      .then(async fresh => {
        memoryCache = fresh
        await writeDiskCache(fresh)
      })
      .catch(() => {})
    return
  }

  try {
    const fresh = await fetchAgentsFromSupabase()
    memoryCache = fresh
    await writeDiskCache(fresh)
  } catch {
    // offline / table not ready
  }
}

export function getTravelAgentCountry(id: string | string[] | undefined) {
  const key = Array.isArray(id) ? id[0] : id
  if (!key) return null
  return TRAVEL_AGENT_COUNTRIES.find(c => c.id === key) ?? null
}

const CITY_DISPLAY_ORDER: Record<string, string[]> = {
  nigeria: ["Abuja", "Kano", "Lagos"],
  egypt: ["Cairo", "Giza"],
  "south-africa": ["Cape Town", "Johannesburg"],
  algeria: ["Algiers", "Oran"],
  pakistan: ["Islamabad", "Lahore", "Karachi"],
  india: ["Mumbai", "Kozhikode"],
  malaysia: ["Kuala Lumpur", "Johor Bahru", "Kemaman", "Kajang"],
  indonesia: ["South Jakarta", "Central Jakarta", "East Jakarta"],
}

/** Group non-featured agents by city. Featured agents are listed separately first. */
export function groupAgentsByCity(agents: TravelAgent[], countryId?: string) {
  const groups: { city: string; agents: TravelAgent[]; isFeaturedSection?: boolean }[] = []

  const featured = sortAgents(agents.filter(a => a.featured))
  if (featured.length > 0) {
    groups.push({ city: "Featured", agents: featured, isFeaturedSection: true })
  }

  const rest = agents.filter(a => !a.featured)
  const indexByCity = new Map<string, number>()
  for (const agent of rest) {
    const city = agent.city.trim() || "Other"
    const existing = indexByCity.get(city)
    if (existing === undefined) {
      indexByCity.set(city, groups.length)
      groups.push({ city, agents: [agent] })
    } else {
      groups[existing].agents.push(agent)
    }
  }

  const preferred = countryId ? CITY_DISPLAY_ORDER[countryId] : undefined
  if (preferred?.length) {
    const featuredGroup = groups.find(g => g.isFeaturedSection)
    const cityGroups = groups.filter(g => !g.isFeaturedSection)
    cityGroups.sort((a, b) => {
      const ai = preferred.indexOf(a.city)
      const bi = preferred.indexOf(b.city)
      const aRank = ai === -1 ? 999 : ai
      const bRank = bi === -1 ? 999 : bi
      return aRank - bRank || a.city.localeCompare(b.city)
    })
    return featuredGroup ? [featuredGroup, ...cityGroups] : cityGroups
  }

  return groups
}

/**
 * Normalize phone digits for WhatsApp / tel.
 * Local NG numbers (0803…) → 234803…; other intl numbers keep their country code.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  if (
    digits.startsWith("234") ||
    digits.startsWith("227") ||
    digits.startsWith("226") ||
    digits.startsWith("223") ||
    digits.startsWith("971") ||
    digits.startsWith("962") ||
    digits.startsWith("92") ||
    digits.startsWith("91") ||
    digits.startsWith("90") ||
    digits.startsWith("60") ||
    digits.startsWith("62") ||
    digits.startsWith("235") ||
    digits.startsWith("880") ||
    digits.startsWith("213") ||
    digits.startsWith("212") ||
    digits.startsWith("27") ||
    digits.startsWith("20")
  ) {
    return digits
  }
  if (digits.startsWith("0")) return `234${digits.slice(1)}`
  if (digits.length === 10) return `234${digits}`
  return digits
}

export function toTelHref(phone: string | null | undefined): string | null {
  const wa = toWhatsAppNumber(phone)
  return wa ? `tel:+${wa}` : null
}
