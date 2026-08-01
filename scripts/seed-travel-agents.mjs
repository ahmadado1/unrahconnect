/**
 * Seed public.travel_agents from scripts/travel-agents-seed.json
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-travel-agents.mjs
 *
 * Or run supabase/travel_agents.sql then supabase/travel_agents_seed.sql
 * in the Supabase SQL Editor (no service key needed).
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const url =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://yqabuipymbaylholmmoi.supabase.co"

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Either set it, or run supabase/travel_agents.sql + supabase/travel_agents_seed.sql in the SQL Editor."
  )
  process.exit(1)
}

const rows = JSON.parse(
  readFileSync(join(__dirname, "travel-agents-seed.json"), "utf8")
)

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const BATCH = 50
let upserted = 0

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH)
  const { error } = await supabase.from("travel_agents").upsert(batch, {
    onConflict: "id",
  })
  if (error) {
    console.error("Upsert failed at batch", i, error.message)
    process.exit(1)
  }
  upserted += batch.length
  console.log(`Upserted ${upserted}/${rows.length}`)
}

console.log(`Done. Seeded ${upserted} travel agents.`)
