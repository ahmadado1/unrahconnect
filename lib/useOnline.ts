// Is the phone online? Uses expo-network (live: updates when Wi-Fi / data turns on or off).
// "Unknown" (still checking) counts as online, so screens don't flash an offline state on start.
import { useNetworkState } from "expo-network"

export function useOnline() {
  const state = useNetworkState()
  if (state.isConnected === false) return false
  if (state.isInternetReachable === false) return false
  return true
}
