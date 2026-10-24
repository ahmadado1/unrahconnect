import { showPremiumPrompt } from "@/lib/premiumPrompt"
import i18n from "@/i18n"
import {
  MUSHAF_FONT_PREVIEW,
  MUSHAF_FONTS,
  type MushafFontConfig,
  type MushafFontId,
} from "@/lib/mushafFonts"
import type { QuranReadMode } from "@/lib/quranReadMode"
import { isRtlLanguage } from "@/lib/rtl"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  BackHandler,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { usePremium } from "@/lib/premium"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const PANEL_MAX_WIDTH = 360
const OPEN_MS = 240
const CLOSE_MS = 200

/** Physical side (not flipped by I18nManager): right in LTR, left in RTL. */
function useDrawerLayout() {
  const rtl = isRtlLanguage(i18n.language)
  const physicalLeft = rtl
  const layoutFlipped = I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL
  return {
    rtl,
    physicalLeft,
    edgeStyle: physicalLeft !== layoutFlipped ? { left: 0 } : { right: 0 },
    row: (rtl !== I18nManager.isRTL ? "row-reverse" : "row") as "row" | "row-reverse",
    textAlign: (rtl ? "right" : "left") as "right" | "left",
  }
}

export default function MushafSettingsDrawer({
  visible,
  onClose,
  children,
}: {
  visible: boolean
  onClose: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { physicalLeft, edgeStyle, row, textAlign } = useDrawerLayout()
  const panelWidth = Math.min(PANEL_MAX_WIDTH, Math.round(screenWidth * 0.86))
  const offscreen = physicalLeft ? -panelWidth : panelWidth

  const [mounted, setMounted] = useState(visible)
  const translateX = useSharedValue(offscreen)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      translateX.value = withTiming(0, { duration: OPEN_MS })
      return
    }
    translateX.value = withTiming(offscreen, { duration: CLOSE_MS }, finished => {
      if (finished) runOnJS(setMounted)(false)
    })
  }, [visible, offscreen, translateX])

  useEffect(() => {
    if (!visible) return
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [visible, onClose])

  const swipe = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onUpdate(e => {
      translateX.value = physicalLeft ? Math.min(0, e.translationX) : Math.max(0, e.translationX)
    })
    .onEnd(e => {
      const towardEdge = physicalLeft ? -e.velocityX : e.velocityX
      if (Math.abs(translateX.value) > panelWidth * 0.3 || towardEdge > 600) {
        runOnJS(onClose)()
      } else {
        translateX.value = withTiming(0, { duration: OPEN_MS })
      }
    })

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(translateX.value), [0, panelWidth], [1, 0]),
  }))

  if (!mounted) return null

  return (
    <GestureDetector gesture={swipe}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("mushafSettingsClose")}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            edgeStyle,
            { width: panelWidth, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
            physicalLeft ? styles.panelLeftEdge : styles.panelRightEdge,
            panelStyle,
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.panelHeader, { flexDirection: row }]}>
            <Text style={[styles.panelTitle, { textAlign }]}>{t("mushafSettingsTitle")}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t("mushafSettingsClose")}
            >
              <Ionicons name="close" size={22} color={GOLD} />
            </Pressable>
          </View>

          <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.panelBody} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

/** One titled group of settings inside the drawer. */
export function MushafSettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const { textAlign } = useDrawerLayout()
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign }]}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

function FontOption({
  font,
  selected,
  fontsLoaded,
  locked = false,
  onPress,
}: {
  font: MushafFontConfig
  selected: boolean
  fontsLoaded: boolean
  locked?: boolean
  onPress: () => void
}) {
  const { t } = useTranslation()
  const { row, textAlign } = useDrawerLayout()
  const label = font.labelKey ? t(font.labelKey) : font.name
  const note = font.labelKey
    ? font.noteKey
      ? `${t(font.noteKey)} · ${font.name}`
      : font.name
    : font.noteKey
      ? t(font.noteKey)
      : null
  const previewSize = Math.round(24 * font.sizeScale)

  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, font.premium && styles.optionPremium, selected && styles.optionSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={note ? `${label}, ${note}` : label}
    >
      <View style={[styles.optionTop, { flexDirection: row }]}>
        <View style={styles.optionLabels}>
          <View style={{ flexDirection: row, alignItems: "center", gap: 6 }}>
            <Text style={[styles.optionLabel, { textAlign }]}>{label}</Text>
            {font.premium ? (
              <View style={styles.proPill}>
                <Ionicons name="star" size={9} color={NAVY} />
                <Text style={styles.proPillText}>{t("premiumBadge").toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
          {note ? <Text style={[styles.optionNote, { textAlign }]}>{note}</Text> : null}
          {locked ? <Text style={[styles.lockedNote, { textAlign }]}>{t("premiumUnlocks")}</Text> : null}
        </View>
        <Ionicons
          name={selected ? "checkmark-circle" : locked ? "lock-closed" : "ellipse-outline"}
          size={selected ? 22 : 20}
          color={selected || locked ? GOLD : "rgba(255,255,255,0.3)"}
        />
      </View>
      <Text
        style={[
          styles.preview,
          locked && styles.previewLocked,
          {
            fontSize: previewSize,
            lineHeight: Math.round(previewSize * font.lineHeight),
          },
          fontsLoaded && { fontFamily: font.family },
        ]}
      >
        {MUSHAF_FONT_PREVIEW[font.textField]}
      </Text>
    </Pressable>
  )
}

const READ_MODE_OPTIONS = [
  { mode: "mushaf", icon: "book-outline", labelKey: "quranReadModeMushaf", noteKey: "quranReadModeMushafDesc" },
  { mode: "verses", icon: "list-outline", labelKey: "quranReadModeVerses", noteKey: "quranReadModeVersesDesc" },
] as const

export function MushafReadModeSection({
  mode,
  onSelect,
}: {
  mode: QuranReadMode
  onSelect: (mode: QuranReadMode) => void
}) {
  const { t } = useTranslation()
  const { row, textAlign } = useDrawerLayout()
  return (
    <MushafSettingsSection title={t("quranReadModeTitle")}>
      {READ_MODE_OPTIONS.map(option => {
        const selected = option.mode === mode
        return (
          <Pressable
            key={option.mode}
            onPress={() => onSelect(option.mode)}
            style={[styles.option, styles.modeOption, selected && styles.optionSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t(option.labelKey)}, ${t(option.noteKey)}`}
          >
            <View style={[styles.optionTop, { flexDirection: row }]}>
              <Ionicons name={option.icon} size={20} color={GOLD} />
              <View style={styles.optionLabels}>
                <Text style={[styles.optionLabel, { textAlign }]}>{t(option.labelKey)}</Text>
                <Text style={[styles.optionNote, { textAlign }]}>{t(option.noteKey)}</Text>
              </View>
              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={selected ? GOLD : "rgba(255,255,255,0.3)"}
              />
            </View>
          </Pressable>
        )
      })}
    </MushafSettingsSection>
  )
}

export function MushafTextSizeSection({
  fontSize,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
}: {
  fontSize: number
  onDecrease: () => void
  onIncrease: () => void
  canDecrease: boolean
  canIncrease: boolean
}) {
  const { t } = useTranslation()
  return (
    <MushafSettingsSection title={t("mushafTextSizeSection")}>
      <View style={styles.sizeRow}>
        <Pressable
          onPress={onDecrease}
          disabled={!canDecrease}
          hitSlop={6}
          style={[styles.sizeBtn, !canDecrease && styles.sizeBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={t("quranSmallerText")}
        >
          <Ionicons name="remove" size={22} color={GOLD} />
        </Pressable>
        <View style={styles.sizeValue}>
          <Text style={[styles.sizeMark, { fontSize: Math.min(fontSize, 34) }]}>أ</Text>
          <Text style={styles.optionNote}>{fontSize}</Text>
        </View>
        <Pressable
          onPress={onIncrease}
          disabled={!canIncrease}
          hitSlop={6}
          style={[styles.sizeBtn, !canIncrease && styles.sizeBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={t("quranLargerText")}
        >
          <Ionicons name="add" size={22} color={GOLD} />
        </Pressable>
      </View>
    </MushafSettingsSection>
  )
}

export function MushafFontSection({
  selectedId,
  onSelect,
  fontsLoaded,
}: {
  selectedId: MushafFontId
  onSelect: (id: MushafFontId) => void
  fontsLoaded: boolean
}) {
  const { t } = useTranslation()
  const { isPremium } = usePremium()
  return (
    <MushafSettingsSection title={t("mushafFontSection")}>
      {[false, true].map(premiumGroup => {
        const fonts = MUSHAF_FONTS.filter(font => font.premium === premiumGroup)
        if (!fonts.length) return null
        return (
          <View key={String(premiumGroup)} style={{ gap: 10 }}>
            {premiumGroup ? (
              <View style={styles.proHeader}>
                <Ionicons name="star" size={12} color={GOLD} />
                <Text style={styles.proHeaderText}>{t("premiumFontsSection")}</Text>
                {isPremium ? <Text style={styles.proHeaderOn}>{t("premiumUnlockedShort")}</Text> : null}
              </View>
            ) : null}
            {fonts.map(font => (
              <FontOption
                key={font.id}
                font={font}
                selected={font.id === selectedId}
                fontsLoaded={fontsLoaded}
                locked={font.premium && !isPremium}
                onPress={() => {
                  if (font.premium && !isPremium) {
                    showPremiumPrompt()
                    return
                  }
                  onSelect(font.id)
                }}
              />
            ))}
          </View>
        )
      })}
    </MushafSettingsSection>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: NAVY,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  panelLeftEdge: {
    borderRightWidth: 1,
    borderRightColor: "rgba(201,168,76,0.35)",
  },
  panelRightEdge: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(201,168,76,0.35)",
  },
  panelHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(201,168,76,0.35)",
  },
  panelTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  panelBody: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: GOLD,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  sectionBody: {
    gap: 10,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  optionSelected: {
    borderColor: GOLD,
    backgroundColor: "rgba(201,168,76,0.12)",
  },
  optionPremium: {
    borderColor: "rgba(201,168,76,0.45)",
    backgroundColor: "rgba(201,168,76,0.06)",
  },
  proPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: GOLD,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  proPillText: {
    color: NAVY,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  lockedNote: {
    color: GOLD,
    fontSize: 11,
    marginTop: 1,
  },
  previewLocked: {
    opacity: 0.55,
  },
  proHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  proHeaderText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  proHeaderOn: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  optionTop: {
    alignItems: "center",
    gap: 10,
  },
  optionLabels: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  optionNote: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  preview: {
    color: "#FAF6EE",
    textAlign: "center",
    writingDirection: "rtl",
    marginTop: 4,
  },
  modeOption: {
    paddingBottom: 12,
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 8,
  },
  sizeBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "rgba(201,168,76,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sizeBtnDisabled: {
    opacity: 0.35,
  },
  sizeValue: {
    alignItems: "center",
  },
  sizeMark: {
    color: "#FAF6EE",
    fontWeight: "700",
  },
})
