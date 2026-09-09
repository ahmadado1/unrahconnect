import { type ReactNode, useEffect, useRef } from "react"
import { Animated, type StyleProp, type ViewStyle } from "react-native"

type Props = {
  children: ReactNode
  delay?: number
  style?: StyleProp<ViewStyle>
}

/** Short fade + rise used for placeholders and first paint — not for every list row. */
export default function FadeIn({ children, delay = 0, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(10)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [delay, opacity, translateY])

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  )
}
