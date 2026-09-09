import { useTheme } from "@/context/themeContext"
import { cardChrome } from "@/lib/ui"
import type { ReactNode } from "react"
import { View, type StyleProp, type ViewStyle } from "react-native"
import AppPressable from "./AppPressable"

type Props = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  onPress?: () => void
  disabled?: boolean
}

/** Shared card chrome: 16 radius, 16 padding, hairline + soft navy shadow. */
export default function AppCard({ children, style, onPress, disabled }: Props) {
  const { theme } = useTheme()
  const chrome = [
    cardChrome,
    { backgroundColor: theme.card, borderColor: theme.border },
    style,
  ]

  if (onPress) {
    return (
      <AppPressable onPress={onPress} disabled={disabled} style={chrome}>
        {children}
      </AppPressable>
    )
  }

  return <View style={chrome}>{children}</View>
}
