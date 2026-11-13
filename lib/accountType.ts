// Is the signed-in account a travel agency? (set at sign-up: user_metadata.user_type = "agent")
// Used to show agencies their own layout: "My Agency" tab, agency card on Home, no pilgrim-only items.
// This only changes what is SHOWN. What agencies can unlock is checked on the server (see lib/premium.ts).
import { useEffect, useState } from "react"
import { getUserFast, supabase } from "./supabase"

export function useIsAgent() {
  const [isAgent, setIsAgent] = useState(false)
  useEffect(() => {
    let active = true
    getUserFast()
      .then(({ data: { user } }) => {
        if (active) setIsAgent(user?.user_metadata?.user_type === "agent")
      })
      .catch(() => {})
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIsAgent(session?.user?.user_metadata?.user_type === "agent")
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])
  return isAgent
}
