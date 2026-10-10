import { useTheme } from "@/context/themeContext"
import {
  DEPARTURE_AIRPORTS,
  formatTripSummary,
  hasPromptedForTripDetails,
  loadTripDetails,
  markTripDetailsPrompted,
  saveTripDetails,
  searchAirports,
  type AirportOption,
  type TripDetails,
} from "@/lib/tripDetails"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function parseDateKey(iso: string) {
  return new Date(`${iso}T12:00:00`)
}

function defaultCheckIn() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return toDateKey(date)
}

function addDays(iso: string, days: number) {
  const date = parseDateKey(iso)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

type PickerField = "checkIn" | "checkOut"

export function useTripDetails(autoPrompt: boolean) {
  const [trip, setTrip] = useState<TripDetails | null>(null)
  const [open, setOpen] = useState(false)

  const refresh = useCallback(async () => {
    const saved = await loadTripDetails()
    setTrip(saved)
    return saved
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const saved = await refresh()
      if (cancelled || !autoPrompt || saved) return
      const prompted = await hasPromptedForTripDetails()
      if (!cancelled && !prompted) setOpen(true)
    })()
    return () => {
      cancelled = true
    }
  }, [autoPrompt, refresh])

  const close = useCallback(() => {
    setOpen(false)
    void markTripDetailsPrompted()
  }, [])

  const onSaved = useCallback((next: TripDetails) => {
    setTrip(next)
    setOpen(false)
  }, [])

  return { trip, open, setOpen, close, onSaved, refresh }
}

export function TripDetailsChip({
  trip,
  onPress,
  light,
}: {
  trip: TripDetails | null
  onPress: () => void
  light?: boolean
}) {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const label = trip
    ? formatTripSummary(trip, i18n.language)
    : t("tripDetailsTitle")
  const ink = light ? theme.text : "#fff"
  return (
    <TouchableOpacity
      style={[styles.chip, light && { backgroundColor: theme.card, borderWidth: 0.5, borderColor: theme.border }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Ionicons name="calendar-outline" size={14} color={light ? GOLD : GOLD} />
      <Text style={[styles.chipText, { color: ink }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.chipEdit}>{t("tripEdit")}</Text>
    </TouchableOpacity>
  )
}

export default function TripDetailsSheet({
  visible,
  initial,
  onClose,
  onSaved,
}: {
  visible: boolean
  initial: TripDetails | null
  onClose: () => void
  onSaved: (trip: TripDetails) => void
}) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState("")
  const [airport, setAirport] = useState<AirportOption | null>(null)
  const [checkIn, setCheckIn] = useState(defaultCheckIn())
  const [checkOut, setCheckOut] = useState(addDays(defaultCheckIn(), 7))
  const [guests, setGuests] = useState(2)
  const [picker, setPicker] = useState<PickerField | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!visible) return
    setError("")
    setQuery("")
    setPicker(null)
    if (initial) {
      setAirport({
        code: initial.originCode,
        city: initial.originCity,
        country: "",
      })
      setCheckIn(initial.checkIn)
      setCheckOut(initial.checkOut)
      setGuests(initial.guests)
    } else {
      const start = defaultCheckIn()
      setAirport(null)
      setCheckIn(start)
      setCheckOut(addDays(start, 7))
      setGuests(2)
    }
  }, [visible, initial])

  const matches = useMemo(() => searchAirports(query).slice(0, 8), [query])
  const customCode = query.trim().toUpperCase()
  const showCustomCode = /^[A-Z]{3}$/.test(customCode) && !matches.some(item => item.code === customCode)

  const formatDay = (iso: string) =>
    parseDateKey(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })

  const onPickDate = (field: PickerField, date?: Date) => {
    if (!date) return
    const key = toDateKey(date)
    if (field === "checkIn") {
      setCheckIn(key)
      if (key >= checkOut) setCheckOut(addDays(key, 1))
    } else {
      setCheckOut(key)
    }
  }

  const save = async () => {
    if (!airport) {
      setError(t("tripOriginRequired"))
      return
    }
    if (checkOut <= checkIn) {
      setError(t("tripDatesInvalid"))
      return
    }
    const next: TripDetails = {
      originCode: airport.code,
      originCity: airport.city,
      checkIn,
      checkOut,
      guests,
    }
    await saveTripDetails(next)
    onSaved(next)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} accessibilityLabel={t("tripNotNow")} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t("tripDetailsTitle")}</Text>
          <Text style={styles.sub}>{t("tripDetailsSub")}</Text>

          <ScrollView keyboardShouldPersistTaps="handled" style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>{t("tripOriginLabel")}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={airport ? `${airport.city} (${airport.code})` : t("tripOriginPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {(query.trim().length > 0 ? matches : DEPARTURE_AIRPORTS.slice(0, 6)).map(item => (
              <TouchableOpacity
                key={item.code}
                style={[styles.airportRow, airport?.code === item.code && styles.airportRowOn]}
                onPress={() => {
                  setAirport(item)
                  setQuery("")
                }}
              >
                <Text style={styles.airportCode}>{item.code}</Text>
                <Text style={styles.airportCity}>{item.city}</Text>
              </TouchableOpacity>
            ))}
            {showCustomCode ? (
              <TouchableOpacity
                style={styles.airportRow}
                onPress={() => {
                  setAirport({ code: customCode, city: customCode, country: "" })
                  setQuery("")
                }}
              >
                <Text style={styles.airportCode}>{customCode}</Text>
                <Text style={styles.airportCity}>{t("useAirportCode", { code: customCode })}</Text>
              </TouchableOpacity>
            ) : null}
            {airport && !query ? (
              <Text style={styles.selectedAirport}>
                {airport.city} ({airport.code})
              </Text>
            ) : null}

            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setPicker("checkIn")}>
                <Text style={styles.label}>{t("tripDepartLabel")}</Text>
                <Text style={styles.dateValue}>{formatDay(checkIn)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setPicker("checkOut")}>
                <Text style={styles.label}>{t("tripReturnLabel")}</Text>
                <Text style={styles.dateValue}>{formatDay(checkOut)}</Text>
              </TouchableOpacity>
            </View>

            {picker ? (
              <View>
                <DateTimePicker
                  value={parseDateKey(picker === "checkIn" ? checkIn : checkOut)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={picker === "checkOut" ? parseDateKey(addDays(checkIn, 1)) : new Date()}
                  themeVariant="dark"
                  onChange={(event, date) => {
                    if (Platform.OS === "android") {
                      setPicker(null)
                      if (event.type === "set") onPickDate(picker, date)
                      return
                    }
                    onPickDate(picker, date)
                  }}
                />
                {Platform.OS === "ios" ? (
                  <TouchableOpacity onPress={() => setPicker(null)}>
                    <Text style={styles.pickerDone}>{t("done")}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.label}>{t("tripGuestsLabel")}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setGuests(count => Math.max(1, count - 1))}
              >
                <Ionicons name="remove" size={18} color={NAVY} />
              </TouchableOpacity>
              <Text style={styles.guestCount}>{guests}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setGuests(count => Math.min(9, count + 1))}
              >
                <Ionicons name="add" size={18} color={NAVY} />
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={() => void save()}>
            <Text style={styles.saveText}>{t("tripSave")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.laterBtn}>
            <Text style={styles.laterText}>{t("tripNotNow")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: NAVY,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "88%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18, marginTop: 6, marginBottom: 12 },
  form: { maxHeight: 420 },
  label: { color: GOLD, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  airportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  airportRowOn: { backgroundColor: "rgba(201,168,76,0.15)", borderRadius: 8, paddingHorizontal: 8 },
  airportCode: { color: GOLD, fontWeight: "700", width: 42 },
  airportCity: { color: "#fff", fontSize: 14, flex: 1 },
  selectedAirport: { color: "#fff", fontSize: 13, marginTop: 4 },
  dateRow: { flexDirection: "row", gap: 10 },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 10,
  },
  dateValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  pickerDone: { color: GOLD, textAlign: "right", fontWeight: "700", paddingVertical: 6 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  guestCount: { color: "#fff", fontSize: 18, fontWeight: "700", minWidth: 20, textAlign: "center" },
  error: { color: "#F4A6A6", marginTop: 10, fontSize: 13 },
  saveBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { color: NAVY, fontWeight: "700", fontSize: 16 },
  laterBtn: { alignItems: "center", paddingVertical: 12 },
  laterText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(201,168,76,0.15)",
    maxWidth: "100%",
  },
  chipLight: { backgroundColor: "rgba(30,58,95,0.08)" },
  chipText: { color: "#fff", fontSize: 12, fontWeight: "600", flexShrink: 1 },
  chipTextLight: { color: NAVY },
  chipEdit: { color: GOLD, fontSize: 12, fontWeight: "700" },
})
