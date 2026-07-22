import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  BRAND,
  FROM_EMAIL,
  SUPPORT_EMAIL,
  ctaButton,
  escapeHtml,
  wrapEmail,
} from "../_shared/emailLayout.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  try {
    const body = await req.json()
    const guest_name = String(body.guest_name || "Pilgrim").trim() || "Pilgrim"
    const guest_email = String(body.guest_email || "").trim()

    if (!guest_email) {
      return new Response(JSON.stringify({ error: "guest_email is required" }), { status: 400 })
    }

    const safeName = escapeHtml(guest_name)

    const html = wrapEmail(
      `
        <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">Welcome</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${BRAND.navy};font-weight:700;">Assalamu Alaikum, ${safeName}</h1>
        <p style="margin:0 0 16px;color:${BRAND.muted};">
          Thank you for joining <strong style="color:${BRAND.navy};">UmrahConnect</strong>. We are honored to support you as you prepare for Umrah and Hajj.
        </p>
        <p style="margin:0 0 22px;color:${BRAND.muted};">
          Your account is ready. Inside the app you will find carefully organized guides, prayer times, Quran reading, and practical tools for your journey.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;margin:0 0 8px;">
          <tr>
            <td style="padding:20px 22px;">
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:0.7px;color:${BRAND.navy};text-transform:uppercase;">Included with your account</p>
              <p style="margin:0 0 10px;color:${BRAND.text};font-size:14px;"><span style="color:${BRAND.gold};font-weight:700;">●</span>&nbsp;&nbsp;Step-by-step Umrah &amp; Hajj guidance</p>
              <p style="margin:0 0 10px;color:${BRAND.text};font-size:14px;"><span style="color:${BRAND.gold};font-weight:700;">●</span>&nbsp;&nbsp;Quran with translations</p>
              <p style="margin:0 0 10px;color:${BRAND.text};font-size:14px;"><span style="color:${BRAND.gold};font-weight:700;">●</span>&nbsp;&nbsp;Accurate local prayer times &amp; Adhan</p>
              <p style="margin:0 0 10px;color:${BRAND.text};font-size:14px;"><span style="color:${BRAND.gold};font-weight:700;">●</span>&nbsp;&nbsp;Curated duas for each stage of the journey</p>
              <p style="margin:0;color:${BRAND.text};font-size:14px;"><span style="color:${BRAND.gold};font-weight:700;">●</span>&nbsp;&nbsp;Hotels, restaurants, and trusted travel agents</p>
            </td>
          </tr>
        </table>

        ${ctaButton("Open UmrahConnect", "https://myumrahconnect.com")}

        <p style="margin:24px 0 0;color:${BRAND.muted};font-size:14px;">
          If you need assistance at any time, reply to this email or contact us at
          <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>.
        </p>
        <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">
          Barak Allahu feekum,<br />
          <span style="font-weight:500;color:${BRAND.muted};">The UmrahConnect Team</span>
        </p>
      `,
      {
        title: "Welcome to UmrahConnect",
        preheader: `Assalamu Alaikum ${guest_name} — your UmrahConnect account is ready.`,
      }
    )

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: guest_email,
        reply_to: SUPPORT_EMAIL,
        subject: "Welcome to UmrahConnect",
        html,
      }),
    })

    const data = await res.json()
    console.log("Resend response:", JSON.stringify(data))
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: res.ok ? 200 : 502,
    })
  } catch (e) {
    console.log("Function error:", e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
