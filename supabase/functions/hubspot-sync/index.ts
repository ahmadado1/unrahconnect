// Supabase Edge Function: copies UmrahConnect agencies into HubSpot (one way: Supabase -> HubSpot).
//
// For every agency (hidden test agencies are skipped):
//   * Company  = the agency (name, country, cities, phone, website + UmrahConnect fields)
//   * Contact  = the agency owner (email, name, phone), linked to the company
//   * Deal     = the agency's subscription in the "Agency subscriptions" pipeline, at the right stage:
//       Signed up -> Documents sent -> Verified -> Awaiting payment -> Paid / Active -> Lost
//
// Runs every 15 minutes (pg_cron, see migration 20261110150000_hubspot_sync.sql) and only sends
// agencies whose details changed since the last run (public.hubspot_sync keeps a fingerprint and
// the HubSpot record ids). Supabase stays the master copy; edits made in HubSpot to these fields
// are overwritten on the next change.
//
// Secrets (Supabase > Edge Functions > Secrets):
//   HUBSPOT_TOKEN     HubSpot service key (crm.objects/schemas for contacts, companies, deals)
//   HUBSPOT_SYNC_KEY  any long random text; the cron job sends it so nobody else can start a sync
// Deploy with:  npx supabase functions deploy hubspot-sync --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const HS = "https://api.hubapi.com"
const TOKEN = (Deno.env.get("HUBSPOT_TOKEN") || "").trim()
const SYNC_KEY = (Deno.env.get("HUBSPOT_SYNC_KEY") || "").trim()

// Deal stage ids of the (renamed) default pipeline.
const STAGE = {
  signedUp: "appointmentscheduled",
  documentsSent: "qualifiedtobuy",
  verified: "presentationscheduled",
  awaitingPayment: "contractsent",
  paid: "closedwon",
  lost: "closedlost",
}
const PRICE = { listed: 19.99, featured: 39.99 }
// Founding offer: agencies are free for now. Deals show 0 and a live agency counts as "Paid / Active".
// Read from public.agency_settings on every run, so switching to paid plans needs no redeploy.
let FREE_FOR_AGENCIES = true

type Agent = {
  id: string
  business_name: string | null
  agency_name: string | null
  owner_name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  country: string | null
  cities: string[] | null
  agent_code: string | null
  plan: string | null
  status: string | null
  verified: boolean | null
  paid_until: string | null
  hidden: boolean | null
  created_at: string
  doc_business_reg: string | null
  doc_licence: string | null
  doc_owner_id: string | null
  doc_office_photo: string | null
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

// ─── HubSpot API helper (retries once on rate limit) ───
async function hs(method: string, path: string, body?: unknown): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${HS}${path}`, {
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 1500))
      continue
    }
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      const err = new Error(`HubSpot ${method} ${path} -> ${res.status}: ${data?.message ?? text}`)
      ;(err as any).status = res.status
      ;(err as any).data = data
      throw err
    }
    return data
  }
  throw new Error(`HubSpot ${method} ${path}: rate limited`)
}

// ─── Custom fields (created once, if missing) ───
const PROPS: Record<string, { name: string; label: string; type: "string" | "date"; group: string }[]> = {
  companies: [
    { name: "uc_agent_id", label: "UmrahConnect agency ID", type: "string", group: "companyinformation" },
    { name: "uc_agent_code", label: "Agent code", type: "string", group: "companyinformation" },
    { name: "uc_plan", label: "Plan", type: "string", group: "companyinformation" },
    { name: "uc_status", label: "Status", type: "string", group: "companyinformation" },
    { name: "uc_verified", label: "Verified", type: "string", group: "companyinformation" },
    { name: "uc_plan_end_date", label: "Plan end date", type: "date", group: "companyinformation" },
    { name: "uc_cities", label: "Cities served", type: "string", group: "companyinformation" },
  ],
  contacts: [
    { name: "uc_role", label: "Role", type: "string", group: "contactinformation" },
    { name: "uc_agent_code", label: "Agent code they joined with", type: "string", group: "contactinformation" },
  ],
  deals: [
    { name: "uc_agent_id", label: "UmrahConnect agency ID", type: "string", group: "dealinformation" },
    { name: "uc_plan", label: "Plan", type: "string", group: "dealinformation" },
    { name: "uc_plan_end_date", label: "Plan end date", type: "date", group: "dealinformation" },
  ],
}

async function ensureProperties() {
  for (const [object, props] of Object.entries(PROPS)) {
    for (const p of props) {
      try {
        await hs("GET", `/crm/v3/properties/${object}/${p.name}`)
      } catch (e) {
        if ((e as any).status !== 404) throw e
        await hs("POST", `/crm/v3/properties/${object}`, {
          name: p.name,
          label: p.label,
          type: p.type,
          fieldType: p.type === "date" ? "date" : "text",
          groupName: p.group,
        })
      }
    }
  }
}

// ─── Helpers ───
const planOf = (a: Agent) => (a.plan === "pro" || a.plan === "featured" ? "featured" : "listed")
const nameOf = (a: Agent) => a.business_name || a.agency_name || "Agency"
const today = () => new Date().toISOString().slice(0, 10)
const docsComplete = (a: Agent) => Boolean(a.doc_business_reg && a.doc_licence && a.doc_owner_id && a.doc_office_photo)

/** Which pipeline stage the agency is in, from its UmrahConnect status. */
function stageOf(a: Agent) {
  const status = (a.status || "pending").toLowerCase()
  const paid = Boolean(a.paid_until && a.paid_until.slice(0, 10) >= today())
  if (status === "suspended") return STAGE.lost
  // Not verified yet (new sign-ups and old listings that never sent documents)
  if (!a.verified) return docsComplete(a) ? STAGE.documentsSent : STAGE.signedUp
  if (status === "active" && paid) return STAGE.paid
  // Free agencies: active with no paid-until date = live
  if (FREE_FOR_AGENCIES && status === "active" && !a.paid_until) return STAGE.paid
  if (status === "pending") {
    if (a.verified) return STAGE.verified
    return docsComplete(a) ? STAGE.documentsSent : STAGE.signedUp
  }
  // expired / active without paid date: verified agencies wait for payment; long-expired = lost
  if (a.paid_until && Date.now() - new Date(a.paid_until).getTime() > 60 * 86_400_000) return STAGE.lost
  return a.verified ? STAGE.awaitingPayment : STAGE.signedUp
}

function splitName(full: string | null) {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean)
  return { firstname: parts[0] || "", lastname: parts.slice(1).join(" ") }
}

function domainOf(url: string | null) {
  if (!url) return ""
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

async function hashOf(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function associate(from: string, fromId: string, to: string, toId: string) {
  await hs("PUT", `/crm/v4/objects/${from}/${fromId}/associations/default/${to}/${toId}`)
}

/** Create or update one record; returns its HubSpot id. */
async function upsert(object: string, id: string | null, properties: Record<string, unknown>) {
  if (id) {
    try {
      await hs("PATCH", `/crm/v3/objects/${object}/${id}`, { properties })
      return id
    } catch (e) {
      if ((e as any).status !== 404) throw e // deleted in HubSpot: create it again
    }
  }
  const created = await hs("POST", `/crm/v3/objects/${object}`, { properties })
  return String(created.id)
}

/** Contact by email: reuse an existing HubSpot contact with that email, else create. */
async function upsertContact(id: string | null, email: string, properties: Record<string, unknown>) {
  if (!id) {
    const found = await hs("POST", "/crm/v3/objects/contacts/search", {
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
      limit: 1,
    })
    id = found?.results?.[0]?.id ? String(found.results[0].id) : null
  }
  return upsert("contacts", id, { email, ...properties })
}

// ─── One agency ───
async function syncAgent(a: Agent, saved: { company_id: string | null; contact_id: string | null; deal_id: string | null } | null) {
  const plan = planOf(a)
  const end = a.paid_until ? a.paid_until.slice(0, 10) : ""
  const company = {
    name: nameOf(a),
    country: a.country || "",
    city: (a.cities ?? [])[0] || "",
    phone: a.phone || a.whatsapp || "",
    website: a.website || "",
    domain: domainOf(a.website),
    uc_agent_id: a.id,
    uc_agent_code: a.agent_code || "",
    uc_plan: plan === "featured" ? "Featured" : "Listed",
    uc_status: a.status || "pending",
    uc_verified: a.verified ? "Yes" : "No",
    uc_plan_end_date: end,
    uc_cities: (a.cities ?? []).join(", "),
  }
  const companyId = await upsert("companies", saved?.company_id ?? null, company)

  let contactId: string | null = saved?.contact_id ?? null
  if (a.email) {
    contactId = await upsertContact(contactId, a.email.trim().toLowerCase(), {
      ...splitName(a.owner_name),
      phone: a.phone || a.whatsapp || "",
      country: a.country || "",
      uc_role: "Agency owner",
      uc_agent_code: a.agent_code || "",
    })
    await associate("contacts", contactId, "companies", companyId)
  }

  const deal = {
    dealname: `${nameOf(a)} – ${FREE_FOR_AGENCIES ? "Founding (free)" : plan === "featured" ? "Featured" : "Listed"}`,
    pipeline: "default",
    dealstage: stageOf(a),
    amount: String(FREE_FOR_AGENCIES ? 0 : PRICE[plan]),
    uc_agent_id: a.id,
    uc_plan: plan === "featured" ? "Featured" : "Listed",
    uc_plan_end_date: end,
  }
  const dealId = await upsert("deals", saved?.deal_id ?? null, deal)
  await associate("deals", dealId, "companies", companyId)
  if (contactId) await associate("deals", dealId, "contacts", contactId)

  return { company_id: companyId, contact_id: contactId, deal_id: dealId, fingerprint: { company, deal, email: a.email } }
}

// ─── Entry point ───
Deno.serve(async req => {
  const presented = (req.headers.get("x-sync-key") || "").trim()
  if (!SYNC_KEY || presented !== SYNC_KEY) return json({ error: "Unauthorized" }, 401)
  if (!TOKEN) return json({ error: "HUBSPOT_TOKEN is not set" }, 500)

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
  const force = new URL(req.url).searchParams.get("force") === "1"

  try {
    await ensureProperties()

    const { data: settings } = await supabase.from("agency_settings").select("agencies_free").limit(1).maybeSingle()
    FREE_FOR_AGENCIES = settings ? Boolean((settings as { agencies_free: boolean }).agencies_free) : true

    const { data: agents, error } = await supabase
      .from("agents")
      .select("id, business_name, agency_name, owner_name, email, phone, whatsapp, website, country, cities, agent_code, plan, status, verified, paid_until, hidden, created_at, doc_business_reg, doc_licence, doc_owner_id, doc_office_photo")
    if (error) throw new Error(error.message)

    const { data: syncRows } = await supabase.from("hubspot_sync").select("agent_id, company_id, contact_id, deal_id, hash")
    const saved = new Map((syncRows ?? []).map(r => [r.agent_id as string, r]))

    let synced = 0
    let skipped = 0
    const failures: string[] = []
    for (const a of (agents ?? []) as Agent[]) {
      if (a.hidden) {
        skipped++
        continue
      }
      // Same data as last time (stage depends on today's date too) -> nothing to send.
      const quick = await hashOf({ a, stage: stageOf(a) })
      const prev = saved.get(a.id)
      if (!force && prev?.hash === quick) {
        skipped++
        continue
      }
      try {
        const result = await syncAgent(a, prev ?? null)
        await supabase.from("hubspot_sync").upsert({
          agent_id: a.id,
          company_id: result.company_id,
          contact_id: result.contact_id,
          deal_id: result.deal_id,
          hash: quick,
          synced_at: new Date().toISOString(),
        })
        synced++
      } catch (e) {
        console.error("hubspot-sync agent failed", a.id, String(e))
        failures.push(`${nameOf(a)}: ${String(e).slice(0, 200)}`)
      }
    }
    return json({ ok: true, synced, skipped, failed: failures.length, failures })
  } catch (e) {
    console.error("hubspot-sync error", String(e))
    return json({ error: String(e) }, 500)
  }
})
