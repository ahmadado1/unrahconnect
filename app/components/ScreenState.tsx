import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { GOLD, ui } from "@/lib/ui"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AppButton from "./AppButton"
import FadeIn from "./FadeIn"

type Kind = "loading" | "empty" | "error" | "missing"

type Props = {
  kind?: Kind
  title?: string
  body?: string
  onRetry?: () => void
  onBack?: () => void
  showBack?: boolean
}

/** On-brand placeholder for loading / empty / missing screens. */
export default function ScreenState({
  kind = "empty",
  title,
  body,
  onRetry,
  onBack,
  showBack = true,
}: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const resolvedTitle =
    title ??
    (kind === "loading"
      ? t("pleaseWait")
      : kind === "error"
        ? t("somethingWentWrong")
        : t("emptyNothingHere"))

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <FadeIn style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: "rgba(201,168,76,0.16)" }]}>
          {kind === "loading" ? (
            <ActivityIndicator color={GOLD} />
          ) : (
            <AppIcon
              name={kind === "error" || kind === "missing" ? "sad" : "moon"}
              size={28}
              color={GOLD}
            />
          )}
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{resolvedTitle}</Text>
        {body ? (
          <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
        ) : null}
        {onRetry ? (
          <AppButton label={t("tryAgain")} onPress={onRetry} style={styles.action} />
        ) : null}
        {showBack && kind !== "loading" ? (
          <AppButton
            label={t("goBack")}
            variant="outline"
            onPress={() => (onBack ? onBack() : router.back())}
            style={styles.action}
          />
        ) : null}
      </FadeIn>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  inner: {
    width: "100%",
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: ui.radius,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  action: {
    alignSelf: "stretch",
    marginTop: 12,
  },
})
