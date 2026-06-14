import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  try {
    const body = await req.json()
    const { guest_name, guest_email } = body

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UmrahConnect <noreply@myumrahconnect.com>",
        to: guest_email,
        subject: "Welcome to UmrahConnect 🌙",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px;">
            <div style="background: #1E3A5F; border-radius: 16px; padding: 32px; text-align: center;">
              <h1 style="color: #C9A84C; margin-bottom: 4px;">🌙 UmrahConnect</h1>
              <p style="color: rgba(255,255,255,0.6); margin-bottom: 24px;">Your complete Umrah & Hajj companion</p>
              <h2 style="color: #fff; margin-bottom: 16px;">Assalamu Alaikum, ${guest_name}! 🤲</h2>
              <p style="color: rgba(255,255,255,0.8); margin-bottom: 24px; line-height: 1.6;">
                Welcome to UmrahConnect. We're honored to be part of your spiritual journey.
              </p>
              <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: left; margin-bottom: 24px;">
                <p style="color: #C9A84C; font-weight: bold; margin-bottom: 12px;">What you can do:</p>
                <p style="color: #fff; margin: 8px 0;">🕋 Follow your Umrah & Hajj guide step by step</p>
                <p style="color: #fff; margin: 8px 0;">📖 Read the Quran with translations</p>
                <p style="color: #fff; margin: 8px 0;">🕌 Get accurate prayer times</p>
                <p style="color: #fff; margin: 8px 0;">🤲 Access hundreds of duas</p>
                <p style="color: #fff; margin: 8px 0;">🏨 Book hotels near Haram</p>
              </div>
              <p style="color: rgba(255,255,255,0.5); font-size: 12px;">Barak Allahu Feekum 🤲</p>
            </div>
          </div>
        `,
      }),
    })

    const data = await res.json()
    console.log("Resend response:", JSON.stringify(data))
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    console.log("Function error:", e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})