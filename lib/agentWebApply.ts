// Opens the agency application (website form) inside the app's browser, already logged in.
// The website gives a one-time login link for this account (see /api/agents/app-handoff),
// the person fills "Agency details" then "Documents" (PDF, photos or camera all work there),
// and when they finish the website sends them back to umrahconnect://agent/apply, which closes the browser.
import * as WebBrowser from "expo-web-browser"
import i18n from "@/i18n"
import { supabase } from "./supabase"

const SITE_URL = "https://myumrahconnect.com"
const RETURN_URL = "umrahconnect://agent/apply"

/** Asks the website for the one-time login link. Falls back to the plain page (they log in there). */
async function handoffUrl(lang: string) {
  const fallback = `${SITE_URL}/agents/app#lang=${encodeURIComponent(lang)}`
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return fallback
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(`${SITE_URL}/api/agents/app-handoff`, {
      signal: controller.signal,
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    }).finally(() => clearTimeout(timer))
    const data = await res.json().catch(() => null)
    return typeof data?.url === "string" ? data.url : fallback
  } catch (e) {
    console.log("Agency hand-off failed:", e)
    return fallback
  }
}

/** Opens the form; resolves when the browser closes. `done` = they sent everything. */
export async function openAgentWebApplication(): Promise<{ done: boolean }> {
  const lang = (i18n.language || "en").slice(0, 2)
  const url = await handoffUrl(lang)
  const result = await WebBrowser.openAuthSessionAsync(url, RETURN_URL, { showInRecents: true })
  return { done: result.type === "success" && String(result.url || "").includes("done=1") }
}
