// Supabase Edge Function: "About this surah" text from the Quran Foundation (Quran.com's official API).
// The Quran Foundation needs a client id + secret, which must never be inside the app, so the app
// asks this function. Answers are saved in the table surah_info_cache, so each surah + language is
// fetched from the Quran Foundation only once.
//
// Secrets (Supabase Dashboard > Edge Functions > Secrets):
//   QF_CLIENT_ID, QF_CLIENT_SECRET   (from https://api-docs.quran.foundation, "Request Access")
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const TOKEN_URL = "https://oauth2.quran.foundation/oauth2/token"
const API_BASE = "https://apis.quran.foundation/content/api/v4"
const LANGS = new Set(["en", "ar", "fr", "ur", "tr", "bn"])

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

let token: { value: string; until: number } | null = null

async function getToken(id: string, secret: string) {
  if (token && Date.now() < token.until) return token.value
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=content",
  })
  if (!res.ok) throw new Error(`token ${res.status}`)
  const json = await res.json()
  token = { value: json.access_token, until: Date.now() + (Number(json.expires_in || 3600) - 120) * 1000 }
  return token.value
}

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  try {
    const { surah, lang } = await req.json().catch(() => ({}))
    const number = Number(surah)
    if (!Number.isInteger(number) || number < 1 || number > 114) return reply({ error: "bad_surah" }, 400)
    const language = LANGS.has(String(lang)) ? String(lang) : "en"

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const { data: cached } = await supabase
      .from("surah_info_cache")
      .select("text, short_text, source, language")
      .eq("surah", number)
      .eq("language", language)
      .maybeSingle()
    if (cached?.text) return reply(cached)

    const id = Deno.env.get("QF_CLIENT_ID")
    const secret = Deno.env.get("QF_CLIENT_SECRET")
    if (!id || !secret) return reply({ error: "not_configured" }, 503)

    const access = await getToken(id, secret)
    const res = await fetch(`${API_BASE}/chapters/${number}/info?language=${language}`, {
      headers: { "x-auth-token": access, "x-client-id": id, Accept: "application/json" },
    })
    if (!res.ok) return reply({ error: `upstream_${res.status}` }, 502)
    const json = await res.json()
    const info = json?.chapter_info ?? {}
    const row = {
      surah: number,
      language,
      text: String(info.text ?? ""),
      short_text: String(info.short_text ?? ""),
      source: String(info.source ?? ""),
      updated_at: new Date().toISOString(),
    }
    if (row.text) await supabase.from("surah_info_cache").upsert(row, { onConflict: "surah,language" })
    return reply({ text: row.text, short_text: row.short_text, source: row.source, language })
  } catch (e) {
    console.error("surah-info error:", e)
    return reply({ error: "failed" }, 500)
  }
})
