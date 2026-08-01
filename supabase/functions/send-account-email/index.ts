import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

type AccountEmailType = "password_changed" | "account_deleted"

serve(async (req) => {
  try {
    const body = await req.json()
    const type = String(body.type || "").trim() as AccountEmailType
    const guest_name = String(body.guest_name || "Pilgrim").trim() || "Pilgrim"
    const guest_email = String(body.guest_email || "").trim()

    if (!guest_email) {
      return new Response(JSON.stringify({ error: "guest_email is required" }), { status: 400 })
    }
    if (type !== "password_changed" && type !== "account_deleted") {
      return new Response(JSON.stringify({ error: "type must be password_changed or account_deleted" }), {
        status: 400,
      })
    }

    const safeName = escapeHtml(guest_name)
    const when = new Date().toUTCString()

    let subject = ""
    let html = ""

    if (type === "password_changed") {
      subject = "Your UmrahConnect password was changed"
      html = wrapEmail(
        `
        <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">Security notice</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${BRAND.navy};font-weight:700;">Password updated</h1>
        <p style="margin:0 0 16px;color:${BRAND.muted};">
          Assalamu Alaikum <strong style="color:${BRAND.navy};">${safeName}</strong>,
          this confirms that the password for your UmrahConnect account was changed successfully.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;margin:0 0 20px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Account</p>
              <p style="margin:0 0 12px;color:${BRAND.text};font-weight:600;">${escapeHtml(guest_email)}</p>
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">When</p>
              <p style="margin:0;color:${BRAND.text};font-weight:600;">${escapeHtml(when)}</p>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;color:${BRAND.muted};">
          If you made this change, no further action is needed. If you did not change your password,
          please reset it immediately and contact us at
          <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
          or
          <a href="mailto:${INFO_EMAIL}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">${INFO_EMAIL}</a>.
        </p>
        ${ctaButton("Open UmrahConnect", "https://myumrahconnect.com")}
        <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">
          Barak Allahu feekum,<br />
          <span style="font-weight:500;color:${BRAND.muted};">The UmrahConnect Team</span>
        </p>
        `,
        {
          title: "Password changed",
          preheader: "Your UmrahConnect password was updated.",
        }
      )
    } else {
      subject = "Your UmrahConnect account has been deleted"
      html = wrapEmail(
        `
        <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">Account closed</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${BRAND.navy};font-weight:700;">Account deleted</h1>
        <p style="margin:0 0 16px;color:${BRAND.muted};">
          Assalamu Alaikum <strong style="color:${BRAND.navy};">${safeName}</strong>,
          this confirms that your UmrahConnect account and associated app data have been deleted as requested.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;margin:0 0 20px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Former account</p>
              <p style="margin:0 0 12px;color:${BRAND.text};font-weight:600;">${escapeHtml(guest_email)}</p>
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">When</p>
              <p style="margin:0;color:${BRAND.text};font-weight:600;">${escapeHtml(when)}</p>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;color:${BRAND.muted};">
          We are sorry to see you go. If this was a mistake or you need help restoring access, contact
          <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
          or
          <a href="mailto:${INFO_EMAIL}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">${INFO_EMAIL}</a>.
          You are always welcome to create a new account anytime.
        </p>
        ${ctaButton("Visit UmrahConnect", "https://myumrahconnect.com")}
        <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">
          Barak Allahu feekum,<br />
          <span style="font-weight:500;color:${BRAND.muted};">The UmrahConnect Team</span>
        </p>
        `,
        {
          title: "Account deleted",
          preheader: "Your UmrahConnect account has been deleted.",
        }
      )
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: guest_email,
        reply_to: [SUPPORT_EMAIL, INFO_EMAIL],
        bcc: [INFO_EMAIL],
        subject,
        html,
      }),
    })

    const data = await res.json()
    console.log("Resend account email:", type, JSON.stringify(data))
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: res.ok ? 200 : 502,
    })
  } catch (e) {
    console.log("send-account-email error:", e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
