// Group trip checklist: agency ticks each pilgrim's documents; the pilgrim sees their own.
import { supabase } from "./supabase"

export const CHECK_ITEMS = ["passport", "visa", "ticket", "vaccine", "hotel", "insurance"] as const
export type CheckItem = (typeof CHECK_ITEMS)[number]

/** Agency: done items per pilgrim. */
export async function getAgencyChecklist(agentId: string): Promise<Record<string, Set<CheckItem>>> {
  const { data } = await supabase.from("trip_checklist").select("user_id, item, done").eq("agent_id", agentId)
  const out: Record<string, Set<CheckItem>> = {}
  for (const row of data ?? []) {
    if (!row.done) continue
    ;(out[row.user_id] ??= new Set()).add(row.item as CheckItem)
  }
  return out
}

export async function setChecklistItem(agentId: string, userId: string, item: CheckItem, done: boolean) {
  const { error } = await supabase
    .from("trip_checklist")
    .upsert({ agent_id: agentId, user_id: userId, item, done, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

/** Pilgrim: my own items from my agency. */
export async function getMyChecklist(agentId: string, userId: string): Promise<Set<CheckItem>> {
  const { data } = await supabase
    .from("trip_checklist")
    .select("item, done")
    .eq("agent_id", agentId)
    .eq("user_id", userId)
  return new Set((data ?? []).filter(r => r.done).map(r => r.item as CheckItem))
}
