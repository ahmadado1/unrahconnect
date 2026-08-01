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
- Home tab: daily verse, prayer countdown, dhikr, checklist progress → home
- Guide tab: Umrah checklist, Hajj guide, Quran reader, Qibla, Islamic calendar, AI Guide
- Maps: Makkah landmarks (haram, zamzam, safa, mina, arafah) and Madinah (nabawi / Rawdah)
- Services: Hotels, Restaurants, Transport, Hospitals, Travel Agents, Shopping
- Me tab: profile, settings, language, bookmarks

DEEP LINK MARKERS (REQUIRED WHEN RELEVANT):
At the end of your response, when the user can open a specific screen in the app, include up to 3 markers in this exact format (on their own lines):
[LINK: screenPath | Label]

Rules:
- Maximum 3 [LINK: ...] markers per response
- Place them at the very end of the reply
- Do not wrap markers in code fences or markdown links
- For general Islamic knowledge with no matching app screen, omit markers entirely
- Prefer the most specific destination (exact surah, exact Umrah/Hajj step, exact map site)

Allowed screenPath values (examples):
- quran/18 → open Surah Al-Kahf
- quran/36 → open Surah Ya-Sin
- quran → Quran list
- umrah/1 → Madinah Visit step
- umrah/2 → Ihram
- umrah/3 → Arriving in Makkah
- umrah/4 or umrah/tawaf → Tawaf
- umrah/5 or umrah/sai → Sa'i
- umrah/6 or umrah/halq → Halq/Taqsir
- umrah/7 → Umrah Complete
- umrah-guide → full Umrah checklist
- hajj → Hajj guide overview
- hajj/4 → Day of Arafah (Hajj step 4)
- maps/haram or maps/makkah → Makkah / Masjid al-Haram map
- maps/nabawi or maps/madinah → Madinah / Masjid Nabawi map (Rawdah, Prophet's grave)
- maps/zamzam → Zamzam
- maps/safa → Safa & Marwah
- maps/mina → Mina
- maps/arafah → Arafah
- qiblah → Qibla compass
- hotels → Hotels
- restaurants → Restaurants
- hospitals → Hospitals (maps/hospital-makkah)
- travel-agents → Find an agent
- home → Home / prayer times
- services → Services tab

Examples:
[LINK: quran/18 | Read Al-Kahf]
[LINK: umrah/tawaf | Tawaf Guide]
[LINK: maps/madinah | Madinah Map]

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
      stream: wantStream = true,
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

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        stream: wantStream !== false,
        system: systemPrompt,
        messages,
      }),
    })

    if (!anthropicRes.ok) {
      const errData = await anthropicRes.json().catch(() => ({}))
      return new Response(
        JSON.stringify({ error: errData.error?.message ?? "Anthropic request failed" }),
        {
          status: anthropicRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Non-streaming fallback (legacy clients)
    if (wantStream === false) {
      const data = await anthropicRes.json()
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't generate a response."
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Transform Anthropic SSE → simple SSE: data: {"type":"text","text":"..."} / {"type":"done"}
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicRes.body?.getReader()
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "No stream body" })}\n\n`))
          controller.close()
          return
        }

        let buffer = ""
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const parts = buffer.split("\n")
            buffer = parts.pop() ?? ""

            for (const line of parts) {
              const trimmed = line.trim()
              if (!trimmed.startsWith("data:")) continue
              const payload = trimmed.slice(5).trim()
              if (!payload || payload === "[DONE]") continue

              try {
                const event = JSON.parse(payload)
                if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                  const text = event.delta.text ?? ""
                  if (text) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`),
                    )
                  }
                } else if (event.type === "message_stop") {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
                } else if (event.type === "error") {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "error",
                        error: event.error?.message ?? "Stream error",
                      })}\n\n`,
                    ),
                  )
                }
              } catch {
                // skip malformed SSE chunks
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
        } catch (e) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: String(e) })}\n\n`,
            ),
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
