import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  BRAND,
  FROM_EMAIL,
  SUPPORT_EMAIL,
  detailRow,
  escapeHtml,
  wrapEmail,
} from "../_shared/emailLayout.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  try {
    const body = await req.json()
    const hotel_name = String(body.hotel_name || "Hotel").trim()
    const hotel_city = String(body.hotel_city || "").trim()
    const guest_name = String(body.guest_name || "Guest").trim() || "Guest"
    const guest_email = String(body.guest_email || "").trim()
    const guest_phone = String(body.guest_phone || "").trim()
    const check_in = String(body.check_in || "").trim()
    const check_out = String(body.check_out || "").trim()
    const guests = String(body.guests ?? "").trim()
    const nights = String(body.nights ?? "").trim()
    const total_price = body.total_price
    const special_requests = String(body.special_requests || "None").trim() || "None"

    if (!guest_email) {
      return new Response(JSON.stringify({ error: "guest_email is required" }), { status: 400 })
    }

    const totalDisplay =
      total_price !== undefined && total_price !== null && String(total_price).length > 0
        ? `$${total_price}`
        : "To be confirmed"

    const html = wrapEmail(
      `
        <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gold};font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">Booking request</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:${BRAND.navy};font-weight:700;">We have received your request</h1>
        <p style="margin:0 0 22px;color:${BRAND.muted};">
          Assalamu Alaikum <strong style="color:${BRAND.navy};">${escapeHtml(guest_name)}</strong>,
          thank you for choosing UmrahConnect. Your booking request has been submitted successfully and our team will review it shortly.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7F3;border:1px solid #C6E2D4;border-radius:10px;margin:0 0 24px;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0;font-size:14px;color:${BRAND.success};font-weight:600;">
                Status: Pending confirmation
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:${BRAND.muted};">
                A member of our team typically responds within 24 hours to confirm availability and finalize details.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.7px;color:${BRAND.navy};text-transform:uppercase;">Stay details</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-top:1px solid ${BRAND.border};">
          ${detailRow("Hotel", hotel_name)}
          ${detailRow("City", hotel_city || "—")}
          ${detailRow("Check-in", check_in || "—")}
          ${detailRow("Check-out", check_out || "—")}
          ${detailRow("Nights", nights || "—")}
          ${detailRow("Guests", guests || "—")}
          ${detailRow("Estimated total", totalDisplay, { last: true, emphasis: true })}
        </table>

        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.7px;color:${BRAND.navy};text-transform:uppercase;">Guest information</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-top:1px solid ${BRAND.border};">
          ${detailRow("Name", guest_name)}
          ${detailRow("Email", guest_email)}
          ${detailRow("Phone", guest_phone || "—", { last: true })}
        </table>

        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.7px;color:${BRAND.navy};text-transform:uppercase;">Special requests</p>
        <div style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;padding:16px 18px;margin:0 0 8px;">
          <p style="margin:0;color:${BRAND.text};font-size:14px;line-height:1.55;">${escapeHtml(special_requests)}</p>
        </div>

        <p style="margin:24px 0 0;color:${BRAND.muted};font-size:14px;">
          If any detail looks incorrect, reply to this email or contact
          <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
          and we will gladly assist you.
        </p>
        <p style="margin:18px 0 0;color:${BRAND.navy};font-size:14px;font-weight:600;">
          May Allah accept your journey,<br />
          <span style="font-weight:500;color:${BRAND.muted};">The UmrahConnect Team</span>
        </p>
      `,
      {
        title: `Booking request — ${hotel_name}`,
        preheader: `Booking request received for ${hotel_name}. Our team will confirm within 24 hours.`,
      }
    )

    const payload: Record<string, unknown> = {
      from: FROM_EMAIL,
      to: guest_email,
      reply_to: SUPPORT_EMAIL,
      subject: `Booking request received — ${hotel_name}`,
      html,
    }

    // Also notify the operations inbox when configured
    if (SUPPORT_EMAIL && SUPPORT_EMAIL !== guest_email) {
      payload.bcc = SUPPORT_EMAIL
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: res.ok ? 200 : 502,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
