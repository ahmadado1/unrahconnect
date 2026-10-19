// Supabase Edge Function: RevenueCat tells us about in-app purchases here
// (new purchase, renewal, cancellation, refund, expiry, restore on another account...).
//
// For every event we ask RevenueCat for the user's CURRENT Premium date and save it in
// user_premium.store_until. Asking again (instead of trusting each event) keeps it right even
// when events arrive late or out of order. Website Premium (premium_until) is never touched.
//
// Secrets (Supabase Dashboard > Edge Functions > Secrets):
//   REVENUECAT_WEBHOOK_AUTH  any long random text; the same text goes in RevenueCat > Integrations > Webhooks > Authorization header
//   REVENUECAT_SECRET_KEY    RevenueCat > API keys > Secret key (starts with sk_). Never put it in the app.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const ENTITLEMENT = "premium"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

/** Current Premium of one app user, from RevenueCat. null = no Premium. */
async function premiumFromRevenueCat(appUserId: string, secret: string) {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`revenuecat ${res.status}`)
  const json = await res.json()
  const ent = json?.subscriber?.entitlements?.[ENTITLEMENT]
  if (!ent) return null
  const product = String(ent.product_identifier ?? "")
  const sub = json?.subscriber?.subscriptions?.[product] ?? {}
  return {
    // null expires_date = lifetime
    until: ent.expires_date ? String(ent.expires_date) : "2099-12-31T00:00:00Z",
    product,
    store: String(sub.store ?? ""),
  }
}

serve(async req => {
  if (req.method !== "POST") return reply({ error: "method" }, 405)
  const auth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH")
  if (!auth || req.headers.get("Authorization") !== auth) return reply({ error: "unauthorized" }, 401)
  const secret = Deno.env.get("REVENUECAT_SECRET_KEY")
  if (!secret) return reply({ error: "not_configured" }, 503)

  try {
    const body = await req.json()
    const event = body?.event ?? {}
    if (event.type === "TEST") return reply({ ok: true, test: true })

    // Every account this event is about (a transfer moves Premium from one account to another).
    const ids = new Set<string>()
    for (const v of [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? []), ...(event.transferred_from ?? []), ...(event.transferred_to ?? [])]) {
      if (typeof v === "string" && UUID.test(v)) ids.add(v)
    }
    if (!ids.size) return reply({ ok: true, skipped: "no account id" })

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    for (const userId of ids) {
      const info = await premiumFromRevenueCat(userId, secret)
      const store = info?.store === "app_store" ? "apple" : info?.store === "play_store" ? "google" : info?.store || null
      const plan = info ? (/year|annual/i.test(info.product) ? "yearly" : "monthly") : null
      // Keep the website columns as they are; only the store_* columns change here.
      const { data: existing } = await supabase.from("user_premium").select("user_id").eq("user_id", userId).maybeSingle()
      const row = {
        store_until: info?.until ?? null,
        store_product: info?.product ?? null,
        store_name: store,
        store_event: String(event.type ?? ""),
        updated_at: new Date().toISOString(),
      }
      if (existing) {
        await supabase.from("user_premium").update(row).eq("user_id", userId)
      } else if (info) {
        await supabase.from("user_premium").insert({ user_id: userId, plan, source: store ?? "store", ...row })
      }
    }
    return reply({ ok: true })
  } catch (e) {
    console.error("revenuecat-webhook error:", e)
    // 500 makes RevenueCat try again later.
    return reply({ error: "failed" }, 500)
  }
})
