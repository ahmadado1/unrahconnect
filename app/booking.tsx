import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon";
import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PhoneInput from "./components/PhoneInput";
import { isNetworkError } from "@/lib/networkError";
import { supabase } from "../lib/supabase";
async function sendBookingEmail(params: Record<string, string | number>) {
  const response = await fetch(
    "https://yqabuipymbaylholmmoi.supabase.co/functions/v1/send-booking-email",
    {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYWJ1aXB5bWJheWxob2xtbW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODM3OTcsImV4cCI6MjA2MTg1OTc5N30.yT2HGTjPkPlvGQDMpKSoMATCIRHmjFZKhTzD4Oau5MQ"
      },
      body: JSON.stringify(params),
    }
  )
  if (!response.ok) throw new Error(await response.text())
}

export default function BookingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const params = useLocalSearchParams()

  const hotelName = params.hotelName as string
  const hotelCity = params.hotelCity as string
  const hotelPrice = params.hotelPrice as string

  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState("1")
  const [phone, setPhone] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState<"checkIn" | "checkOut" | null>(null)
  const [pickerDate, setPickerDate] = useState(new Date())
  const [showSuccess, setShowSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const openDatePicker = (type: "checkIn" | "checkOut") => {
    const existing = type === "checkIn" ? checkIn : checkOut
    setPickerDate(existing ? new Date(`${existing}T12:00:00`) : new Date())
    setShowPicker(type)
  }

  const toDateKey = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const pricePerNight = parseInt(hotelPrice) || 0
  const guestCount = parseInt(guests) || 1
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const totalPrice = nights > 0 ? pricePerNight * nights : 0
  const pickerMinimumDate = showPicker === "checkOut" && checkIn
    ? new Date(new Date(`${checkIn}T12:00:00`).getTime() + 86400000)
    : new Date()

  const formatDate = (dateString: string) => {
    if (!dateString) return t("selectCheckIn")
    return new Date(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  }

  const handleDateConfirm = (date: Date) => {
    const formatted = toDateKey(date)
    if (showPicker === "checkIn") setCheckIn(formatted)
    else if (showPicker === "checkOut") setCheckOut(formatted)
    setShowPicker(null)
  }

  const handleDateCancel = () => setShowPicker(null)

  const handleBooking = async () => {
    if (!checkIn || !checkOut || !phone) {
      Alert.alert("Missing Info", "Please fill in check in, check out and phone number")
      return
    }
    const bookingNights = Math.ceil(
      (new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (bookingNights <= 0) { Alert.alert("Invalid Dates", "Check out must be after check in"); return }

    setShowPicker(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { Alert.alert("Sign in required", "Please log in to complete your booking."); return }

      const { error: dbError } = await supabase.from("bookings").insert({
        user_id: user?.id, hotel_name: hotelName, hotel_city: hotelCity,
        check_in: checkIn, check_out: checkOut, guests: parseInt(guests),
        nights: bookingNights, total_price: pricePerNight * bookingNights,
        phone, special_requests: specialRequests, status: "pending",
      })
      if (dbError) throw dbError

      // Link booking to agent if pilgrim came via referral
        const { data: pilgrimAgent } = await supabase
        .from("pilgrim_agent")
        .select("agent_id")
        .eq("pilgrim_id", user.id)
        .single()

        if (pilgrimAgent?.agent_id) {
        await supabase.rpc("increment_agent_bookings", { 
          agent_id_input: pilgrimAgent.agent_id 
        })
        }

      let emailSent = false
      try {
        await sendBookingEmail({
          hotel_name: hotelName,
          hotel_city: hotelCity,
          guest_name: user?.user_metadata?.full_name || "Guest",
          guest_email: user?.email || "No email",
          guest_phone: phone,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          nights: bookingNights,
          total_price: pricePerNight * bookingNights,
          special_requests: specialRequests || "None",
        })
        emailSent = true
      } catch (emailError) {
        console.warn("Booking email failed:", emailError instanceof Error ? emailError.message : emailError)
      }

      Alert.alert(
        "Booking Confirmed!",
        emailSent ? "Your booking request has been sent..." : "Your booking was saved...",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
      )
    } catch (error: unknown) {
      console.error("Booking failed:", error)
      Alert.alert(
        t("bookingFailed"),
        isNetworkError(error) ? t("networkError") : t("somethingWentWrong")
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("bookHotel")}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Hotel summary */}
      <View style={[styles.hotelSummary, { backgroundColor: theme.header }]}>
        <Text style={styles.hotelSummaryName}>{hotelName}</Text>
        <Text style={styles.hotelSummaryCity}>{hotelCity} · ${hotelPrice} {t("perNight")}</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

        {/* Dates */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("dates")}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{t("checkIn")}</Text>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              onPress={() => openDatePicker("checkIn")}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.text} />
              <Text style={[styles.dateBtnText, { color: checkIn ? theme.text : theme.textSecondary }]}>
                {checkIn ? formatDate(checkIn) : t("selectCheckIn")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{t("checkOut")}</Text>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              onPress={() => openDatePicker("checkOut")}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.text} />
              <Text style={[styles.dateBtnText, { color: checkOut ? theme.text : theme.textSecondary }]}>
                {checkOut ? formatDate(checkOut) : t("selectCheckOut")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Android date picker */}
        {showPicker !== null && Platform.OS === "android" && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            minimumDate={pickerMinimumDate}
            onChange={(event, date) => {
              setShowPicker(null)
              if (event.type === "set" && date) handleDateConfirm(date)
            }}
          />
        )}

        {/* Guests & Contact */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("guestsContact")}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{t("numberOfGuests")}</Text>
            <View style={styles.guestsRow}>
              <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(prev => String(Math.max(1, parseInt(prev) - 1)))}>
                <Text style={styles.guestBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.guestCount, { color: theme.text }]}>{guests}</Text>
              <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(prev => String(Math.min(10, parseInt(prev) + 1)))}>
                <Text style={styles.guestBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <PhoneInput
              label={t("phoneNumber")}
              value={phone}
              onChange={setPhone}
              placeholder={t("enterPhone")}
            />
          </View>
        </View>

        {/* Price summary */}
        <View style={styles.priceSummary}>
          <Text style={styles.priceSummaryTitle}>{t("priceSummary")}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t("roomRate")}</Text>
            <Text style={styles.priceValue}>${pricePerNight} {t("perNight")}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t("guests")}</Text>
            <Text style={styles.priceValue}>{guestCount} {guestCount === 1 ? t("guest") : t("guests")}</Text>
          </View>
          {checkIn && checkOut ? (
            nights > 0 ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{t("stay")}</Text>
                  <Text style={styles.priceValue}>{formatDate(checkIn)} → {formatDate(checkOut)} ({nights} {nights === 1 ? t("night") : t("nights")})</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>${pricePerNight} × {nights} {t("nights")}</Text>
                  <Text style={styles.priceValue}>${totalPrice}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>{t("total")}</Text>
                  <Text style={styles.priceTotalValue}>${totalPrice}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.priceHint}>{t("checkOutAfterCheckIn")}</Text>
            )
          ) : (
            <Text style={styles.priceHint}>{t("selectDatesForTotal")}</Text>
          )}
        </View>

        {/* Special Requests */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("specialRequests")}</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{t("specialRequestsLabel")}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder={t("specialRequestsPlaceholder")}
              placeholderTextColor={theme.textSecondary}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          <Text style={styles.confirmBtnText}>
            {loading ? t("sendingBooking") : t("confirmBooking")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* iOS date picker modal */}
      {showPicker !== null && Platform.OS === "ios" && (
        <Modal transparent animationType="slide" visible>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={handleDateCancel}>
                  <Text style={styles.pickerCancel}>{t("cancel")}</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>{showPicker === "checkIn" ? t("checkIn") : t("checkOut")}</Text>
                <TouchableOpacity onPress={() => handleDateConfirm(pickerDate)}>
                  <Text style={styles.pickerDone}>{t("done")}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.pickerPreview}>
                {pickerDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </Text>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                themeVariant="dark"
                minimumDate={pickerMinimumDate}
                onChange={(_, date) => date && setPickerDate(date)}
                style={styles.pickerWheel}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Success Modal */}
      <Modal transparent animationType="fade" visible={showSuccess}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#1E3A5F", borderRadius: 24, padding: 28, alignItems: "center", width: "100%" }}>
            <AnimatedHeroIcon name="checkmarkCircle" size={56} accent="gold" style={{ marginBottom: 16 }} />
            <Text style={{ color: "#C9A84C", fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>{t("bookingConfirmed")}</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 8 }}>
              {t("bookingReceivedAt", { hotel: hotelName })}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
              {emailSent ? t("bookingEmailSent") : t("bookingWillContact")}
            </Text>
            <View style={{ height: 0.5, backgroundColor: "rgba(201,168,76,0.3)", width: "100%", marginBottom: 24 }} />
            <TouchableOpacity
              style={{ backgroundColor: "#C9A84C", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 40, width: "100%", alignItems: "center" }}
              onPress={() => { setShowSuccess(false); router.replace("/(tabs)") }}
            >
              <Text style={{ color: "#1E3A5F", fontSize: 16, fontWeight: "bold" }}>{t("backToHome")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hotelSummary: { paddingHorizontal: 20, paddingBottom: 20 },
  hotelSummaryName: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hotelSummaryCity: { color: "#C9A84C", fontSize: 13, marginTop: 4 },
  form: { flex: 1 },
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 0.5 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 14 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: { borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 0.5 },
  textArea: { height: 100, textAlignVertical: "top" },
  dateBtn: { borderRadius: 10, padding: 12, borderWidth: 0.5, flexDirection: "row", alignItems: "center", gap: 10 },
  dateBtnText: { fontSize: 14, flex: 1 },
  guestsRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  guestBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" },
  guestBtnText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  guestCount: { fontSize: 20, fontWeight: "bold", minWidth: 30, textAlign: "center" },
  priceSummary: { backgroundColor: "#1E3A5F", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16 },
  priceSummaryTitle: { color: "#C9A84C", fontSize: 15, fontWeight: "bold", marginBottom: 12 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  priceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  priceValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
  priceDivider: { height: 0.5, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 8 },
  priceTotalLabel: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  priceTotalValue: { color: "#C9A84C", fontSize: 18, fontWeight: "bold" },
  priceHint: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4, lineHeight: 20 },
  confirmBtn: { backgroundColor: "#C9A84C", marginHorizontal: 16, marginTop: 16, borderRadius: 25, padding: 16, alignItems: "center" },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: "#1E3A5F", fontSize: 16, fontWeight: "bold" },
  pickerOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  pickerSheet: { backgroundColor: "#1E3A5F", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 34 },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.15)" },
  pickerTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  pickerCancel: { fontSize: 16, color: "rgba(255,255,255,0.7)" },
  pickerDone: { fontSize: 16, fontWeight: "bold", color: "#C9A84C" },
  pickerPreview: { color: "#C9A84C", fontSize: 17, fontWeight: "600", textAlign: "center", paddingVertical: 12, paddingHorizontal: 16 },
  pickerWheel: { height: 216, alignSelf: "center", width: "100%" },
})