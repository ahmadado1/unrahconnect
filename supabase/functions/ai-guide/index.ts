import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function buildSystemPrompt(language: string): string {
  return `You are the official AI guide for UmrahConnect app. You help pilgrims 
with everything related to Umrah, Hajj, Islam, and navigating Makkah 
and Madinah. Always respond in the user's language: ${language}

APP FEATURES:
- Quran reader with bookmarking and progress tracking
- Prayer times with Adhan sound and duas
- Umrah checklist with step by step guidance  
- Hotel and restaurant finder near Masjid al-Haram
- AI Guide (this feature)
- Available in English, Arabic, French, Urdu, Turkish, Bangla

NAVIGATION HELP:
Tell users exactly where to find things in the app.
Example: "Tap the Guide tab at the bottom, then select Checklist"
Use the actual tab names and screen names from the app's navigation.

MASJID AL-HARAM - MAKKAH:
Research and include all major gates, floors, zamzam locations,
wheelchair access points, sa'i path, tawaf levels, and key landmarks.

MASJID AL-NABAWI - MADINAH:
Research and include all major gates, Rawdah location, 
Riyad al-Jannah, key landmarks and directions.

SURROUNDING AREA:
Include Abraj Al-Bait / Clock Tower mall, Ajyad Mall, 
Hilton and Marriott locations, pharmacy locations, 
and key walking routes from hotels to Haram.

ISLAMIC KNOWLEDGE:
- Umrah and Hajj rituals step by step
- General Islamic questions
- Quran and hadith
- Prayer, fasting, zakat, pillars of Islam
- If unsure about a fatwa, always recommend consulting a scholar`
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages, language = "English" } = await req.json()
    const systemPrompt = buildSystemPrompt(language)

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message ?? "Anthropic request failed" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const reply = data.content?.[0]?.text ?? "Sorry, I couldn't generate a response."

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
