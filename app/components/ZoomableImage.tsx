import { Ionicons } from "@expo/vector-icons"
import { useCallback, useState } from "react"
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  ImageStyle,
  Modal,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")

type Props = {
  source: ImageSourcePropType
  style?: StyleProp<ViewStyle>
  imageStyle?: StyleProp<ImageStyle>
  accessibilityLabel?: string
}

function ZoomModal({
  source,
  visible,
  onClose,
}: {
  source: ImageSourcePropType
  visible: boolean
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedX = useSharedValue(0)
  const savedY = useSharedValue(0)

  const resetTransform = useCallback(() => {
    scale.value = 1
    savedScale.value = 1
    translateX.value = 0
    translateY.value = 0
    savedX.value = 0
    savedY.value = 0
  }, [scale, savedScale, translateX, translateY, savedX, savedY])

  const handleClose = useCallback(() => {
    resetTransform()
    onClose()
  }, [onClose, resetTransform])

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.min(4, Math.max(1, savedScale.value * e.scale))
    })
    .onEnd(() => {
      savedScale.value = scale.value
      if (scale.value <= 1.05) {
        scale.value = withTiming(1)
        savedScale.value = 1
        translateX.value = withTiming(0)
        translateY.value = withTiming(0)
        savedX.value = 0
        savedY.value = 0
      }
    })

  const pan = Gesture.Pan()
    .onUpdate(e => {
      if (scale.value > 1) {
        translateX.value = savedX.value + e.translationX
        translateY.value = savedY.value + e.translationY
      } else if (e.translationY > 0) {
        translateY.value = e.translationY
      }
    })
    .onEnd(e => {
      if (scale.value <= 1 && e.translationY > 100) {
        runOnJS(handleClose)()
        return
      }
      if (scale.value <= 1) {
        translateY.value = withTiming(0)
        savedY.value = 0
        return
      }
      savedX.value = translateX.value
      savedY.value = translateY.value
    })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.1) {
        scale.value = withTiming(1)
        savedScale.value = 1
        translateX.value = withTiming(0)
        translateY.value = withTiming(0)
        savedX.value = 0
        savedY.value = 0
      } else {
        scale.value = withTiming(2)
        savedScale.value = 2
      }
    })

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap)

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: scale.value <= 1 ? Math.max(0.4, 1 - translateY.value / 280) : 1,
  }))

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.modalRoot}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              accessibilityLabel="Close"
              hitSlop={12}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <GestureDetector gesture={composed}>
            <Animated.View style={styles.zoomStage}>
              <Animated.Image
                source={source}
                style={[styles.zoomImage, imageAnimStyle]}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  )
}

/** Card image with expand control + full-screen pinch/pan zoom viewer. */
export default function ZoomableImage({
  source,
  style,
  imageStyle,
  accessibilityLabel = "Tap to zoom",
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <TouchableOpacity
        style={[styles.frame, style]}
        onPress={() => setVisible(true)}
        activeOpacity={0.92}
        accessibilityRole="imagebutton"
        accessibilityLabel={accessibilityLabel}
      >
        <Image source={source} style={[styles.image, imageStyle]} resizeMode="cover" />
        <View style={styles.expandBtn} pointerEvents="none">
          <Ionicons name="expand" size={18} color="#fff" />
        </View>
      </TouchableOpacity>

      <ZoomModal source={source} visible={visible} onClose={() => setVisible(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "rgba(30,58,95,0.08)",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  expandBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalRoot: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "#000" },
  modalHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    alignItems: "flex-end",
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
  },
})
