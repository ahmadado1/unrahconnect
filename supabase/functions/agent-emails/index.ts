import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"
import {
  BRAND,
  FROM_EMAIL,
  INFO_EMAIL,
  SUPPORT_EMAIL,
  ctaButton,
  escapeHtml,
  wrapEmail,
} from "../_shared/emailLayout.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
// Legacy service_role JWT (eyJ...). Must be the same value as Vault secret service_role_key.
const AGENT_EMAILS_KEY = (Deno.env.get("AGENT_EMAILS_KEY") || "").trim()
// Platform key used for database calls. May be the new sb_secret_ key, so it is not the incoming auth check.
const SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim()
const WHATSAPP_NUMBER = "+201222151335"
const WHATSAPP_URL = "https://wa.me/201222151335"

type EmailType =
  | "application_received"
  | "account_activated"
  | "reminder_7_days"
  | "reminder_1_day"
  | "expired"

type AgentMail = {
  agent_id: string
  email: string
  business_name: string | null
  owner_name: string | null
  agent_code: string | null
  plan: string | null
  paid_until: string | null
  type: EmailType
}

const LIFECYCLE = new Set<EmailType>(["application_received", "account_activated"])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function planLabel(plan: string | null) {
  if (plan === "pro" || plan === "featured") return "Pro (Featured)"
  if (plan === "basic" || plan === "listed") return "Basic (Listed)"
  return "Trial (Listed)"
}

function formatDate(value: string | null) {
  if (!value) return ""
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return value
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

function renewLine() {
  return `
    <p style="margin:20px 0 0;padding:14px 16px;background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;color:${BRAND.text};">
      <strong style="color:${BRAND.navy};">How to renew.</strong>
      Email <a href="mailto:${INFO_EMAIL}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">${INFO_EMAIL}</a>
      or WhatsApp <a href="${WHATSAPP_URL}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">${WHATSAPP_NUMBER}</a>.
    </p>
  `
}

function greeting(name: string) {
  return `<p style="margin:0 0 16px;color:${BRAND.muted};">Assalamu Alaikum <strong style="color:${BRAND.navy};">${name}</strong>,</p>`
}

function buildEmail(agent: AgentMail) {
  const name = escapeHtml(agent.owner_name?.trim() || "there")
  const business = escapeHtml(agent.business_name?.trim() || "your agency")
  const code = escapeHtml(agent.agent_code || "")
  const plan = escapeHtml(planLabel(agent.plan))
  const until = escapeHtml(formatDate(agent.paid_until))

  if (agent.type === "application_received") {
    return {
      subject: "We received your UmrahConnect agent application",
      html: wrapEmail(
        `
        <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">Application</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${BRAND.navy};font-weight:700;">Application received</h1>
        ${greeting(name)}
        <p style="margin:0 0 16px;color:${BRAND.muted};">
          We received the agent application for <strong style="color:${BRAND.navy};">${business}</strong>.
          It is pending review. We will email you when the account is activated.
        </p>
        ${renewLine()}
        ${ctaButton("Email us", `mailto:${INFO_EMAIL}`)}
        <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">
          Barak Allahu feekum,<br />
          <span style="font-weight:500;color:${BRAND.muted};">The UmrahConnect Team</span>
        </p>
        `,
        { title: "Application received", preheader: "Your UmrahConnect agent application is pending review." }
      ),
    }
  }

  if (agent.type === "account_activated") {
    return {
      subject: "Your UmrahConnect agent account is active",
      html: wrapEmail(
        `
        <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">Welcome</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${BRAND.navy};font-weight:700;">Account activated</h1>
        ${greeting(name)}
        <p style="margin:0 0 16px;color:${BRAND.muted};">
          <strong style="color:${BRAND.navy};">${business}</strong> is now active on UmrahConnect.
          Share this code with your pilgrims.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;margin:0 0 8px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Agent code</p>
              <p style="margin:0 0 14px;color:${BRAND.navy};font-size:22px;font-weight:700;letter-spacing:2px;">${code}</p>
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Plan</p>
              <p style="margin:0;color:${BRAND.text};font-weight:600;">${plan}</p>
            </td>
          </tr>
        </table>
        ${renewLine()}
        ${ctaButton("Email us", `mailto:${INFO_EMAIL}`)}
        <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">
          Barak Allahu feekum,<br />
          <span style="font-weight:500;color:${BRAND.muted};">The UmrahConnect Team</span>
        </p>
        `,
        { title: "Account activated", preheader: `Your agent code is ${agent.agent_code || ""}.` }
      ),
    }
  }

  if (agent.type === "reminder_7_days" || agent.type === "reminder_1_day") {
    const when = agent.type === "reminder_7_days" ? "in 7 days" : "tomorrow"
    return {
      subject: `Your UmrahConnect listing renews ${when}`,
      html: wrapEmail(
        `
        <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">Renewal</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${BRAND.navy};font-weight:700;">Your listing ends ${when}</h1>
        ${greeting(name)}
        <p style="margin:0 0 16px;color:${BRAND.muted};">
          The listing for <strong style="color:${BRAND.navy};">${business}</strong>
          is paid through <strong style="color:${BRAND.navy};">${until}</strong>.
          After that date it is hidden until you renew.
        </p>
        ${renewLine()}
        ${ctaButton("Email us to renew", `mailto:${INFO_EMAIL}`)}
        <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">
          Barak Allahu feekum,<br />
          <span style="font-weight:500;color:${BRAND.muted};">The UmrahConnect Team</span>
        </p>
        `,
        { title: "Renewal reminder", preheader: `Your UmrahConnect listing ends ${when}.` }
      ),
    }
  }

  return {
    subject: "Your UmrahConnect listing has expired",
    html: wrapEmail(
      `
      <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">Expired</p>
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${BRAND.navy};font-weight:700;">Your listing is hidden</h1>
      ${greeting(name)}
      <p style="margin:0 0 16px;color:${BRAND.muted};">
        The listing for <strong style="color:${BRAND.navy};">${business}</strong>
        ended on <strong style="color:${BRAND.navy};">${until}</strong>.
        It stays hidden until you renew.
      </p>
      ${renewLine()}
      ${ctaButton("Email us to renew", `mailto:${INFO_EMAIL}`)}
      <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">
        Barak Allahu feekum,<br />
        <span style="font-weight:500;color:${BRAND.muted};">The UmrahConnect Team</span>
      </p>
      `,
      { title: "Listing expired", preheader: "Your UmrahConnect listing is hidden until you renew." }
    ),
  }
}

async function sendWithResend(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      reply_to: [INFO_EMAIL, SUPPORT_EMAIL],
      bcc: [INFO_EMAIL],
      subject,
      html,
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : JSON.stringify(data))
  }
  return data
}

function presentedToken(header: string) {
  let token = header.trim()
  while (/^bearer\s+/i.test(token)) {
    token = token.replace(/^bearer\s+/i, "").trim()
  }
  return token
}

serve(async (req) => {
  console.log("agent-emails: request received", { method: req.method })
  if (req.method !== "POST") return json({ error: "POST only" }, 405)

  const header = req.headers.get("Authorization") || ""
  const presented = presentedToken(header)
  const authMatch = presented.length > 0 && presented === AGENT_EMAILS_KEY
  console.log("agent-emails: auth check", {
    auth_present: presented.length > 0,
    auth_match: authMatch,
    presented_length: presented.length,
    agent_emails_key_length: AGENT_EMAILS_KEY.length,
  })
  if (!authMatch) {
    console.log("agent-emails: rejected, AGENT_EMAILS_KEY does not match")
    return json({ error: "Unauthorized" }, 401)
  }
  if (!RESEND_API_KEY) {
    console.log("agent-emails: RESEND_API_KEY is not set")
    return json({ error: "RESEND_API_KEY is not set" }, 500)
  }
  if (!SUPABASE_URL) {
    console.log("agent-emails: SUPABASE_URL is not set")
    return json({ error: "SUPABASE_URL is not set" }, 500)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const body = await req.json().catch(() => ({}))
    const mode = String(body.mode || "")
    let queue: AgentMail[] = []
    console.log("agent-emails: payload", {
      mode: mode || null,
      type: body.type ?? null,
      agent_id: body.agent_id ?? null,
    })

    if (mode === "daily") {
      const { data, error } = await supabase.rpc("agent_emails_due")
      if (error) throw new Error(error.message)
      queue = (data ?? []) as AgentMail[]
      console.log("agent-emails: daily queue", { count: queue.length })
    } else {
      const type = String(body.type || "") as EmailType
      const agentId = String(body.agent_id || "")
      if (!agentId || (type !== "application_received" && type !== "account_activated")) {
        console.log("agent-emails: bad payload", { type, agentId })
        return json({ error: "Send mode daily, or agent_id with application_received or account_activated" }, 400)
      }
      const { data, error } = await supabase
        .from("agents")
        .select("id, email, business_name, agency_name, owner_name, agent_code, referral_code, plan, paid_until")
        .eq("id", agentId)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) {
        console.log("agent-emails: agent not found", { agent_id: agentId })
        return json({ skipped: true, reason: "agent not found" })
      }
      console.log("agent-emails: agent found", {
        agent_id: data.id,
        email_type: type,
        to: data.email || null,
        from: FROM_EMAIL,
      })
      if (!data.email) {
        console.log("agent-emails: agent row has no email column value", { agent_id: data.id })
        return json({ skipped: true, reason: "no email" })
      }
      queue = [{
        agent_id: data.id,
        email: data.email,
        business_name: data.business_name || data.agency_name,
        owner_name: data.owner_name,
        agent_code: data.agent_code || data.referral_code,
        plan: data.plan,
        paid_until: data.paid_until,
        type,
      }]
    }

    const results: { agent_id: string; type: string; status: string }[] = []

    for (const agent of queue) {
      const claim: { agent_id: string; type: string; paid_until?: string | null } = {
        agent_id: agent.agent_id,
        type: agent.type,
      }
      if (!LIFECYCLE.has(agent.type)) claim.paid_until = agent.paid_until

      const { error: claimError } = await supabase.from("agent_email_log").insert(claim)
      if (claimError) {
        if (claimError.code === "23505") {
          results.push({ agent_id: agent.agent_id, type: agent.type, status: "already_sent" })
          continue
        }
        results.push({ agent_id: agent.agent_id, type: agent.type, status: claimError.message })
        continue
      }

      try {
        const message = buildEmail(agent)
        console.log("agent-emails: sending", {
          agent_id: agent.agent_id,
          email_type: agent.type,
          to: agent.email,
          from: FROM_EMAIL,
          subject: message.subject,
        })
        const resend = await sendWithResend(agent.email, message.subject, message.html)
        console.log("agent-emails: Resend response", resend)
        results.push({ agent_id: agent.agent_id, type: agent.type, status: "sent" })
      } catch (error) {
        console.log("agent-emails: Resend failed", error instanceof Error ? error.message : error)
        await supabase.from("agent_email_log").delete().match({
          agent_id: agent.agent_id,
          type: agent.type,
          ...(LIFECYCLE.has(agent.type) ? {} : { paid_until: agent.paid_until }),
        })
        results.push({
          agent_id: agent.agent_id,
          type: agent.type,
          status: error instanceof Error ? error.message : "send_failed",
        })
      }
    }

    return json({ ok: true, results })
  } catch (error) {
    console.log("agent-emails error:", error)
    return json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
