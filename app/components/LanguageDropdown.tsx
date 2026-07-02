import i18n from "@/i18n"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export const LANGUAGES = [
  { code: "en", label: "🇬🇧 English", native: "English" },
  { code: "ar", label: "🇸🇦 العربية", native: "العربية" },
  { code: "bn", label: "🇧🇩 বাংলা", native: "বাংলা" },
  { code: "fr", label: "🇫🇷 Français", native: "Français" },
  { code: "ur", label: "🇵🇰 اردو", native: "اردو" },
  { code: "tr", label: "🇹🇷 Türkçe", native: "Türkçe" },
] as const

export function getLanguageLabel(code: string) {
  return LANGUAGES.find(l => l.code === code)?.label ?? LANGUAGES[0].label
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

  const selectLanguage = async (code: string) => {
    onChange(code)
    await i18n.changeLanguage(code)
    await AsyncStorage.setItem("language", code)
    const { clearQuranDownloadFlag } = await import("@/lib/quranPageCache")
    const { downloadFullQuran } = await import("@/lib/quranDownload")
    await clearQuranDownloadFlag()
    downloadFullQuran().catch(console.log)
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
          <View style={styles.iconCircle}>
            <Ionicons name="language" size={18} color="#C9A84C" />
          </View>
          <View>
            <Text style={[styles.triggerValue, { color: theme.text }]}>{getLanguageLabel(value)}</Text>
            <Text style={[styles.triggerHint, { color: theme.textSecondary }]}>{t("choosePreferredLanguage")}</Text>
          </View>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      {open && (
        <View style={[styles.menu, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {LANGUAGES.map((lang, index) => {
            const selected = value === lang.code
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.option,
                  { borderBottomColor: theme.border },
                  index === LANGUAGES.length - 1 && styles.optionLast,
                  selected && styles.optionSelected,
                ]}
                onPress={() => selectLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionLabel, { color: theme.text }]}>{lang.label}</Text>
                {selected && <Ionicons name="checkmark-circle" size={22} color="#C9A84C" />}
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(201,168,76,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
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
  optionLast: { borderBottomWidth: 0 },
  optionSelected: { backgroundColor: "rgba(201,168,76,0.08)" },
  optionLabel: { fontSize: 15 },
})
