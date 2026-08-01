import { useEffect, useRef } from "react"
import { Animated, StyleProp, ViewStyle } from "react-native"
import { AppIcon, AppIconKey, ICON_GOLD, ICON_NAVY } from "./AppIcon"

type Props = {
  name: AppIconKey
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
  /** Prefer gold on navy brand screens, navy elsewhere */
  accent?: "navy" | "gold"
}

/** Large decorative icon with subtle scale + fade-in (replaces emoji illustrations). */
export function AnimatedHeroIcon({
  name,
  size = 64,
  color,
  style,
  accent = "gold",
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.85)).current

  useEffect(() => {
    opacity.setValue(0)
    scale.setValue(0.85)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start()
  }, [name, opacity, scale])

  const tint = color ?? (accent === "gold" ? ICON_GOLD : ICON_NAVY)

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }], alignItems: "center" }, style]}>
      <AppIcon name={name} size={size} color={tint} />
    </Animated.View>
  )
}
