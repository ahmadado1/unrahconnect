import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { ComponentProps } from "react"
import { StyleProp, TextStyle, View, ViewStyle } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type IonName = ComponentProps<typeof Ionicons>["name"]
type MatName = ComponentProps<typeof MaterialIcons>["name"]
type FaName = ComponentProps<typeof FontAwesome5>["name"]

export type AppIconKey =
  | "moon"
  | "sunny"
  | "sparkles"
  | "kaaba"
  | "mosque"
  | "crescent"
  | "book"
  | "bookmark"
  | "bed"
  | "restaurant"
  | "people"
  | "handshake"
  | "medkit"
  | "hospital"
  | "train"
  | "bus"
  | "car"
  | "airplane"
  | "bag"
  | "storefront"
  | "business"
  | "cart"
  | "calendar"
  | "medical"
  | "phone"
  | "heart"
  | "search"
  | "map"
  | "walk"
  | "water"
  | "camp"
  | "mountain"
  | "compass"
  | "time"
  | "settings"
  | "person"
  | "key"
  | "checkmark"
  | "checkmarkCircle"
  | "close"
  | "warning"
  | "trophy"
  | "gift"
  | "cash"
  | "star"
  | "starOutline"
  | "flame"
  | "leaf"
  | "prayer"
  | "beads"
  | "chip"
  | "shirt"
  | "cut"
  | "sync"
  | "location"
  | "call"
  | "mail"
  | "whatsapp"
  | "cloudOffline"
  | "sad"
  | "male"
  | "female"
  | "baby"
  | "door"
  | "globe"
  | "coffee"
  | "fastFood"
  | "pizza"
  | "burger"
  | "meat"
  | "award"
  | "sheep"
  | "flag"
  | "timer"
  | "document"

type IconSpec =
  | { family: "ion"; name: IonName }
  | { family: "mat"; name: MatName }
  | { family: "fa5"; name: FaName; solid?: boolean }

const ICONS: Record<AppIconKey, IconSpec> = {
  moon: { family: "ion", name: "moon-outline" },
  sunny: { family: "ion", name: "sunny-outline" },
  sparkles: { family: "ion", name: "sparkles-outline" },
  kaaba: { family: "fa5", name: "kaaba", solid: true },
  mosque: { family: "fa5", name: "mosque", solid: true },
  crescent: { family: "fa5", name: "star-and-crescent", solid: true },
  book: { family: "ion", name: "book-outline" },
  bookmark: { family: "ion", name: "bookmark-outline" },
  bed: { family: "ion", name: "bed-outline" },
  restaurant: { family: "ion", name: "restaurant-outline" },
  people: { family: "ion", name: "people-outline" },
  handshake: { family: "fa5", name: "handshake", solid: true },
  medkit: { family: "ion", name: "medkit-outline" },
  hospital: { family: "fa5", name: "hospital", solid: true },
  train: { family: "ion", name: "train-outline" },
  bus: { family: "ion", name: "bus-outline" },
  car: { family: "ion", name: "car-outline" },
  airplane: { family: "ion", name: "airplane-outline" },
  bag: { family: "ion", name: "bag-handle-outline" },
  storefront: { family: "ion", name: "storefront-outline" },
  business: { family: "ion", name: "business-outline" },
  cart: { family: "ion", name: "cart-outline" },
  calendar: { family: "ion", name: "calendar-outline" },
  medical: { family: "ion", name: "medical-outline" },
  phone: { family: "ion", name: "phone-portrait-outline" },
  heart: { family: "ion", name: "heart-outline" },
  search: { family: "ion", name: "search-outline" },
  map: { family: "ion", name: "map-outline" },
  walk: { family: "ion", name: "walk-outline" },
  water: { family: "ion", name: "water-outline" },
  camp: { family: "fa5", name: "campground", solid: true },
  mountain: { family: "fa5", name: "mountain", solid: true },
  compass: { family: "ion", name: "compass-outline" },
  time: { family: "ion", name: "time-outline" },
  settings: { family: "ion", name: "settings-outline" },
  person: { family: "ion", name: "person-outline" },
  key: { family: "ion", name: "key-outline" },
  checkmark: { family: "ion", name: "checkmark" },
  checkmarkCircle: { family: "ion", name: "checkmark-circle" },
  close: { family: "ion", name: "close-outline" },
  warning: { family: "ion", name: "warning-outline" },
  trophy: { family: "ion", name: "trophy-outline" },
  gift: { family: "ion", name: "gift-outline" },
  cash: { family: "ion", name: "cash-outline" },
  star: { family: "ion", name: "star" },
  starOutline: { family: "ion", name: "star-outline" },
  flame: { family: "ion", name: "flame-outline" },
  leaf: { family: "ion", name: "leaf-outline" },
  prayer: { family: "fa5", name: "hands", solid: true },
  beads: { family: "fa5", name: "circle", solid: true },
  chip: { family: "ion", name: "hardware-chip-outline" },
  shirt: { family: "ion", name: "shirt-outline" },
  cut: { family: "ion", name: "cut-outline" },
  sync: { family: "ion", name: "sync-outline" },
  location: { family: "ion", name: "location-outline" },
  call: { family: "ion", name: "call-outline" },
  mail: { family: "ion", name: "mail-outline" },
  whatsapp: { family: "ion", name: "logo-whatsapp" },
  cloudOffline: { family: "ion", name: "cloud-offline-outline" },
  sad: { family: "ion", name: "sad-outline" },
  male: { family: "ion", name: "male-outline" },
  female: { family: "ion", name: "female-outline" },
  baby: { family: "ion", name: "happy-outline" },
  door: { family: "ion", name: "enter-outline" },
  globe: { family: "ion", name: "globe-outline" },
  coffee: { family: "ion", name: "cafe-outline" },
  fastFood: { family: "ion", name: "fast-food-outline" },
  pizza: { family: "ion", name: "pizza-outline" },
  burger: { family: "fa5", name: "hamburger", solid: true },
  meat: { family: "fa5", name: "drumstick-bite", solid: true },
  award: { family: "ion", name: "ribbon-outline" },
  sheep: { family: "fa5", name: "paw", solid: true },
  flag: { family: "ion", name: "flag-outline" },
  timer: { family: "ion", name: "timer-outline" },
  document: { family: "ion", name: "document-text-outline" },
}

const GOLD_ICON_KEYS = new Set<AppIconKey>([
  "moon",
  "sunny",
  "sparkles",
  "kaaba",
  "mosque",
  "crescent",
  "star",
  "starOutline",
  "trophy",
  "prayer",
  "beads",
  "time",
  "award",
  "flame",
  "checkmark",
  "checkmarkCircle",
])

/** Brand colors only — gold for worship/highlights, navy for everything else. */
export const ICON_COLORS: Record<AppIconKey, string> = Object.fromEntries(
  (Object.keys(ICONS) as AppIconKey[]).map((key) => [
    key,
    key === "whatsapp" ? "#25D366" : GOLD_ICON_KEYS.has(key) ? GOLD : NAVY,
  ]),
) as Record<AppIconKey, string>

export function getIconColor(name: AppIconKey, fallback: string = NAVY): string {
  return ICON_COLORS[name] ?? fallback
}

export type AppIconProps = {
  name: AppIconKey
  size?: number
  color?: string
  style?: StyleProp<TextStyle | ViewStyle>
}

/** Feature icon — defaults to a semantic accent color for each glyph. */
export function AppIcon({ name, size = 22, color, style }: AppIconProps) {
  const resolved = color ?? getIconColor(name)
  const spec = ICONS[name]
  if (!spec) return null

  if (spec.family === "ion") {
    return <Ionicons name={spec.name} size={size} color={resolved} style={style as TextStyle} />
  }
  if (spec.family === "mat") {
    return <MaterialIcons name={spec.name} size={size} color={resolved} style={style as TextStyle} />
  }
  return (
    <FontAwesome5
      name={spec.name}
      size={size}
      color={resolved}
      solid={spec.solid}
      style={style as TextStyle}
    />
  )
}

/** Row of filled/outline star icons for hotel/restaurant ratings. */
export function StarRating({
  count,
  max = 5,
  size = 14,
  color = GOLD,
  style,
}: {
  count: number
  max?: number
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}) {
  const filled = Math.min(Math.max(0, Math.round(count)), max)
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 2 }, style]}>
      {Array.from({ length: max }, (_, i) => (
        <AppIcon key={i} name={i < filled ? "star" : "starOutline"} size={size} color={color} />
      ))}
    </View>
  )
}

export { NAVY as ICON_NAVY, GOLD as ICON_GOLD, ICONS }

/** Common Ionicons used outside AppIcon (home quick access, menus). */
export const ION_ICON_COLORS: Record<string, string> = {
  "cube-outline": NAVY,
  "moon-outline": GOLD,
  "map-outline": NAVY,
  "hand-left-outline": NAVY,
  "book-outline": GOLD,
  "bus-outline": NAVY,
  "person-outline": NAVY,
  "heart-outline": NAVY,
  "briefcase-outline": GOLD,
  "notifications-outline": GOLD,
  "settings-outline": NAVY,
  "information-circle-outline": NAVY,
  "call-outline": NAVY,
  "log-out-outline": "#E24B4A",
  sparkles: GOLD,
  "sparkles-outline": GOLD,
  search: NAVY,
  "search-outline": NAVY,
}

export function getIonIconColor(name: string, fallback: string = NAVY): string {
  return ION_ICON_COLORS[name] ?? fallback
}
