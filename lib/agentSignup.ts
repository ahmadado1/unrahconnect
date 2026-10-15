// Agent sign-up from the app. Writes the same agents row as the website's Agent signup,
// then asks the website to send the "Application received" email (with the link to upload documents).
import { supabase } from "./supabase"

const SITE_URL = "https://myumrahconnect.com"

export type AgentApplication = {
  businessName: string
  ownerName: string
  licenseNumber: string
  country: string
  cities: string
  phone: string
  whatsapp: string
  website: string
  description: string
  language: string
}

function citiesToList(value: string) {
  return value
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean)
}

/** Creates (or updates) the signed-in user's agency. Status stays "pending" until the admin verifies it. */
export async function submitAgentApplication(values: AgentApplication) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in")

  const payload = {
    business_name: values.businessName.trim(),
    agency_name: values.businessName.trim(),
    owner_name: values.ownerName.trim() || "Agent",
    license_number: values.licenseNumber.trim() || null,
    country: values.country.trim() || null,
    cities: citiesToList(values.cities),
    phone: values.phone.trim() || null,
    whatsapp: values.whatsapp.trim() || values.phone.trim() || null,
    email: user.email ?? null,
    website: values.website.trim() || null,
    description: values.description.trim() || null,
  }

  const { data: existing } = await supabase
    .from("agents")
    .select("id")
    .or(`owner_user_id.eq.${user.id},user_id.eq.${user.id}`)
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase.from("agents").update(payload).eq("id", existing.id)
    if (error) throw new Error(error.message)
    return { created: false }
  }

  const { error } = await supabase.from("agents").insert({
    ...payload,
    owner_user_id: user.id,
    user_id: user.id,
    status: "pending",
    plan: "basic",
    verified: false,
    paid_until: null,
    language: values.language || "en",
  })
  if (error) throw new Error(error.message)

  // Fire and forget: the email must never hold up sign-up (the website may be slow or not live yet).
  void requestApplicationEmail()
  return { created: true }
}

/** Asks the website to email "Application received". Never blocks sign-up if it fails. */
async function requestApplicationEmail() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    await fetch(`${SITE_URL}/api/agents/email`, {
      signal: controller.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "application_received" }),
    }).finally(() => clearTimeout(timer))
  } catch (e) {
    console.log("Application email request failed:", e)
  }
}
