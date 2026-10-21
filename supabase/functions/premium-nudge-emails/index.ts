// Supabase Edge Function: "premium-nudge-emails"
//
// Sends a few friendly emails about UmrahConnect Premium, in the user's own app language:
//   • 30 minutes after a new account is made
//   • then after 3 days, 7 days, 14 days, and after that once a month (6 emails at most)
// It stops as soon as the user has Premium, is a travel agency, or taps "Unsubscribe".
// Emails are outside the app, so they may mention the website and OPay / MyNita / PayPal
// (Apple and Google allow this; the app itself may not).
//
// Runs every 15 minutes from pg_cron (see supabase/premium-nudges.sql).
// Secrets (Supabase → Edge Functions → Secrets): RESEND_API_KEY (already set), CRON_SECRET (new),
// optional NUDGE_DAILY_CAP (default 80, keeps us under the Resend daily limit).
// Deploy: npx supabase@latest functions deploy premium-nudge-emails --no-verify-jwt --project-ref yqabuipymbaylholmmoi
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"
import { BRAND, FROM_EMAIL, SITE_URL, SUPPORT_EMAIL, ctaButton, escapeHtml, wrapEmail } from "../_shared/emailLayout.ts"
import { COPY, type Lang } from "./copy.ts"

const FUNCTION_URL = "https://yqabuipymbaylholmmoi.supabase.co/functions/v1/premium-nudge-emails"
const BATCH = 25

function db() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
}

function langOf(value: unknown): Lang {
  const l = String(value || "en").slice(0, 2).toLowerCase()
  return (l in COPY ? l : "en") as Lang
}

function html(lang: Lang, step: number, name: string, token: string) {
  const c = COPY[lang]
  const rtl = lang === "ar" || lang === "ur"
  const align = rtl ? "right" : "left"
  const intro = c.intro[Math.min(step, c.intro.length - 1)]
  const bullets = c.features
    .map(
      f =>
        `<p style="margin:0 0 10px;color:${BRAND.text};font-size:14px;"><span style="color:${BRAND.gold};font-weight:700;">●</span>&nbsp;&nbsp;${escapeHtml(f)}</p>`
    )
    .join("")
  const unsubUrl = `${FUNCTION_URL}?unsubscribe=${encodeURIComponent(token)}`
  const body = `
    <div dir="${rtl ? "rtl" : "ltr"}" style="text-align:${align};">
      <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;">UmrahConnect Premium</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;color:${BRAND.navy};font-weight:700;">${escapeHtml(c.hello.replace("{name}", name))}</h1>
      <p style="margin:0 0 18px;color:${BRAND.muted};line-height:1.6;">${escapeHtml(intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;margin:0 0 18px;">
        <tr><td style="padding:18px 20px;text-align:${align};">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.6px;color:${BRAND.navy};">${escapeHtml(c.featuresTitle)}</p>
          ${bullets}
        </td></tr>
      </table>
      <p style="margin:0 0 6px;color:${BRAND.navy};font-weight:700;">${escapeHtml(c.howTitle)}</p>
      <p style="margin:0 0 6px;color:${BRAND.muted};line-height:1.6;">${escapeHtml(c.howApp)}</p>
      <p style="margin:0 0 16px;color:${BRAND.muted};line-height:1.6;">${escapeHtml(c.howWeb)}</p>
      ${ctaButton(c.cta, `${SITE_URL}/account`)}
      <p style="margin:22px 0 0;color:${BRAND.muted};font-size:13px;line-height:1.6;">${escapeHtml(c.free)}</p>
      <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">${escapeHtml(c.sign)}</p>
      <p style="margin:22px 0 0;font-size:12px;color:${BRAND.muted};">
        <a href="${unsubUrl}" style="color:${BRAND.muted};">${escapeHtml(c.unsubscribe)}</a> ·
        <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.muted};">${SUPPORT_EMAIL}</a>
      </p>
    </div>`
  return wrapEmail(body, { title: c.subjects[0], preheader: intro.slice(0, 110) })
}

/** Unsubscribe link (GET ?unsubscribe=token): stop all Premium emails for this user. */
async function unsubscribe(token: string) {
  const ok = /^[0-9a-f-]{36}$/i.test(token)
  if (ok) await db().from("email_nudges").update({ unsubscribed: true }).eq("token", token)
  const page = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <body style="font-family:-apple-system,Segoe UI,sans-serif;background:#F7F3EC;color:#1E3A5F;text-align:center;padding:60px 20px;">
    <h2>UmrahConnect</h2>
    <p>${ok ? "You will not get these emails any more." : "This link is not valid."}</p>
    <p dir="rtl">${ok ? "لن تصلك هذه الرسائل بعد الآن." : "هذا الرابط غير صالح."}</p></body>`
  return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}

serve(async req => {
  const url = new URL(req.url)
  const unsub = url.searchParams.get("unsubscribe")
  if (req.method === "GET" && unsub) return unsubscribe(unsub)

  // Only our scheduled job may send.
  const secret = Deno.env.get("CRON_SECRET")
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }
  const resendKey = Deno.env.get("RESEND_API_KEY")
  if (!resendKey) return new Response(JSON.stringify({ error: "no RESEND_API_KEY" }), { status: 503 })

  const supabase = db()

  // Daily cap (Resend free plan allows 100 emails a day, the app also sends other emails).
  const cap = Number(Deno.env.get("NUDGE_DAILY_CAP") || 80)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase.from("email_nudges").select("user_id", { count: "exact", head: true }).gte("last_sent_at", since)
  const room = Math.max(0, Math.min(BATCH, cap - (count ?? 0)))
  if (!room) return new Response(JSON.stringify({ ok: true, sent: 0, reason: "daily cap" }))

  const { data: due, error } = await supabase.rpc("premium_nudge_due", { max_rows: room })
  if (error) {
    console.error("premium_nudge_due:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  for (const row of (due ?? []) as { user_id: string; email: string; full_name: string; language: string; step: number; token: string | null }[]) {
    const lang = langOf(row.language)
    const c = COPY[lang]
    const step = row.step ?? 0
    const name = (row.full_name || "").trim().split(/\s+/)[0] || c.pilgrim

    // Make sure the user has a row (and an unsubscribe token) before sending.
    let token = row.token
    if (!token) {
      const { data: created } = await supabase
        .from("email_nudges")
        .upsert({ user_id: row.user_id }, { onConflict: "user_id" })
        .select("token")
        .single()
      token = created?.token ?? null
    }
    if (!token) continue

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: row.email,
        reply_to: SUPPORT_EMAIL,
        subject: c.subjects[Math.min(step, c.subjects.length - 1)],
        html: html(lang, step, name, token),
        headers: { "List-Unsubscribe": `<${FUNCTION_URL}?unsubscribe=${token}>` },
      }),
    })
    if (!res.ok) {
      console.error("Resend failed for", row.user_id, res.status, await res.text())
      if (res.status === 429) break // rate limit: try again next run
      continue
    }
    await supabase
      .from("email_nudges")
      .update({ step: step + 1, last_sent_at: new Date().toISOString() })
      .eq("user_id", row.user_id)
    sent++
  }
  return new Response(JSON.stringify({ ok: true, sent }), { headers: { "Content-Type": "application/json" } })
})
