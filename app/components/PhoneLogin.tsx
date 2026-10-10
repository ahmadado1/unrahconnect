import AppButton from "@/app/components/AppButton"
import SelectDropdown from "@/app/components/SelectDropdown"
import TouchableOpacity from "@/app/components/AppPressable"
import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { useTheme } from "@/context/themeContext"
import {
  COUNTRY_DIALS,
  detectDefaultCountryCode,
  digitsOnly,
  formatFullPhone,
} from "@/lib/countries"
import { isNetworkError } from "@/lib/networkError"
import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  I18nManager,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const PRIORITY_COUNTRIES = ["NG", "SA", "EG", "PK", "IN", "BD", "TR", "GB", "US"]
const CODE_LENGTH = 6
const RESEND_SECONDS = 60
/** Twilio Verify codes stay valid for about 10 minutes. Supabase reports a wrong code and an expired code with the same message. */
const CODE_TTL_MS = 10 * 60 * 1000

type OtpError = { message?: string; code?: string }

function isValidE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone)
}

function verifyErrorKey(error: OtpError, sentAt: number) {
  const code = String(error.code || "").toLowerCase()
  const message = String(error.message || "").toLowerCase()
  const saysExpired = code === "otp_expired" || message.includes("expired") || message.includes("20404")
  const saysInvalid = message.includes("invalid") || code.includes("invalid")
  const saysPhone =
    message.includes("phone") &&
    (message.includes("invalid") || message.includes("valid") || message.includes("format") || message.includes("e.164"))

  if (saysPhone) return "phoneInvalid"
  if (saysExpired && !saysInvalid) return "phoneCodeExpired"
  if (saysExpired && saysInvalid) {
    return Date.now() - sentAt >= CODE_TTL_MS ? "phoneCodeExpired" : "phoneCodeWrong"
  }
  return "phoneCodeWrong"
}

function sendErrorKey(error: OtpError) {
  const message = String(error.message || "").toLowerCase()
  if (
    message.includes("phone") ||
    message.includes("e.164") ||
    message.includes("not a valid") ||
    (message.includes("invalid") && (message.includes("number") || message.includes("format")))
  ) {
    return "phoneInvalid"
  }
  return "somethingWentWrong"
}

type Props = {
  onBack: () => void
}

export default function PhoneLogin({ onBack }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const codeRef = useRef<TextInput>(null)
  const verifyingRef = useRef(false)
  const sentAtRef = useRef(0)

  const [step, setStep] = useState<"number" | "code">("number")
  const [countryCode, setCountryCode] = useState(detectDefaultCountryCode)
  const [localNumber, setLocalNumber] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const countryOptions = useMemo(() => {
    const byCode = new Map(COUNTRY_DIALS.map(country => [country.code, country]))
    const priority = PRIORITY_COUNTRIES.map(code => byCode.get(code)).filter(country => country != null)
    const rest = COUNTRY_DIALS.filter(country => !PRIORITY_COUNTRIES.includes(country.code))
    return [...priority, ...rest].map(country => ({
      id: country.code,
      label: country.name,
      prefix: country.dial,
    }))
  }, [])

  useEffect(() => {
    if (step !== "code") return
    const timer = setInterval(() => {
      setSecondsLeft(current => (current <= 0 ? 0 : current - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [step, phone])

  useEffect(() => {
    if (step !== "code") return
    const timer = setTimeout(() => codeRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [step])

  const sendCode = async () => {
    setError("")
    const nextPhone = formatFullPhone(countryCode, localNumber)
    if (!isValidE164(nextPhone)) {
      setError(t("phoneInvalid"))
      return
    }

    setSending(true)
    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({ phone: nextPhone })
      if (sendError) {
        setError(isNetworkError(sendError) ? t("networkError") : t(sendErrorKey(sendError)))
        return
      }
    } catch (sendError) {
      setError(isNetworkError(sendError) ? t("networkError") : t("somethingWentWrong"))
      return
    } finally {
      setSending(false)
    }

    sentAtRef.current = Date.now()
    setPhone(nextPhone)
    setCode("")
    setSecondsLeft(RESEND_SECONDS)
    setStep("code")
  }

  const verifyCode = async (token: string) => {
    if (verifyingRef.current || token.length !== CODE_LENGTH || !phone) return
    verifyingRef.current = true
    setVerifying(true)
    setError("")
    let succeeded = false

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      })

      if (verifyError) {
        setCode("")
        setError(isNetworkError(verifyError) ? t("networkError") : t(verifyErrorKey(verifyError, sentAtRef.current)))
        codeRef.current?.focus()
        return
      }

      succeeded = true
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const profileComplete = user?.user_metadata?.profile_complete
      if (!profileComplete) {
        router.replace("/auth/setup" as any)
      } else {
        router.replace("/(tabs)")
      }
    } catch (verifyError) {
      setCode("")
      setError(isNetworkError(verifyError) ? t("networkError") : t("somethingWentWrong"))
      codeRef.current?.focus()
    } finally {
      if (!succeeded) {
        verifyingRef.current = false
        setVerifying(false)
      }
    }
  }

  const onCodeChange = (value: string) => {
    const next = digitsOnly(value).slice(0, CODE_LENGTH)
    setCode(next)
    setError("")
    if (next.length === CODE_LENGTH) void verifyCode(next)
  }

  const resend = async () => {
    if (secondsLeft > 0 || sending || !phone) return
    setSending(true)
    setError("")
    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({ phone })
      if (sendError) {
        setError(isNetworkError(sendError) ? t("networkError") : t(sendErrorKey(sendError)))
        return
      }
    } catch (sendError) {
      setError(isNetworkError(sendError) ? t("networkError") : t("somethingWentWrong"))
      return
    } finally {
      setSending(false)
    }
    sentAtRef.current = Date.now()
    setCode("")
    setSecondsLeft(RESEND_SECONDS)
    codeRef.current?.focus()
  }

  const changeNumber = () => {
    setStep("number")
    setCode("")
    setError("")
    verifyingRef.current = false
    setVerifying(false)
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={[styles.container, { paddingTop: insets.top + 12 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={step === "code" ? changeNumber : onBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t("back")}
          >
            <Ionicons name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#C9A84C" />
            <Text style={styles.backText}>{t("back")}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <AnimatedHeroIcon name="moon" size={60} accent="gold" style={{ marginBottom: 12 }} />
            <Text style={[styles.title, { color: theme.text }]}>
              {step === "number" ? t("phoneLoginTitle") : t("phoneCodeTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {step === "number" ? t("phoneLoginSubtitle") : t("phoneCodeSubtitle", { phone })}
            </Text>
          </View>

          {step === "number" ? (
            <View>
              <SelectDropdown
                label={t("countryCode")}
                placeholder={t("countryCode")}
                value={countryCode}
                options={countryOptions}
                onChange={setCountryCode}
                searchable
                searchPlaceholder={t("search")}
              />
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>{t("phoneNumber")}</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.phoneField,
                    { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder={t("phoneNumberPlaceholder")}
                  placeholderTextColor={theme.textSecondary}
                  value={localNumber}
                  onChangeText={value => {
                    setLocalNumber(digitsOnly(value))
                    setError("")
                  }}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <AppButton label={t("sendCode")} onPress={sendCode} loading={sending} style={styles.btn} />
            </View>
          ) : (
            <View>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => codeRef.current?.focus()}
                style={styles.codeWrap}
                accessibilityRole="none"
              >
                <View style={styles.codeRow} pointerEvents="none">
                  {Array.from({ length: CODE_LENGTH }, (_, index) => {
                    const filled = index < code.length
                    const active = index === code.length
                    return (
                      <View
                        key={index}
                        style={[
                          styles.codeBox,
                          {
                            backgroundColor: theme.card,
                            borderColor: active || filled ? "#C9A84C" : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.codeDigit, { color: theme.text }]}>{code[index] || ""}</Text>
                      </View>
                    )
                  })}
                </View>
                <TextInput
                  ref={codeRef}
                  value={code}
                  onChangeText={onCodeChange}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={CODE_LENGTH}
                  caretHidden
                  editable={!verifying}
                  style={styles.codeCapture}
                  accessibilityLabel={t("phoneCodeTitle")}
                />
              </TouchableOpacity>

              {verifying ? <ActivityIndicator color="#C9A84C" style={styles.waiting} /> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <AppButton
                label={secondsLeft > 0 ? t("resendCodeIn", { seconds: secondsLeft }) : t("resendCode")}
                onPress={resend}
                loading={sending}
                disabled={secondsLeft > 0 || verifying}
                variant="outline"
                style={styles.btn}
              />
              <TouchableOpacity onPress={changeNumber} style={styles.changeBtn} accessibilityRole="button">
                <Text style={styles.changeText}>{t("changeNumber")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 12, gap: 2 },
  backText: { color: "#C9A84C", fontSize: 15, fontWeight: "600" },
  header: { alignItems: "center", marginBottom: 28 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center" },
  inputGroup: { marginTop: 20, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 0.5 },
  phoneField: { writingDirection: "ltr", textAlign: "left" },
  error: { color: "#E24B4A", fontSize: 13, marginBottom: 16, marginTop: 8, textAlign: "center" },
  btn: { marginBottom: 12, marginTop: 8 },
  codeWrap: { marginTop: 8, marginBottom: 8 },
  codeRow: { flexDirection: "row", direction: "ltr", justifyContent: "space-between", gap: 8 },
  codeBox: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  codeDigit: { fontSize: 22, fontWeight: "700" },
  codeCapture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: "transparent",
    fontSize: 16,
  },
  waiting: { textAlign: "center", fontSize: 13, marginBottom: 8 },
  changeBtn: { alignSelf: "center", paddingVertical: 8 },
  changeText: { color: "#C9A84C", fontSize: 15, fontWeight: "600" },
})
