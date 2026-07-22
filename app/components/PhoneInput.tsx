import { useTheme } from "@/context/themeContext"
import {
  COUNTRY_DIALS,
  detectDefaultCountryCode,
  digitsOnly,
  formatFullPhone,
  getCountryByCode,
  parseStoredPhone,
} from "@/lib/countries"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useMemo, useState } from "react"
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type PhoneInputProps = {
  label?: string
  value: string
  onChange: (fullPhone: string) => void
  placeholder?: string
  /** Compact styling for profile edit rows */
  compact?: boolean
}

export default function PhoneInput({
  label,
  value,
  onChange,
  placeholder = "Phone number",
  compact = false,
}: PhoneInputProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [countryCode, setCountryCode] = useState(detectDefaultCountryCode())
  const [localNumber, setLocalNumber] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState("")

  // Hydrate only when parent value differs from what we already emit (e.g. profile load).
  useEffect(() => {
    const current = formatFullPhone(countryCode, localNumber)
    if (current === value) return
    if (!value) {
      if (localNumber) setLocalNumber("")
      return
    }
    const parsed = parseStoredPhone(value)
    setCountryCode(parsed.countryCode)
    setLocalNumber(parsed.localNumber)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional external sync
  }, [value])

  const country = getCountryByCode(countryCode)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRY_DIALS
    return COUNTRY_DIALS.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    )
  }, [query])

  const emit = (nextCode: string, nextLocal: string) => {
    onChange(formatFullPhone(nextCode, nextLocal))
  }

  const onLocalChange = (text: string) => {
    const cleaned = digitsOnly(text)
    setLocalNumber(cleaned)
    emit(countryCode, cleaned)
  }

  const pickCountry = (code: string) => {
    setCountryCode(code)
    emit(code, localNumber)
    setPickerOpen(false)
    setQuery("")
  }

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: theme.text, marginTop: compact ? 0 : 16 },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.row,
          {
            backgroundColor: compact ? theme.inputBg : theme.card,
            borderColor: pickerOpen ? "#C9A84C" : theme.border,
          },
          compact && styles.rowCompact,
        ]}
      >
        <TouchableOpacity
          style={[styles.codeBtn, { borderRightColor: theme.border }]}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={[styles.dial, { color: theme.text }]}>{country.dial}</Text>
          <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={localNumber}
          onChangeText={onLocalChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
        />
      </View>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Country code</Text>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search country or code"
              placeholderTextColor={theme.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => `${item.code}-${item.dial}`}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => {
              const selected = item.code === countryCode
              return (
                <TouchableOpacity
                  style={[
                    styles.countryRow,
                    { borderBottomColor: theme.border },
                    selected && styles.selected,
                  ]}
                  onPress={() => pickCountry(item.code)}
                >
                  <Text style={styles.rowFlag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.countryName, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {item.dial}
                    </Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color="#C9A84C" />
                  )}
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  rowCompact: { borderRadius: 8 },
  codeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 0.5,
  },
  flag: { fontSize: 18 },
  dial: { fontSize: 15, fontWeight: "600" },
  input: { flex: 1, fontSize: 15, paddingHorizontal: 12, paddingVertical: 14 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: "75%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  rowFlag: { fontSize: 24 },
  countryName: { fontSize: 15, fontWeight: "500" },
  selected: { backgroundColor: "rgba(201,168,76,0.08)" },
})
