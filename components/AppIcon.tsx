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
  moon: { family: "ion", name: "moon" },
  sunny: { family: "ion", name: "sunny" },
  sparkles: { family: "ion", name: "sparkles" },
  kaaba: { family: "fa5", name: "kaaba", solid: true },
  mosque: { family: "fa5", name: "mosque", solid: true },
  crescent: { family: "fa5", name: "star-and-crescent", solid: true },
  book: { family: "ion", name: "book" },
  bookmark: { family: "ion", name: "bookmark" },
  bed: { family: "ion", name: "bed" },
  restaurant: { family: "ion", name: "restaurant" },
  people: { family: "ion", name: "people" },
  handshake: { family: "fa5", name: "handshake", solid: true },
  medkit: { family: "ion", name: "medkit" },
  hospital: { family: "fa5", name: "hospital", solid: true },
  train: { family: "ion", name: "train" },
  bus: { family: "ion", name: "bus" },
  car: { family: "ion", name: "car" },
  airplane: { family: "ion", name: "airplane" },
  bag: { family: "ion", name: "bag-handle" },
  storefront: { family: "ion", name: "storefront" },
  business: { family: "ion", name: "business" },
  cart: { family: "ion", name: "cart" },
  calendar: { family: "ion", name: "calendar" },
  medical: { family: "ion", name: "medical" },
  phone: { family: "ion", name: "phone-portrait" },
  heart: { family: "ion", name: "heart" },
  search: { family: "ion", name: "search" },
  map: { family: "ion", name: "map" },
  walk: { family: "ion", name: "walk" },
  water: { family: "ion", name: "water" },
  camp: { family: "fa5", name: "campground", solid: true },
  mountain: { family: "fa5", name: "mountain", solid: true },
  compass: { family: "ion", name: "compass" },
  time: { family: "ion", name: "time" },
  settings: { family: "ion", name: "settings" },
  person: { family: "ion", name: "person" },
  key: { family: "ion", name: "key" },
  checkmark: { family: "ion", name: "checkmark" },
  checkmarkCircle: { family: "ion", name: "checkmark-circle" },
  close: { family: "ion", name: "close" },
  warning: { family: "ion", name: "warning" },
  trophy: { family: "ion", name: "trophy" },
  gift: { family: "ion", name: "gift" },
  cash: { family: "ion", name: "cash" },
  star: { family: "ion", name: "star" },
  starOutline: { family: "ion", name: "star-outline" },
  flame: { family: "ion", name: "flame" },
  leaf: { family: "ion", name: "leaf" },
  prayer: { family: "fa5", name: "hands", solid: true },
  beads: { family: "fa5", name: "circle", solid: true },
  chip: { family: "ion", name: "hardware-chip" },
  shirt: { family: "ion", name: "shirt" },
  cut: { family: "ion", name: "cut" },
  sync: { family: "ion", name: "sync" },
  location: { family: "ion", name: "location" },
  call: { family: "ion", name: "call" },
  mail: { family: "ion", name: "mail" },
  whatsapp: { family: "ion", name: "logo-whatsapp" },
  cloudOffline: { family: "ion", name: "cloud-offline" },
  sad: { family: "ion", name: "sad-outline" },
  male: { family: "ion", name: "male" },
  female: { family: "ion", name: "female" },
  baby: { family: "ion", name: "happy" },
  door: { family: "ion", name: "enter" },
  globe: { family: "ion", name: "globe" },
  coffee: { family: "ion", name: "cafe" },
  fastFood: { family: "ion", name: "fast-food" },
  pizza: { family: "ion", name: "pizza" },
  burger: { family: "fa5", name: "hamburger", solid: true },
  meat: { family: "fa5", name: "drumstick-bite", solid: true },
  award: { family: "ion", name: "ribbon" },
  sheep: { family: "fa5", name: "paw", solid: true },
  flag: { family: "ion", name: "flag" },
  timer: { family: "ion", name: "timer-outline" },
  document: { family: "ion", name: "document-text" },
}

/** Semantic accent colors for feature icons (navy/gold brand + complementary accents). */
export const ICON_COLORS: Record<AppIconKey, string> = {
  moon: GOLD,
  sunny: "#E8A838",
  sparkles: "#3B82F6",
  kaaba: GOLD,
  mosque: GOLD,
  crescent: GOLD,
  book: "#0F766E",
  bookmark: "#0D9488",
  bed: "#7C3AED",
  restaurant: "#EA580C",
  people: "#2563EB",
  handshake: "#0891B2",
  medkit: "#DC2626",
  hospital: "#E11D48",
  train: "#0EA5E9",
  bus: "#0284C7",
  car: "#0369A1",
  airplane: "#38BDF8",
  bag: "#DB2777",
  storefront: "#C026D3",
  business: NAVY,
  cart: "#D97706",
  calendar: "#4F46E5",
  medical: "#F43F5E",
  phone: "#14B8A6",
  heart: "#E11D48",
  search: NAVY,
  map: "#E11D48",
  walk: "#F97316",
  water: "#06B6D4",
  camp: "#65A30D",
  mountain: "#78716C",
  compass: "#C2410C",
  time: GOLD,
  settings: "#64748B",
  person: NAVY,
  key: "#CA8A04",
  checkmark: "#16A34A",
  checkmarkCircle: "#16A34A",
  close: "#94A3B8",
  warning: "#F59E0B",
  trophy: GOLD,
  gift: "#EC4899",
  cash: "#15803D",
  star: GOLD,
  starOutline: GOLD,
  flame: "#F97316",
  leaf: "#22C55E",
  prayer: GOLD,
  beads: "#A16207",
  chip: "#6366F1",
  shirt: "#8B5CF6",
  cut: "#A78BFA",
  sync: "#0EA5E9",
  location: "#EF4444",
  call: "#16A34A",
  mail: "#2563EB",
  whatsapp: "#25D366",
  cloudOffline: "#94A3B8",
  sad: "#64748B",
  male: "#3B82F6",
  female: "#EC4899",
  baby: "#F472B6",
  door: "#B45309",
  globe: "#0EA5E9",
  coffee: "#92400E",
  fastFood: "#F97316",
  pizza: "#EF4444",
  burger: "#D97706",
  meat: "#B91C1C",
  award: GOLD,
  sheep: "#78716C",
  flag: "#DC2626",
  timer: "#F59E0B",
  document: "#475569",
}

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
  "cube-outline": "#B45309",
  "moon-outline": GOLD,
  "map-outline": "#E11D48",
  "hand-left-outline": "#0D9488",
  "book-outline": "#0F766E",
  "bus-outline": "#0284C7",
  "person-outline": NAVY,
  "heart-outline": "#E11D48",
  "briefcase-outline": GOLD,
  "notifications-outline": "#F59E0B",
  "settings-outline": "#64748B",
  "information-circle-outline": "#2563EB",
  "call-outline": "#16A34A",
  "log-out-outline": "#E24B4A",
  "sparkles": "#3B82F6",
  "search": NAVY,
}

export function getIonIconColor(name: string, fallback: string = NAVY): string {
  return ION_ICON_COLORS[name] ?? fallback
}
