import { AppIcon, AppIconKey, ICON_GOLD } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useMemo, useState } from "react"
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

export type SelectOption = {
  id: string
  label: string
  /** Optional leading text badge (e.g. country code "EG") */
  prefix?: string
  /** Optional vector icon beside label */
  icon?: AppIconKey
}

type SelectDropdownProps = {
  label?: string
  placeholder?: string
  value: string
  options: SelectOption[]
  onChange: (id: string) => void
  /** "sheet" = searchable modal (nationality). "menu" = compact inline list (gender). */
  variant?: "sheet" | "menu"
  searchable?: boolean
  searchPlaceholder?: string
  disabled?: boolean
}

export default function SelectDropdown({
  label,
  placeholder = "Select",
  value,
  options,
  onChange,
  variant = "sheet",
  searchable = true,
  searchPlaceholder = "Search…",
  disabled = false,
}: SelectDropdownProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = options.find(o => o.id === value)

  const renderOptionLabel = (opt: SelectOption, selectedStyle?: boolean) => (
    <View style={styles.optionLabelRow}>
      {opt.icon ? (
        <AppIcon name={opt.icon} size={18} color={selectedStyle ? ICON_GOLD : undefined} />
      ) : opt.prefix ? (
        <View style={styles.prefixBadge}>
          <Text style={styles.prefixBadgeText}>{opt.prefix}</Text>
        </View>
      ) : null}
      <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
    </View>
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      o =>
        o.label.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.prefix || "").toLowerCase().includes(q)
    )
  }, [options, query])

  const close = () => {
    setOpen(false)
    setQuery("")
  }

  const pick = (id: string) => {
    onChange(id)
    close()
  }

  if (variant === "menu") {
    return (
      <View style={styles.wrapper}>
        {label ? <Text style={[styles.label, { color: theme.text }]}>{label}</Text> : null}
        <TouchableOpacity
          style={[
            styles.menuTrigger,
            {
              backgroundColor: theme.card,
              borderColor: open ? "#C9A84C" : theme.border,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          onPress={() => !disabled && setOpen(o => !o)}
          activeOpacity={0.85}
          disabled={disabled}
        >
          {selected ? (
            renderOptionLabel(selected, true)
          ) : (
            <Text style={[styles.menuValue, { color: theme.textSecondary }]}>
              {placeholder}
            </Text>
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {open && (
          <View style={[styles.menu, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {options.map((opt, index) => {
              const isSelected = opt.id === value
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.menuOption,
                    { borderBottomColor: theme.border },
                    index === options.length - 1 && styles.optionLast,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => pick(opt.id)}
                  activeOpacity={0.7}
                >
                  {renderOptionLabel(opt)}
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="#C9A84C" />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: theme.text }]}>{label}</Text> : null}
      <TouchableOpacity
        style={[
          styles.sheetTrigger,
          {
            backgroundColor: theme.card,
            borderColor: open ? "#C9A84C" : theme.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.85}
        disabled={disabled}
      >
        {selected ? (
          renderOptionLabel(selected, true)
        ) : (
          <Text
            style={[styles.sheetValue, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {placeholder}
          </Text>
        )}
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {label || placeholder}
            </Text>
            <TouchableOpacity onPress={close} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {searchable && (
            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.textSecondary}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => {
              const isSelected = item.id === value
              return (
                <TouchableOpacity
                  style={[
                    styles.listRow,
                    { borderBottomColor: theme.border },
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => pick(item.id)}
                  activeOpacity={0.7}
                >
                  {renderOptionLabel(item)}
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#C9A84C" />
                  )}
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textSecondary }]}>
                No results
              </Text>
            }
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  menuTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuValue: { fontSize: 15, fontWeight: "500", flex: 1 },
  menu: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  sheetTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sheetValue: { fontSize: 15, flex: 1, marginRight: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: "75%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
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
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  optionLast: { borderBottomWidth: 0 },
  optionSelected: { backgroundColor: "rgba(201,168,76,0.08)" },
  optionLabelRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  optionLabel: { fontSize: 15, flex: 1 },
  prefixBadge: {
    backgroundColor: "rgba(30,58,95,0.1)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: "center",
  },
  prefixBadgeText: { fontSize: 11, fontWeight: "700", color: "#1E3A5F" },
  empty: { textAlign: "center", paddingVertical: 28, fontSize: 14 },
})
