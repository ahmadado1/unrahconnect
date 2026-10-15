// Old in-app plans screen. Prices are no longer shown in the app (store rules):
// agents see the next steps instead, and get plans by email after verification.
import { Redirect } from "expo-router"

export default function PlansScreen() {
  return <Redirect href={"/agent/welcome" as any} />
}
