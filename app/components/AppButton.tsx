import { useTheme } from "@/context/themeContext"
import { GOLD, NAVY, ui } from "@/lib/ui"
import type { ReactNode } from "react"
import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native"
import AppPressable from "./AppPressable"

type Variant = "navy" | "gold" | "outline"

type Props = {
  label: string
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: Variant
  style?: StyleProp<ViewStyle>
  icon?: ReactNode
}

export default function AppButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "navy",
  style,
  icon,
}: Props) {
  const { theme } = useTheme()
  const isDisabled = Boolean(disabled || loading)
  const bg =
    variant === "gold" ? GOLD : variant === "outline" ? "transparent" : NAVY
  const fg = variant === "gold" ? NAVY : variant === "outline" ? theme.text : "#fff"
  const border =
    variant === "outline" ? { borderWidth: 1.5, borderColor: GOLD } : null

  return (
    <AppPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.btn, { backgroundColor: bg }, border, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </>
      )}
    </AppPressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: ui.radius,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
})
