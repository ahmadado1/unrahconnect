import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase"

export type AccountEmailType = "password_changed" | "account_deleted"

/**
 * Fire-and-forget transactional email via Supabase Edge Function.
 * Never throws — failures are logged only so UX is not blocked.
 */
export async function sendAccountEmail(params: {
  type: AccountEmailType
  guest_email: string
  guest_name?: string
}): Promise<void> {
  const guest_email = String(params.guest_email || "").trim()
  if (!guest_email) return

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-account-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        type: params.type,
        guest_email,
        guest_name: params.guest_name || "Pilgrim",
      }),
    })
    const text = await res.text()
    console.log("Account email response:", res.status, text)
  } catch (e) {
    console.log("Account email error:", e)
  }
}
