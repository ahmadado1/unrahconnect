// Text that gently fades in and out (a soft "breathing" glow). Used for Today's Dhikr on Home.
import { useEffect, useState } from "react"
import { Animated, type StyleProp, type TextStyle } from "react-native"

export default function GlowText({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const [opacity] = useState(() => new Animated.Value(1))

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 1400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return <Animated.Text style={[style, { opacity }]}>{children}</Animated.Text>
}
