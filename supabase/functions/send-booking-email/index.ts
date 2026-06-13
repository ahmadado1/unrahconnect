import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  try {
    const body = await req.json()
    const { hotel_name, hotel_city, guest_name, guest_email, 
            guest_phone, check_in, check_out, guests, nights, total_price, special_requests } = body

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UmrahConnect <noreply@myumrahconnect.com>",
        to: guest_email,
        subject: `Booking Confirmed — ${hotel_name} 🕋`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f5f0e8;">
  <div style="background: #1E3A5F; border-radius: 16px; padding: 40px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #C9A84C; font-size: 28px; margin-bottom: 4px;">🌙 UmrahConnect</h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0;">Your complete Umrah companion</p>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
      <h2 style="color: #fff; font-size: 24px; margin-bottom: 8px;">Booking Request Received!</h2>
      <p style="color: rgba(255,255,255,0.7); font-size: 15px;">
        Assalamu Alaikum ${guest_name}, we have received your booking request and will be in touch shortly.
      </p>
    </div>
    <div style="background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="color: #C9A84C; font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-bottom: 16px; margin-top: 0;">BOOKING DETAILS</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">Hotel</td>
          <td style="color: #fff; font-size: 13px; font-weight: bold; text-align: right; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">${hotel_name}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">City</td>
          <td style="color: #fff; font-size: 13px; text-align: right; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">${hotel_city}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">Check In</td>
          <td style="color: #fff; font-size: 13px; text-align: right; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">${check_in}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">Check Out</td>
          <td style="color: #fff; font-size: 13px; text-align: right; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">${check_out}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">Nights</td>
          <td style="color: #fff; font-size: 13px; text-align: right; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">${nights}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">Guests</td>
          <td style="color: #fff; font-size: 13px; text-align: right; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">${guests}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding: 8px 0;">Total Price</td>
          <td style="color: #C9A84C; font-size: 16px; font-weight: bold; text-align: right; padding: 8px 0;">$${total_price}</td>
        </tr>
      </table>
    </div>
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #C9A84C; font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-bottom: 12px; margin-top: 0;">GUEST INFORMATION</p>
      <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 4px 0;">👤 ${guest_name}</p>
      <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 4px 0;">📧 ${guest_email}</p>
      <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 4px 0;">📞 ${guest_phone}</p>
    </div>
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 32px;">
      <p style="color: #C9A84C; font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; margin-top: 0;">SPECIAL REQUESTS</p>
      <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0;">${special_requests || "None"}</p>
    </div>
    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
      <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6;">
        Our team will contact you within 24 hours to confirm your reservation. May Allah make your journey blessed and accepted. 🤲
      </p>
      <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin-top: 16px;">
        UmrahConnect · Your spiritual journey companion
      </p>
    </div>
  </div>
</div>`,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})