// Agency application in the app: the same two forms as the website sign-up.
//   Form 1: agency details   → creates the agents row (status "pending")
//   Form 2: verification     → licence details + 4 documents (camera or photo library)
// Same table, same storage bucket ("agent-docs") and same file names as the website,
// so the admin page, emails and HubSpot work exactly the same.
import * as FileSystem from "expo-file-system/legacy"
import { requireOptionalNativeModule } from "expo-modules-core"
import { getUserFast, supabase } from "./supabase"

const SITE_URL = "https://myumrahconnect.com"

export const DOC_KEYS = ["doc_business_reg", "doc_licence", "doc_owner_id", "doc_office_photo"] as const
export type DocKey = (typeof DOC_KEYS)[number]

/** The signed-in agency's own row (the "own_agents" view only returns your own agency). */
export type MyApplication = {
  id: string
  business_name: string | null
  owner_name: string | null
  country: string | null
  cities: string[] | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  description: string | null
  status: string | null
  verified: boolean | null
  licence_number: string | null
  licence_authority: string | null
  business_reg_number: string | null
  office_address: string | null
  doc_business_reg: string | null
  doc_licence: string | null
  doc_owner_id: string | null
  doc_office_photo: string | null
  info_request?: string | null
}

export type VerificationForm = {
  licenceNumber: string
  licenceAuthority: string
  businessRegNumber: string
  officeAddress: string
}

/** A document chosen in the app but not uploaded yet. */
export type PickedDoc = { uri: string; mimeType: string }

// ─── Load ─────────────────────────────────────────────────────────────────
export async function getMyApplication(): Promise<MyApplication | null> {
  const { data: { user } } = await getUserFast()
  if (!user) return null
  const { data, error } = await supabase.from("own_agents").select("*").eq("owner_user_id", user.id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as MyApplication | null) ?? null
}

/** What is still missing before we can verify (licence number + 4 documents). */
export function applicationGaps(app: MyApplication | null): (DocKey | "licence_number")[] {
  if (!app) return ["licence_number", ...DOC_KEYS]
  const missing: (DocKey | "licence_number")[] = []
  if (!app.licence_number?.trim()) missing.push("licence_number")
  for (const key of DOC_KEYS) if (!app[key]?.trim()) missing.push(key)
  return missing
}

/** Where the agency is: no row yet → details form; row but gaps → documents form; else waiting/verified. */
export function applicationStage(app: MyApplication | null): "details" | "documents" | "review" | "verified" {
  if (!app) return "details"
  if (app.verified) return "verified"
  return applicationGaps(app).length ? "documents" : "review"
}

// ─── Photo library (only if this app build has it; older builds use the camera only) ───
export function canPickFromLibrary() {
  return Boolean(requireOptionalNativeModule("ExponentImagePicker"))
}

export async function pickFromLibrary(): Promise<PickedDoc | null> {
  if (!canPickFromLibrary()) return null
  const ImagePicker = await import("expo-image-picker")
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 })
  if (result.canceled || !result.assets?.[0]) return null
  const asset = result.assets[0]
  return { uri: asset.uri, mimeType: asset.mimeType || "image/jpeg" }
}

// ─── Upload ───────────────────────────────────────────────────────────────
const MAX_BYTES = 5 * 1024 * 1024

function base64ToBytes(base64: string) {
  const binary = globalThis.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Uploads one document to the private "agent-docs" bucket. Returns the stored path. */
async function uploadDoc(userId: string, key: DocKey, doc: PickedDoc) {
  const base64 = await FileSystem.readAsStringAsync(doc.uri, { encoding: FileSystem.EncodingType.Base64 })
  const bytes = base64ToBytes(base64)
  if (bytes.byteLength > MAX_BYTES) throw new Error("TOO_BIG")
  const ext = doc.mimeType === "image/png" ? "png" : doc.mimeType === "image/webp" ? "webp" : "jpg"
  const contentType = ext === "jpg" ? "image/jpeg" : doc.mimeType
  const path = `${userId}/${key}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from("agent-docs").upload(path, bytes.buffer as ArrayBuffer, { upsert: false, contentType })
  if (error) throw new Error(error.message)
  return path
}

/** Saves form 2: licence details + any new documents. */
export async function saveVerification(app: MyApplication, form: VerificationForm, docs: Partial<Record<DocKey, PickedDoc>>) {
  const { data: { user } } = await getUserFast()
  if (!user) throw new Error("Not signed in")

  const payload: Record<string, string | null> = {
    licence_number: form.licenceNumber.trim() || null,
    licence_authority: form.licenceAuthority.trim() || null,
    business_reg_number: form.businessRegNumber.trim() || null,
    office_address: form.officeAddress.trim() || null,
  }
  for (const key of DOC_KEYS) {
    const doc = docs[key]
    if (doc) payload[key] = await uploadDoc(user.id, key, doc)
  }

  const { error } = await supabase.from("agents").update(payload).eq("id", app.id)
  if (error) throw new Error(error.message)

  // Lets the website email the agency ("Documents received", in their language)
  // and the team ("Ready to verify", in English), once all documents are in.
  void notifyWebsite()
}

async function notifyWebsite() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    await fetch(`${SITE_URL}/api/agents/info-updated`, {
      signal: controller.signal,
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).finally(() => clearTimeout(timer))
  } catch (e) {
    console.log("Docs notify failed:", e)
  }
}
