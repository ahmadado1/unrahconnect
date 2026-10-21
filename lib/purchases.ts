// In-app Premium (App Store / Google Play) through RevenueCat.
//
// How it fits together:
//  1. The user taps Subscribe on the Premium screen. Apple's / Google's own payment sheet opens.
//  2. RevenueCat confirms the purchase with Apple / Google and tells the app at once
//     (we unlock Premium on this phone straight away).
//  3. RevenueCat also calls our Supabase function "revenuecat-webhook", which writes
//     "store Premium until <date>" into user_premium, so Premium also works on the website
//     and on any other phone where the user logs in.
// Website payments (OPay, MyNita, PayPal) keep working as before; a user is Premium if
// EITHER of them is active.
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "react-native-purchases"

/** Public SDK keys (safe to be in the app). Fill in from RevenueCat → API keys. */
const IOS_KEY = "appl_koGxcpgQAktbiRtqrSAptsmAZoP" // App Store (com.umrahconnect.app)
const ANDROID_KEY = "goog_aKrQVKToZJwODmEDmxpcLyHLiMU" // starts with goog_
/** RevenueCat Test Store key: fake purchases, ONLY used while developing (Expo / dev builds). */
const TEST_KEY = "test_qqElrsPUSNvHBkvoCxpaLFUvDnr"

/** The entitlement name in RevenueCat that means "has Premium". */
export const ENTITLEMENT = "premium"
/** Entitlement names that all mean Premium (the RevenueCat project uses "umrahconnect_premium"). */
export const PREMIUM_ENTITLEMENTS = ["premium", "umrahconnect_premium"]
const STORE_CACHE_KEY = "store_premium_until_v1"

let configured = false
let configuring: Promise<boolean> | null = null

function apiKey() {
  const real = Platform.OS === "ios" ? IOS_KEY : Platform.OS === "android" ? ANDROID_KEY : ""
  if (real) return real
  return __DEV__ ? TEST_KEY : ""
}

/** True when in-app purchases can be used in this build. */
export function purchasesAvailable() {
  return Boolean(apiKey())
}

/** Start RevenueCat once. userId = the Supabase user id (so the purchase belongs to the account). */
export async function setupPurchases(userId?: string | null): Promise<boolean> {
  if (configured) {
    if (userId) await loginPurchases(userId)
    return true
  }
  if (configuring) return configuring
  configuring = (async () => {
    const key = apiKey()
    if (!key) return false
    try {
      if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN).catch(() => {})
      Purchases.configure({ apiKey: key, appUserID: userId || undefined })
      configured = true
      // Keep the saved answer up to date whenever RevenueCat learns something new
      // (purchase, renewal, refund, restore).
      Purchases.addCustomerInfoUpdateListener(info => {
        void saveFromInfo(info)
      })
      return true
    } catch (e) {
      console.log("[Purchases] setup failed:", e)
      return false
    } finally {
      configuring = null
    }
  })()
  return configuring
}

/** Link purchases to the logged-in account. */
export async function loginPurchases(userId: string) {
  if (!configured) return setupPurchases(userId)
  try {
    const { customerInfo } = await Purchases.logIn(userId)
    await saveFromInfo(customerInfo)
  } catch (e) {
    console.log("[Purchases] logIn failed:", e)
  }
  return true
}

/** On log out: forget this account's store Premium on the phone. */
export async function logoutPurchases() {
  await AsyncStorage.removeItem(STORE_CACHE_KEY).catch(() => {})
  if (!configured) return
  try {
    await Purchases.logOut()
  } catch {}
}

/** "Premium until" (ISO date) from RevenueCat, saved on the phone. null = no store Premium. */
async function saveFromInfo(info: CustomerInfo) {
  const ent = PREMIUM_ENTITLEMENTS.map(id => info.entitlements.active[id]).find(Boolean)
  // Lifetime purchases have no expiration date: treat as far in the future.
  const until = ent ? (ent.expirationDate ?? "2099-12-31T00:00:00Z") : null
  if (until) await AsyncStorage.setItem(STORE_CACHE_KEY, until).catch(() => {})
  else await AsyncStorage.removeItem(STORE_CACHE_KEY).catch(() => {})
  // Tell the rest of the app (lib/premium.ts) that Premium may have changed.
  for (const fn of listeners) fn()
  return until
}

/** Saved store Premium date (works offline). */
export async function readStorePremiumUntil(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORE_CACHE_KEY)
  } catch {
    return null
  }
}

/** Ask RevenueCat again (for example when the app comes back to the front). */
export async function refreshStorePremium(): Promise<string | null> {
  if (!configured) return readStorePremiumUntil()
  try {
    return await saveFromInfo(await Purchases.getCustomerInfo())
  } catch {
    return readStorePremiumUntil()
  }
}

const listeners = new Set<() => void>()
/** lib/premium.ts listens here to refresh the Premium badge right after a purchase. */
export function onStorePremiumChange(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export type PlanOption = {
  id: "monthly" | "yearly"
  pkg: PurchasesPackage
  /** Price in the user's own currency, from the store, e.g. "₦3,000.00" or "$1.99" */
  price: string
  /** Price per month for the yearly plan (to show the saving) */
  perMonth?: string
}

/** Why the plans could not load (shown small on the Premium screen, to find the problem). */
export let lastPlansProblem = ""

/** Monthly + Yearly plans with the store's real local prices. [] if not available. */
export async function loadPlans(): Promise<PlanOption[]> {
  lastPlansProblem = ""
  if (!(await setupPurchases())) {
    lastPlansProblem = apiKey() ? "setup failed" : "no store key in this build"
    return []
  }
  try {
    const offerings = await Purchases.getOfferings()
    // Our App Store / Play offering is called "premium". If it is missing, use RevenueCat's current one.
    const current = offerings.all?.["premium"] ?? offerings.current
    if (!current) {
      lastPlansProblem = "no current offering in RevenueCat"
      return []
    }
    const plans: PlanOption[] = []
    if (current.monthly) {
      plans.push({ id: "monthly", pkg: current.monthly, price: current.monthly.product.priceString })
    }
    if (current.annual) {
      const p = current.annual.product
      plans.push({ id: "yearly", pkg: current.annual, price: p.priceString, perMonth: p.pricePerMonthString ?? undefined })
    }
    if (!plans.length) lastPlansProblem = `offering "${current.identifier}" has no monthly / annual package`
    return plans
  } catch (e) {
    console.log("[Purchases] offerings failed:", e)
    const err = e as { code?: string; message?: string; underlyingErrorMessage?: string }
    lastPlansProblem = [err.code, err.message, err.underlyingErrorMessage].filter(Boolean).join(" · ").slice(0, 300)
    return []
  }
}

export type BuyResult = "ok" | "cancelled" | "error"

/** Open Apple's / Google's payment sheet for this plan. */
export async function buyPlan(plan: PlanOption): Promise<BuyResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg)
    const until = await saveFromInfo(customerInfo)
    return until ? "ok" : "error"
  } catch (e) {
    if ((e as { userCancelled?: boolean })?.userCancelled) return "cancelled"
    console.log("[Purchases] purchase failed:", e)
    return "error"
  }
}

/** "Restore purchases" (required by Apple): finds an earlier purchase on this Apple / Google account. */
export async function restorePlans(): Promise<boolean> {
  if (!(await setupPurchases())) return false
  try {
    return Boolean(await saveFromInfo(await Purchases.restorePurchases()))
  } catch (e) {
    console.log("[Purchases] restore failed:", e)
    return false
  }
}

/**
 * True only on iPhone in the United States App Store. There (and only there) Apple allows a link to
 * buy on our website. Everywhere else, and on Google Play outside its paid programs, it is NOT allowed.
 */
export async function websiteLinkAllowed(): Promise<boolean> {
  if (Platform.OS !== "ios") return false
  if (!(await setupPurchases())) return false
  try {
    const store = await Purchases.getStorefront()
    const code = String(store?.countryCode ?? "").toUpperCase()
    return code === "USA" || code === "US"
  } catch {
    return false
  }
}

/** Open the store's "manage / cancel subscription" page. */
export async function manageSubscription() {
  try {
    await Purchases.showManageSubscriptions()
  } catch {}
}
