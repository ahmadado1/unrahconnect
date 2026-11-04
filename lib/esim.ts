import { Platform } from "react-native"

export const ESIM_MARKER = "787351"
// Travelpayouts project IDs ("trs"): App Store project on iPhone, Google Play project on Android.
export const ESIM_PROJECT_IOS = "594751"
export const ESIM_PROJECT_ANDROID = "594750"
export const ESIM_PROJECT = Platform.OS === "ios" ? ESIM_PROJECT_IOS : ESIM_PROJECT_ANDROID
export const ESIM_PROGRAM = "8979"
export const ESIM_CAMPAIGN = "629"
export const ESIM_SUB_ID = "app_esim"
export const SAILY_SAUDI_URL = "https://saily.com/esim-saudi-arabia/"

/** Shown under the plans. The screen translates this sentence. */
export const ESIM_PRICE_NOTE = "Prices may change. Final price shown on Saily."

export type EsimPlan = {
  id: string
  dataGb: number
  days: number
  /** USD */
  price: number
  bestForUmrah?: boolean
}

export const ESIM_PLANS: EsimPlan[] = [
  { id: "5gb", dataGb: 5, days: 30, price: 15.99 },
  { id: "10gb", dataGb: 10, days: 30, price: 26.99, bestForUmrah: true },
  { id: "20gb", dataGb: 20, days: 30, price: 42.99 },
]

export function buildSailyEsimLink() {
  return (
    `https://tp.media/r?campaign_id=${ESIM_CAMPAIGN}` +
    `&marker=${ESIM_MARKER}` +
    `&p=${ESIM_PROGRAM}` +
    `&trs=${ESIM_PROJECT}` +
    `&sub_id=${ESIM_SUB_ID}` +
    `&u=${encodeURIComponent(SAILY_SAUDI_URL)}`
  )
}

export const AIRALO_PROGRAM = "8310"
export const AIRALO_CAMPAIGN = "541"
export const AIRALO_SUB_ID = "app_esim_airalo"
export const AIRALO_SAUDI_URL = "https://www.airalo.com/saudi-arabia-esim"

export type AiraloPlan = {
  id: string
  days: number
  /** USD */
  price: number
}

export const AIRALO_PLANS: AiraloPlan[] = [
  { id: "unlimited-7", days: 7, price: 27 },
  { id: "unlimited-15", days: 15, price: 54 },
  { id: "unlimited-30", days: 30, price: 97 },
]

export function buildAiraloEsimLink() {
  return (
    `https://tp.media/r?campaign_id=${AIRALO_CAMPAIGN}` +
    `&marker=${ESIM_MARKER}` +
    `&p=${AIRALO_PROGRAM}` +
    `&trs=${ESIM_PROJECT}` +
    `&sub_id=${AIRALO_SUB_ID}` +
    `&u=${encodeURIComponent(AIRALO_SAUDI_URL)}`
  )
}
