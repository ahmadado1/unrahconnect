import { GOLD, NAVY, ui } from "@/lib/ui"
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>
  /** Ignored — kept so this can replace TouchableOpacity drop-in. */
  activeOpacity?: number
}

/**
 * Shared tap target: slight scale + opacity on press, faded when disabled.
 */
export default function AppPressable({
  style,
  disabled,
  children,
  android_ripple,
  activeOpacity: _activeOpacity,
  ...rest
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      android_ripple={
        android_ripple ?? {
          color: "rgba(201,168,76,0.22)",
          foreground: false,
        }
      }
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        {
          opacity: disabled ? ui.disabledOpacity : state.pressed ? ui.pressOpacity : 1,
          transform: [{ scale: disabled || !state.pressed ? 1 : ui.pressScale }],
        },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  )
}

export { GOLD, NAVY }
