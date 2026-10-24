// Date / time picker that follows the APP's light or dark mode (not the phone's).
// Without this, an iPhone in dark mode shows white wheel text on the app's white card,
// so the dates are invisible. Pass themeVariant to override (e.g. on a navy sheet).
import { useTheme } from "@/context/themeContext"
import DateTimePicker from "@react-native-community/datetimepicker"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof DateTimePicker>

const GOLD = "#C9A84C"

export default function ThemedDateTimePicker(props: Props) {
  const { theme, isDark } = useTheme()
  return (
    <DateTimePicker
      themeVariant={isDark ? "dark" : "light"}
      textColor={theme.text}
      accentColor={GOLD}
      {...(props as any)}
    />
  )
}
