// Agency announcement → phone notification to every pilgrim connected to that agency.
// Called by the app and the website right after an announcement is posted: { announcementId }.
// Only the agency that owns the announcement (or an admin) can trigger it, and only once.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors })
  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const { data: who } = await db.auth.getUser(jwt)
    const userId = who?.user?.id
    if (!userId) return json({ error: "Not signed in" }, 401)

    const { announcementId } = await req.json().catch(() => ({}))
    if (!announcementId) return json({ error: "announcementId missing" }, 400)

    const { data: ann } = await db
      .from("agent_announcements")
      .select("id, agent_id, title, body, pushed_at, agents!inner(id, user_id, owner_user_id, business_name)")
      .eq("id", announcementId)
      .maybeSingle()
    if (!ann) return json({ error: "Not found" }, 404)
    // deno-lint-ignore no-explicit-any
    const agent = (ann as any).agents
    const { data: profile } = await db.from("profiles").select("role").eq("id", userId).maybeSingle()
    const owns = agent?.user_id === userId || agent?.owner_user_id === userId
    if (!owns && profile?.role !== "admin") return json({ error: "Not your announcement" }, 403)
    if (ann.pushed_at) return json({ ok: true, sent: 0, already: true })

    // Mark first, so a double tap can't send twice
    await db.from("agent_announcements").update({ pushed_at: new Date().toISOString() }).eq("id", ann.id).is("pushed_at", null)

    const { data: links } = await db.from("agent_pilgrims").select("user_id").eq("agent_id", ann.agent_id)
    const userIds = (links ?? []).map((l: { user_id: string }) => l.user_id)
    if (!userIds.length) return json({ ok: true, sent: 0 })
    const { data: tokens } = await db.from("push_tokens").select("token").in("user_id", userIds)
    const list = [...new Set((tokens ?? []).map((t: { token: string }) => t.token))]

    const title = `${agent?.business_name ?? "Your agency"}: ${ann.title}`.slice(0, 120)
    let sent = 0
    for (let i = 0; i < list.length; i += 100) {
      const batch = list.slice(i, i + 100).map((to) => ({
        to,
        title,
        body: String(ann.body).slice(0, 300),
        sound: "default",
        priority: "high",
        channelId: "agency-updates",
        data: { screen: "agency-announcement", agentId: ann.agent_id, announcementId: ann.id },
      }))
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      })
      const out = await res.json().catch(() => null)
      // Remove tokens of uninstalled apps
      // deno-lint-ignore no-explicit-any
      const results: any[] = out?.data ?? []
      const dead = results
        .map((r, k) => (r?.details?.error === "DeviceNotRegistered" ? batch[k].to : null))
        .filter(Boolean)
      if (dead.length) await db.from("push_tokens").delete().in("token", dead)
      sent += results.filter((r) => r?.status === "ok").length
    }
    return json({ ok: true, sent })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
