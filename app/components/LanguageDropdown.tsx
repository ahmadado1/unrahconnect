import i18n from "@/i18n"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "ar", label: "العربية", native: "العربية" },
  { code: "bn", label: "বাংলা", native: "বাংলা" },
  { code: "fr", label: "Français", native: "Français" },
  { code: "ur", label: "اردو", native: "اردو" },
  { code: "tr", label: "Türkçe", native: "Türkçe" },
] as const

export function getLanguageLabel(code: string) {
  const base = (code || "en").split("-")[0].toLowerCase()
  const lang = LANGUAGES.find(l => l.code === base) ?? LANGUAGES[0]
  return lang.label
}

function LanguageCodeBadge({ code }: { code: string }) {
  return (
    <View style={styles.codeBadge}>
      <Text style={styles.codeBadgeText}>{code.toUpperCase()}</Text>
    </View>
  )
}

type LanguageDropdownProps = {
  value: string
  onChange: (code: string) => void
  open: boolean
  onToggle: () => void
}

export default function LanguageDropdown({ value, onChange, open, onToggle }: LanguageDropdownProps) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const selected = LANGUAGES.find(l => l.code === value.split("-")[0].toLowerCase()) ?? LANGUAGES[0]

  const selectLanguage = async (code: string) => {
    onChange(code)
    await i18n.changeLanguage(code)
    await AsyncStorage.setItem("language", code)
    const { applyRtlForLanguage } = await import("@/lib/rtl")
    await applyRtlForLanguage(code)
    // Keep mushaf offline; only fill missing translation surahs for the new language.
    const { ensureQuranForLanguage } = await import("@/lib/quranDownload")
    ensureQuranForLanguage(code).catch(console.log)
    if (open) onToggle()
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{t("language")}</Text>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: theme.card, borderColor: open ? "#C9A84C" : theme.border }]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        <View style={styles.triggerLeft}>
          <LanguageCodeBadge code={selected.code} />
          <View>
            <Text style={[styles.triggerValue, { color: theme.text }]}>{selected.label}</Text>
            <Text style={[styles.triggerHint, { color: theme.textSecondary }]}>{t("choosePreferredLanguage")}</Text>
          </View>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      {open && (
        <View style={[styles.menu, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = value === lang.code
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.option,
                  { borderBottomColor: theme.border },
                  index === LANGUAGES.length - 1 && styles.optionLast,
                  isSelected && styles.optionSelected,
                ]}
                onPress={() => selectLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <LanguageCodeBadge code={lang.code} />
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{lang.label}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color="#C9A84C" />}
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  triggerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  codeBadge: {
    backgroundColor: "rgba(30,58,95,0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: "center",
  },
  codeBadgeText: { fontSize: 11, fontWeight: "700", color: "#1E3A5F" },
  triggerValue: { fontSize: 15, fontWeight: "600" },
  triggerHint: { fontSize: 12, marginTop: 2 },
  menu: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  optionLast: { borderBottomWidth: 0 },
  optionSelected: { backgroundColor: "rgba(201,168,76,0.08)" },
  optionLabel: { fontSize: 15 },
})
