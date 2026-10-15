/** Paid agent accounts (public.agents).
 * The country directory on Find an Agent stays in lib/travelAgents.ts.
 */

import { supabase } from "@/lib/supabase"

export type AgentStatus = "pending" | "active" | "expired" | "suspended"
export type AgentPlan = "listed" | "featured"
export type ProfileRole = "pilgrim" | "agent" | "admin"

export type PublicAgent = {
  id: string
  business_name: string
  logo_url: string | null
  license_number: string | null
  country: string | null
  cities: string[]
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  description: string | null
  agent_code: string
  plan: AgentPlan
  verified: boolean
  created_at: string
  owner_name: string | null
  nationality: string | null
  years_experience: number
  pilgrims_managed: number
}

export type AgentProfile = PublicAgent & {
  owner_user_id: string | null
  status: AgentStatus
  paid_until: string | null
}

export type AgentLink = {
  agent_id: string
  user_id: string
  joined_at: string
  share_contact: boolean
}

export type AgentPilgrim = {
  user_id: string
  joined_at: string
  share_contact: boolean
  name: string | null
  nationality: string | null
  phone: string | null
  email: string | null
}

export type AgentAnnouncement = {
  id: string
  agent_id: string
  title: string
  body: string
  created_at: string
}

const PUBLIC_COLUMNS =
  "id, business_name, logo_url, license_number, country, cities, phone, whatsapp, email, website, description, agent_code, plan, verified, created_at, owner_name, nationality, years_experience, pilgrims_managed"

export function normalizeAgentCode(code: string) {
  return code.trim().toUpperCase()
}

function asPlan(value: string | null): AgentPlan {
  // The table still stores trial/basic/pro for the store app. Views map those
  // to listed/featured. Accept either spelling.
  return value === "featured" || value === "pro" ? "featured" : "listed"
}

function asStatus(value: string | null): AgentStatus {
  if (value === "active" || value === "expired" || value === "suspended" || value === "pending") {
    return value
  }
  return "pending"
}

function mapPublic(row: Record<string, unknown>): PublicAgent {
  return {
    id: String(row.id),
    business_name: String(row.business_name ?? ""),
    logo_url: (row.logo_url as string | null) ?? null,
    license_number: (row.license_number as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    cities: Array.isArray(row.cities) ? row.cities.map(String) : [],
    phone: (row.phone as string | null) ?? null,
    whatsapp: (row.whatsapp as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    agent_code: String(row.agent_code ?? ""),
    plan: asPlan((row.plan as string | null) ?? null),
    verified: Boolean(row.verified),
    created_at: String(row.created_at ?? ""),
    owner_name: (row.owner_name as string | null) ?? null,
    nationality: (row.nationality as string | null) ?? null,
    years_experience: Number(row.years_experience ?? 0),
    pilgrims_managed: Number(row.pilgrims_managed ?? 0),
  }
}

function mapProfile(row: Record<string, unknown>): AgentProfile {
  return {
    ...mapPublic(row),
    owner_user_id: (row.owner_user_id as string | null) ?? null,
    status: asStatus((row.status as string | null) ?? null),
    paid_until: (row.paid_until as string | null) ?? null,
  }
}

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function getActiveAgents(country?: string): Promise<PublicAgent[]> {
  const { data, error } = await supabase
    .from("active_agents")
    .select(PUBLIC_COLUMNS)
    .order("plan", { ascending: true })
    .order("business_name", { ascending: true })

  if (error) throw new Error(error.message)

  const agents = ((data ?? []) as unknown as Record<string, unknown>[]).map(mapPublic)
  const wanted = country?.trim().toLowerCase()
  if (!wanted) return agents

  return agents.filter(agent =>
    agent.country?.toLowerCase() === wanted ||
    agent.cities.some(city => city.toLowerCase() === wanted)
  )
}

export async function getAgentByCode(code: string): Promise<PublicAgent | null> {
  const normalized = normalizeAgentCode(code)
  if (!normalized) return null

  const { data, error } = await supabase
    .from("active_agents")
    .select(PUBLIC_COLUMNS)
    .eq("agent_code", normalized)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapPublic(data as unknown as Record<string, unknown>)
}

/** The signed-in pilgrim's agent, when that agent is still active. */
export async function getMyAgent(): Promise<PublicAgent | null> {
  const userId = await currentUserId()
  if (!userId) return null

  const { data: link, error } = await supabase
    .from("agent_pilgrims")
    .select("agent_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!link?.agent_id) return null

  const { data: agent, error: agentError } = await supabase
    .from("active_agents")
    .select(PUBLIC_COLUMNS)
    .eq("id", link.agent_id)
    .maybeSingle()

  if (agentError) throw new Error(agentError.message)
  if (!agent) return null
  return mapPublic(agent as unknown as Record<string, unknown>)
}

export async function joinAgent(code: string, shareContact: boolean): Promise<AgentLink> {
  const userId = await currentUserId()
  if (!userId) throw new Error("Sign in to join an agent")

  const agent = await getAgentByCode(code)
  if (!agent) throw new Error("Agent code not found")

  const { data: existing, error: existingError } = await supabase
    .from("agent_pilgrims")
    .select("agent_id, user_id, joined_at, share_contact")
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)

  if (existing) {
    if (existing.agent_id !== agent.id) {
      throw new Error("You are already linked to an agent")
    }
    if (existing.share_contact !== shareContact) {
      const { error } = await supabase
        .from("agent_pilgrims")
        .update({ share_contact: shareContact })
        .eq("user_id", userId)
      if (error) throw new Error(error.message)
    }
    return {
      agent_id: existing.agent_id,
      user_id: existing.user_id,
      joined_at: existing.joined_at,
      share_contact: shareContact,
    }
  }

  const { data, error } = await supabase
    .from("agent_pilgrims")
    .insert({
      agent_id: agent.id,
      user_id: userId,
      share_contact: shareContact,
    })
    .select("agent_id, user_id, joined_at, share_contact")
    .single()

  if (error) throw new Error(error.message)

  return {
    agent_id: data.agent_id,
    user_id: data.user_id,
    joined_at: data.joined_at,
    share_contact: data.share_contact,
  }
}

export async function leaveAgent(): Promise<void> {
  const userId = await currentUserId()
  if (!userId) throw new Error("Sign in to leave an agent")

  const { error } = await supabase
    .from("agent_pilgrims")
    .delete()
    .eq("user_id", userId)

  if (error) throw new Error(error.message)
}

/** The signed-in agent's own row. status is the effective status, including expiry. */
export async function getMyAgentProfile(): Promise<AgentProfile | null> {
  const userId = await currentUserId()
  if (!userId) return null

  const { data, error } = await supabase
    .from("own_agents")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapProfile(data as unknown as Record<string, unknown>)
}

export async function getMyPilgrims(): Promise<AgentPilgrim[]> {
  const profile = await getMyAgentProfile()
  if (!profile) return []

  const { data, error } = await supabase
    .from("agent_pilgrims_view")
    .select("pilgrim_id, pilgrim_name, pilgrim_nationality, pilgrim_phone, pilgrim_email, created_at")
    .eq("agent_id", profile.id)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map(row => ({
    user_id: row.pilgrim_id,
    joined_at: row.created_at,
    share_contact: true,
    name: row.pilgrim_name,
    nationality: row.pilgrim_nationality,
    phone: row.pilgrim_phone,
    email: row.pilgrim_email,
  }))
}

export async function postAnnouncement(title: string, body: string): Promise<AgentAnnouncement> {
  const trimmedTitle = title.trim()
  const trimmedBody = body.trim()
  if (!trimmedTitle || !trimmedBody) throw new Error("Title and body are required")

  const profile = await getMyAgentProfile()
  if (!profile) throw new Error("No agent profile")

  const { data, error } = await supabase
    .from("agent_announcements")
    .insert({
      agent_id: profile.id,
      title: trimmedTitle,
      body: trimmedBody,
    })
    .select("id, agent_id, title, body, created_at")
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─── Agent profile page, contact tracking and QR codes ──────────────────────

export const AGENT_SITE_URL = "https://myumrahconnect.com"

/** The link printed on an agent's QR poster. Opens the agent page on the website (or the app, once links are set up). */
export function agentJoinUrl(code: string) {
  return `${AGENT_SITE_URL}/a/${encodeURIComponent(normalizeAgentCode(code))}`
}

/**
 * Reads an agent code from anything a QR can hold:
 * https://myumrahconnect.com/a/AGT-123ABC, umrahconnect://a/AGT-123ABC, .../join?ref=AGT-123ABC, or just AGT-123ABC.
 */
export function agentCodeFromScan(raw: string): string | null {
  const text = (raw || "").trim()
  if (!text) return null
  const fromPath = text.match(/\/a\/([A-Za-z0-9-]+)/)
  if (fromPath) return normalizeAgentCode(decodeURIComponent(fromPath[1]))
  const fromRef = text.match(/[?&]ref=([A-Za-z0-9-]+)/)
  if (fromRef) return normalizeAgentCode(decodeURIComponent(fromRef[1]))
  if (/^[A-Za-z]{2,5}-[A-Za-z0-9]{3,12}$/.test(text)) return normalizeAgentCode(text)
  return null
}

/** One active agency by id (null when it is not live: not verified, unpaid or suspended). */
export async function getActiveAgentById(id: string): Promise<PublicAgent | null> {
  const { data, error } = await supabase
    .from("active_agents")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return mapPublic(data as unknown as Record<string, unknown>)
}

export type LeadType = "call" | "whatsapp" | "email" | "website"

/**
 * Counts a contact tap so the agency sees it in its dashboard. Only the fact that a contact
 * happened is stored, never the message. Signed-out users are not counted. Never throws.
 */
export async function recordLead(agentId: string, type: LeadType): Promise<void> {
  try {
    const userId = await currentUserId()
    if (!userId) return
    await supabase.from("agent_leads").insert({ agent_id: agentId, user_id: userId, type })
  } catch (e) {
    console.log("recordLead failed:", e)
  }
}

/** The agent id the signed-in pilgrim is linked to, if any. */
export async function getMyAgentId(): Promise<string | null> {
  const userId = await currentUserId()
  if (!userId) return null
  const { data } = await supabase.from("agent_pilgrims").select("agent_id").eq("user_id", userId).maybeSingle()
  return (data?.agent_id as string | undefined) ?? null
}

export async function isSignedIn(): Promise<boolean> {
  return Boolean(await currentUserId())
}

/** Announcements from the pilgrim's own agency, newest first (pilgrims only see their agency's). */
export async function getAgentAnnouncements(agentId: string, limit = 30): Promise<AgentAnnouncement[]> {
  const { data, error } = await supabase
    .from("agent_announcements")
    .select("id, agent_id, title, body, created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as AgentAnnouncement[]
}
