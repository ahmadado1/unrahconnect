/**
 * Lightweight network-error detection — no NetInfo dependency.
 * Use with i18n key `networkError` for user-facing messages.
 */

export function isNetworkError(error: unknown): boolean {
  if (!error) return false

  const message = String(
    (error as { message?: string })?.message ??
      (error as { error?: string })?.error ??
      error
  ).toLowerCase()

  const name = String((error as { name?: string })?.name ?? "").toLowerCase()
  const code = String(
    (error as { code?: string | number })?.code ??
      (error as { status?: number })?.status ??
      ""
  ).toLowerCase()

  if (name === "aborterror" || name === "typeerror") {
    // fetch() TypeError is common when offline
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("failed") ||
      message.includes("internet") ||
      message.includes("offline") ||
      message.includes("timeout") ||
      message.includes("abort")
    ) {
      return true
    }
  }

  return (
    message.includes("network request failed") ||
    message.includes("network error") ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("internet") ||
    message.includes("offline") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("unreachable") ||
    message.includes("connection") ||
    code === "network_error" ||
    code === "err_network" ||
    code === "-1009" || // iOS offline
    code === "-1001" // iOS timeout
  )
}

/** Returns a translation key: networkError | somethingWentWrong */
export function errorMessageKey(error: unknown): "networkError" | "somethingWentWrong" {
  return isNetworkError(error) ? "networkError" : "somethingWentWrong"
}
