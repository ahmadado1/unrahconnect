import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const OFF_TOPIC_REPLY =
  "I'm your Umrah & Islamic guide — I can only help with Islamic topics and UmrahConnect features. Is there something about your Umrah journey I can help with?"

const UMRAH_STEP_NAMES: Record<number, string> = {
  1: "Madinah Visit (optional but recommended)",
  2: "Ihram — entering state of purity and intention",
  3: "Arriving in Makkah / preparing for the Haram",
  4: "Tawaf — 7 circles around the Kaaba",
  5: "Sa'i — walking between Safa and Marwa 7 times",
  6: "Halq or Taqsir — cutting hair",
  7: "Umrah Complete — exiting Ihram and additional worship",
}

type GuideContext = {
  userName?: string
  currentLanguage?: string
  language?: string
  umrahProgress?: number
  completedSteps?: string[]
  currentStep?: number
  currentStepName?: string
}

function buildSystemPrompt(ctx: GuideContext): string {
  const userName = (ctx.userName || "Pilgrim").trim() || "Pilgrim"
  const language = (ctx.currentLanguage || ctx.language || "English").trim() || "English"
  const currentStep = Math.min(7, Math.max(1, Number(ctx.currentStep) || 1))
  const umrahProgress = Math.min(7, Math.max(0, Number(ctx.umrahProgress) || currentStep))
  const currentStepName =
    (ctx.currentStepName || UMRAH_STEP_NAMES[currentStep] || `Step ${currentStep}`).trim()
  const completedSteps =
    Array.isArray(ctx.completedSteps) && ctx.completedSteps.length
      ? ctx.completedSteps.join(", ")
      : "None yet"

  return `You are the official AI guide for UmrahConnect, a companion app for Hajj and Umrah pilgrims.

User: ${userName}
Language: ${language}
Umrah Progress: Step ${currentStep} of 7 — ${currentStepName}
Progress value: ${umrahProgress}/7
Completed: ${completedSteps}

STRICT SCOPE — YOU MAY ONLY ANSWER:
- UmrahConnect app features and navigation
- Umrah and Hajj rituals and guidance
- General Islamic knowledge (Quran, hadith, prayer, fasting, zakat, Islamic history)
- Makkah and Madinah landmarks and services (gates, Zamzam, hotels near Haram, transport)

If the user asks anything outside these topics, reply EXACTLY with this message (translated into ${language} if needed, keeping the same meaning):
"${OFF_TOPIC_REPLY}"

APP SCREENS AND HOW TO NAVIGATE:
- Home tab: daily verse, prayer countdown, dhikr, checklist progress
- Guide tab: Umrah checklist, Hajj guide, Quran reader, Qibla, Islamic calendar, AI Guide
- Maps tab: Makkah and Madinah maps with landmarks
- Services tab: Hotels, Restaurants, Transport (Haramain Railway, SAPTCO, Uber), Shopping malls
- Me tab: profile, settings, language, bookmarks

Tell users exactly where to tap. Example: "Open the Guide tab, then tap the Umrah checklist."

UMRAH STEPS (reference the user's current progress naturally):
1. Madinah Visit (optional but recommended)
2. Ihram — entering state of purity and intention
3. Arriving in Makkah
4. Tawaf — 7 circles around the Kaaba
5. Sa'i — walking between Safa and Marwa 7 times
6. Halq or Taqsir — cutting hair
7. Completion — exiting Ihram and additional worship / duas

When relevant, reference progress like:
"Since you've completed Ihram and Tawaf already ${userName}, your next step is Sa'i — here's what to do..."

MASJID AL-HARAM GATES (reference when relevant):
King Abdulaziz Gate, King Fahd Gate, Umrah Gate, Safa Gate, King Abdullah Gate, Marwa Gate

ZAMZAM LOCATIONS:
Ground floor and basement of Masjid al-Haram, multiple stations throughout the mosque complex

MASJID AL-NABAWI:
Rawdah / Riyad al-Jannah, major gates, and visiting etiquette

RESPONSE STYLE:
- Always greet with Assalamu Alaikum on the first assistant reply in a conversation
- Address the user by name (${userName}) naturally — do not overuse it
- Reference their Umrah progress when it helps the answer
- End with brief encouragement (Barakallahu feek, May Allah accept your Umrah, etc.)
- If unsure about a fatwa always say "please consult a qualified scholar"
- Keep responses concise, warm, and spiritual
- Always respond in: ${language}
- Never answer questions unrelated to Islam or this app`
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      messages,
      language = "English",
      userName,
      currentLanguage,
      umrahProgress,
      completedSteps,
      currentStep,
      currentStepName,
    } = body

    const systemPrompt = buildSystemPrompt({
      userName,
      language,
      currentLanguage: currentLanguage || language,
      umrahProgress,
      completedSteps,
      currentStep,
      currentStepName,
    })

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages are required" }), {
        status: 400,
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
