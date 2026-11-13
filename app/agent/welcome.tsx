// Old "Finish setup on the website" screen. Agencies now apply in the app,
// so any old link or app version that opens this route goes to the application form.
import { Redirect } from "expo-router"

export default function AgentWelcomeScreen() {
  return <Redirect href={"/agent/apply?auto=1" as any} />
}
