import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import {
  buildAviasalesLink,
  formatFlightPlace,
  POPULAR_FLIGHT_CITIES,
  searchFlightPlaces,
  type FlightPlace,
} from "@/lib/flights"
import { GOLD, NAVY, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePicker from "@react-native-community/datetimepicker"
import * as WebBrowser from "expo-web-browser"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

const STORAGE_KEY = "aviasales_places_v1"
const OLD_ORIGIN_KEY = "aviasales_from_v1"
const RECENT_LIMIT = 3

type ToChoice = "JED" | "MED" | "other"
type PickerField = "depart" | "return" | null
type StoredPlaces = { recent: FlightPlace[]; from: FlightPlace | null }

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const next = startOfDay(date)
  next.setDate(next.getDate() + days)
  return next
}

function readPlace(value: unknown): FlightPlace | null {
  if (!value || typeof value !== "object") return null
  const place = value as FlightPlace
  const code = String(place.code || "").trim().toUpperCase()
  const city = String(place.city || "").trim()
  const country = String(place.country || "").trim()
  if (!/^[A-Z]{3}$/.test(code) || !city || !country) return null
  return { code, city, country }
}

function withRecentFirst(recent: FlightPlace[]) {
  const seen = new Set<string>()
  const places: FlightPlace[] = []
  for (const place of [...recent, ...POPULAR_FLIGHT_CITIES]) {
    if (seen.has(place.code)) continue
    seen.add(place.code)
    places.push(place)
  }
  return places
}

function PlaceField({
  label,
  selected,
  onSelect,
  recent,
  language,
}: {
  label?: string
  selected: FlightPlace | null
  onSelect: (place: FlightPlace) => void
  recent: FlightPlace[]
  language: string
}) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FlightPlace[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)

  const picks = useMemo(() => withRecentFirst(recent), [recent])
  const term = query.trim()
  const showSearchResults = focused && term.length >= 2 && !failed && results != null
  const shown = showSearchResults ? results : picks

  useEffect(() => {
    if (!focused || term.length < 2) {
      setResults(null)
      setFailed(false)
      setLoading(false)
      return
    }

    setResults(null)
    setFailed(false)
    let cancelled = false
    const controller = new AbortController()
    const wait = setTimeout(() => {
      setLoading(true)
      const kill = setTimeout(() => controller.abort(), 8000)
      searchFlightPlaces(term, language, controller.signal)
        .then(places => {
          if (cancelled) return
          setResults(places)
          setFailed(false)
        })
        .catch(() => {
          if (cancelled) return
          setResults(null)
          setFailed(true)
        })
        .finally(() => {
          clearTimeout(kill)
          if (!cancelled) setLoading(false)
        })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(wait)
      controller.abort()
    }
  }, [focused, term, language])

  const choose = (place: FlightPlace) => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setFocused(false)
    setQuery("")
    setResults(null)
    setFailed(false)
    onSelect(place)
  }

  return (
    <View style={label ? undefined : styles.otherField}>
      {label ? <Text style={[styles.label, { color: theme.text }]}>{label}</Text> : null}
      <TextInput
        value={focused ? query : selected ? formatFlightPlace(selected) : ""}
        onChangeText={setQuery}
        placeholder={t("flightCitySearch")}
        placeholderTextColor={theme.textSecondary}
        autoCorrect={false}
        autoCapitalize="none"
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current)
          setFocused(true)
          setQuery("")
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), 250)
        }}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: focused ? GOLD : theme.border,
          },
        ]}
      />
      {focused ? (
        <View style={[styles.results, { borderColor: theme.border, backgroundColor: theme.background }]}>
          {loading ? <ActivityIndicator color={GOLD} style={styles.spinner} /> : null}
          {showSearchResults && results?.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>{t("flightNoCities")}</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.resultsScroll}>
              {shown.map(place => (
                <TouchableOpacity
                  key={`${place.code}-${place.city}`}
                  style={styles.resultRow}
                  onPress={() => choose(place)}
                >
                  <Text style={[styles.resultText, { color: theme.text }]}>{formatFlightPlace(place)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  )
}

export default function FindFlightsCard() {
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const [from, setFrom] = useState<FlightPlace>(POPULAR_FLIGHT_CITIES[0])
  const [recent, setRecent] = useState<FlightPlace[]>([])
  const [toMode, setToMode] = useState<ToChoice>("JED")
  const [toPlace, setToPlace] = useState<FlightPlace | null>(null)
  const [depart, setDepart] = useState<Date | null>(null)
  const [returnDate, setReturnDate] = useState<Date | null>(null)
  const [adults, setAdults] = useState(1)
  const [picker, setPicker] = useState<PickerField>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async raw => {
        let stored: StoredPlaces = { recent: [], from: null }
        if (raw) {
          const parsed = JSON.parse(raw) as StoredPlaces
          const savedRecent = Array.isArray(parsed?.recent)
            ? parsed.recent.map(readPlace).filter((place): place is FlightPlace => place != null).slice(0, RECENT_LIMIT)
            : []
          stored = { recent: savedRecent, from: readPlace(parsed?.from) }
        }
        if (!stored.from) {
          const oldCode = (await AsyncStorage.getItem(OLD_ORIGIN_KEY))?.trim().toUpperCase()
          stored.from = POPULAR_FLIGHT_CITIES.find(place => place.code === oldCode) ?? null
        }
        if (!active) return
        setRecent(stored.recent)
        if (stored.from) setFrom(stored.from)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const persist = (nextRecent: FlightPlace[], nextFrom: FlightPlace) => {
    const payload: StoredPlaces = { recent: nextRecent, from: nextFrom }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {})
  }

  const remember = (place: FlightPlace, kind: "from" | "to") => {
    const nextRecent = [place, ...recent.filter(item => item.code !== place.code)].slice(0, RECENT_LIMIT)
    const nextFrom = kind === "from" ? place : from
    setRecent(nextRecent)
    if (kind === "from") setFrom(place)
    else setToPlace(place)
    setError("")
    persist(nextRecent, nextFrom)
  }

  const formatDay = (date: Date | null, empty: string) => {
    if (!date) return empty
    return date.toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })
  }

  const onPickDate = (field: PickerField, date?: Date) => {
    if (!field || !date) return
    const day = startOfDay(date)
    if (field === "depart") {
      setDepart(day)
      setReturnDate(current => (current && startOfDay(current).getTime() <= day.getTime() ? null : current))
    } else {
      setReturnDate(day)
    }
    setError("")
  }

  const search = async () => {
    const today = startOfDay(new Date())
    const destination = toMode === "other" ? toPlace?.code : toMode
    if (!destination) {
      setError(t("flightOtherRequired"))
      return
    }
    if (!depart) {
      setError(t("flightDepartRequired"))
      return
    }
    if (startOfDay(depart).getTime() < today.getTime()) {
      setError(t("flightDepartPast"))
      return
    }
    if (returnDate && startOfDay(returnDate).getTime() <= startOfDay(depart).getTime()) {
      setError(t("flightReturnAfter"))
      return
    }
    setError("")
    const url = buildAviasalesLink(from.code, destination, depart, returnDate, adults)
    try {
      await WebBrowser.openBrowserAsync(url)
    } catch {
      setError(t("somethingWentWrong"))
    }
  }

  const openReturn = () => {
    if (!depart) {
      setError(t("flightDepartRequired"))
      return
    }
    setPicker("return")
  }

  const destinations = [
    ["JED", "flightJeddah"],
    ["MED", "flightMadinah"],
  ] as const

  return (
    <LinearGradient
      colors={theme.dark ? ["#1A2744", "#162033"] : ["#F4F7FF", "#E7EEFF"]}
      style={[styles.card, { borderColor: theme.dark ? "#2E4A86" : "#C9D7FF" }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>{t("findFlights")}</Text>

      <PlaceField
        label={t("flightFrom")}
        selected={from}
        recent={recent}
        language={i18n.language}
        onSelect={place => remember(place, "from")}
      />

      <Text style={[styles.label, { color: theme.text }]}>{t("flightTo")}</Text>
      <View style={styles.choiceRow}>
        {destinations.map(([code, labelKey]) => {
          const selected = toMode === code
          return (
            <TouchableOpacity
              key={code}
              style={[styles.choice, selected ? styles.choiceOn : { borderColor: theme.border, backgroundColor: theme.background }]}
              onPress={() => { setToMode(code); setError("") }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.choiceCode, { color: selected ? GOLD : theme.text }]}>{code}</Text>
              <Text style={[styles.choiceLabel, { color: selected ? "#fff" : theme.text }]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          )
        })}
        <TouchableOpacity
          style={[styles.choice, toMode === "other" ? styles.choiceOn : { borderColor: theme.border, backgroundColor: theme.background }]}
          onPress={() => { setToMode("other"); setError("") }}
          accessibilityRole="button"
          accessibilityState={{ selected: toMode === "other" }}
        >
          {toMode === "other" && toPlace ? (
            <Text style={[styles.choiceCode, { color: GOLD }]}>{toPlace.code}</Text>
          ) : (
            <Ionicons name="search-outline" size={14} color={toMode === "other" ? GOLD : theme.textSecondary} />
          )}
          <Text style={[styles.choiceLabel, { color: toMode === "other" ? "#fff" : theme.text }]}>{t("flightOtherCity")}</Text>
        </TouchableOpacity>
      </View>
      {toMode === "other" ? (
        <PlaceField
          selected={toPlace}
          recent={recent}
          language={i18n.language}
          onSelect={place => remember(place, "to")}
        />
      ) : null}

      <View style={[styles.choiceRow, styles.dateRow]}>
        <TouchableOpacity
          style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
          onPress={() => setPicker("depart")}
        >
          <Text style={[styles.label, styles.dateLabel, { color: theme.text }]}>{t("flightDepart")}</Text>
          <Text style={[styles.dateValue, { color: depart ? theme.text : theme.textSecondary }]}>
            {formatDay(depart, t("flightSelectDate"))}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
          onPress={openReturn}
        >
          <Text style={[styles.label, styles.dateLabel, { color: theme.text }]}>{t("flightReturn")}</Text>
          <Text style={[styles.dateValue, { color: returnDate ? theme.text : theme.textSecondary }]}>
            {formatDay(returnDate, t("flightReturnOptional"))}
          </Text>
        </TouchableOpacity>
      </View>
      {returnDate ? (
        <TouchableOpacity onPress={() => { setReturnDate(null); setError("") }} accessibilityRole="button">
          <Text style={styles.clear}>{t("flightClearReturn")}</Text>
        </TouchableOpacity>
      ) : null}

      {picker ? (
        <View>
          <DateTimePicker
            value={
              picker === "depart"
                ? depart ?? startOfDay(new Date())
                : returnDate ?? (depart ? addDays(depart, 1) : addDays(new Date(), 1))
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={picker === "return" && depart ? addDays(depart, 1) : startOfDay(new Date())}
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                const field = picker
                setPicker(null)
                if (event.type === "set") onPickDate(field, date)
                return
              }
              onPickDate(picker, date)
            }}
          />
          {Platform.OS === "ios" ? (
            <TouchableOpacity onPress={() => setPicker(null)}>
              <Text style={styles.clear}>{t("done")}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.label, { color: theme.text }]}>{t("flightPassengers")}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => setAdults(count => Math.max(1, count - 1))}
          accessibilityRole="button"
          accessibilityLabel={t("flightPassengers")}
        >
          <Ionicons name="remove" size={18} color={NAVY} />
        </TouchableOpacity>
        <Text style={[styles.guestCount, { color: theme.text }]}>{adults}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => setAdults(count => Math.min(9, count + 1))}
          accessibilityRole="button"
          accessibilityLabel={t("flightPassengers")}
        >
          <Ionicons name="add" size={18} color={NAVY} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.searchBtn} onPress={() => void search()} accessibilityRole="button">
        <Ionicons name="airplane-outline" size={16} color={GOLD} />
        <Text style={styles.searchText}>{t("searchFlights")}</Text>
      </TouchableOpacity>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: ui.radius,
    borderWidth: ui.hairline,
    borderLeftWidth: 3,
    borderLeftColor: "#3A6DFF",
    padding: ui.cardPad,
    marginBottom: ui.gap,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 12 },
  otherField: { marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  results: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  resultsScroll: { maxHeight: 220 },
  resultRow: { paddingHorizontal: 12, paddingVertical: 10 },
  resultText: { fontSize: 14 },
  empty: { fontSize: 13, padding: 12 },
  spinner: { marginVertical: 8 },
  choiceRow: { flexDirection: "row", gap: 8 },
  dateRow: { marginTop: 12 },
  choice: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
  },
  choiceOn: { backgroundColor: NAVY, borderColor: GOLD },
  choiceCode: { fontSize: 13, fontWeight: "700" },
  choiceLabel: { fontSize: 12, marginTop: 2, textAlign: "center" },
  dateBtn: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
  dateLabel: { marginTop: 0, marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: "600" },
  clear: { color: GOLD, fontSize: 13, fontWeight: "600", marginTop: 8 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(201,168,76,0.18)",
  },
  guestCount: { fontSize: 18, fontWeight: "700", minWidth: 16, textAlign: "center" },
  error: { color: "#E24B4A", fontSize: 13, marginTop: 10 },
  searchBtn: {
    marginTop: 16,
    backgroundColor: NAVY,
    borderRadius: ui.radius,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  searchText: { color: GOLD, fontSize: 15, fontWeight: "700" },
})
