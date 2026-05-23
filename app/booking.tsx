// Gets hotel info passed from hotel detail screen and lets us navigate
import { useLocalSearchParams, useRouter } from "expo-router";
// Controls status bar style
import { StatusBar } from "expo-status-bar";
// useState stores data that changes
import { useState } from "react";
// UI components we need
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
// Gets dynamic island height
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Icons
import { Ionicons } from "@expo/vector-icons";
// Supabase to save booking to database
import { supabase } from "../lib/supabase";

// EmailJS credentials — these connect our app to your EmailJS account
const EMAILJS_SERVICE_ID = "service_1n51wzk"
const EMAILJS_TEMPLATE_ID = "hyzjzza"
const EMAILJS_PUBLIC_KEY = "FHzLPzlS0xVz4wFoD"
// EMAIL-FIX-1: Private key required when EmailJS "strict mode" + non-browser (Expo/React Native) is enabled
// Copy from EmailJS dashboard → Account → API keys → Private Key, then set in .env (see .env.example)
const EMAILJS_PRIVATE_KEY = process.env.EXPO_PUBLIC_EMAILJS_PRIVATE_KEY ?? ""

// Sends booking notification email via EmailJS REST API (works in React Native)
async function sendBookingEmail(templateParams: Record<string, string | number>) {
  // EMAIL-FIX-2: Fail fast with a clear message instead of EmailJS's cryptic "no Private Key" error
  if (!EMAILJS_PRIVATE_KEY) {
    throw new Error(
      "Missing EXPO_PUBLIC_EMAILJS_PRIVATE_KEY in .env — add your EmailJS private key and restart Expo (bun expo start -c)."
    )
  }

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      // EMAIL-FIX-3: accessToken is the private key — required for API calls from React Native in strict mode
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: templateParams,
    }),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Email failed (${response.status})`)
  }
}

export default function BookingScreen() {
  // For navigating back or to home screen
  const router = useRouter()
  // For dynamic island padding
  const insets = useSafeAreaInsets()
  // Gets all params passed from hotel detail screen
  const params = useLocalSearchParams()

  // Unpack the three hotel details from params
  // "as string" tells TypeScript these are text values
  const hotelName = params.hotelName as string
  const hotelCity = params.hotelCity as string
  const hotelPrice = params.hotelPrice as string

  // Check in date — starts empty, user picks from calendar
  const [checkIn, setCheckIn] = useState("")
  // Check out date — starts empty, user picks from calendar
  const [checkOut, setCheckOut] = useState("")
  // Number of guests — starts at 1
  const [guests, setGuests] = useState("1")
  // User's phone number for contact
  const [phone, setPhone] = useState("")
  // Optional special requests from user
  const [specialRequests, setSpecialRequests] = useState("")
  // True while sending email and saving to database
  const [loading, setLoading] = useState(false)
  // Controls which date picker is open — null means none are open
  // Can only be "checkIn", "checkOut" or null
  const [showPicker, setShowPicker] = useState<"checkIn" | "checkOut" | null>(null)
  // Date shown in the iOS picker while user is selecting
  const [pickerDate, setPickerDate] = useState(new Date())

  const openDatePicker = (type: "checkIn" | "checkOut") => {
    const existing = type === "checkIn" ? checkIn : checkOut
    setPickerDate(existing ? new Date(`${existing}T12:00:00`) : new Date())
    setShowPicker(type)
  }

  // Avoid timezone bugs from toISOString() shifting the calendar day
  const toDateKey = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const pricePerNight = parseInt(hotelPrice) || 0
  const guestCount = parseInt(guests) || 1
  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0
  const totalPrice = nights > 0 ? pricePerNight * nights : 0

  const pickerMinimumDate =
    showPicker === "checkOut" && checkIn
      ? new Date(new Date(`${checkIn}T12:00:00`).getTime() + 86400000)
      : new Date()

  // Converts "2026-06-15" to readable "Mon, Jun 15 2026"
  const formatDate = (dateString: string) => {
    // If no date selected yet return placeholder text
    if (!dateString) return "Select date"
    // Create a Date object from the string
    const date = new Date(dateString)
    // Format it in a readable way
    return date.toLocaleDateString("en-US", { 
      weekday: "short", // e.g. Mon
      month: "short",   // e.g. Jun
      day: "numeric",   // e.g. 15
      year: "numeric"   // e.g. 2026
    })
  }

  // Called when user picks a date from the calendar
  const handleDateConfirm = (date: Date) => {
    const formatted = toDateKey(date)
    
    // Update the correct date based on which picker was open
    if (showPicker === "checkIn") {
      setCheckIn(formatted)
    } else if (showPicker === "checkOut") {
      setCheckOut(formatted)
    }
    
    // Close the calendar after user picks a date
    setShowPicker(null)
  }

  // Called when user taps cancel on the calendar
  const handleDateCancel = () => {
    // Just close the calendar without changing anything
    setShowPicker(null)
  }

  // Main booking function — runs when user taps "Confirm Booking"
  const handleBooking = async () => {

    // Validate required fields before doing anything
    if (!checkIn || !checkOut || !phone) {
      // Show popup if any required field is empty
      Alert.alert("Missing Info", "Please fill in check in, check out and phone number")
      return // Stop here if validation fails
    }

    // Calculate number of nights
    // getTime() converts dates to milliseconds
    // Subtract check in from check out to get difference
    // Divide by milliseconds in a day to get days
    // Math.ceil rounds up — hotels charge full nights
    const bookingNights = Math.ceil(
      (new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) 
      / (1000 * 60 * 60 * 24)
    )

    // Make sure check out is after check in
    if (bookingNights <= 0) {
      Alert.alert("Invalid Dates", "Check out must be after check in")
      return
    }

    setShowPicker(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert("Sign in required", "Please log in to complete your booking.")
        return
      }

      // Save booking first — this is the source of truth
      const { error: dbError } = await supabase.from("bookings").insert({
        user_id: user?.id,
        hotel_name: hotelName,
        hotel_city: hotelCity,
        check_in: checkIn,
        check_out: checkOut,
        guests: parseInt(guests),
        nights: bookingNights,
        total_price: pricePerNight * bookingNights,
        phone: phone,
        special_requests: specialRequests,
        status: "pending",
      })

      if (dbError) throw dbError

      // Email is optional — booking still succeeds if EmailJS is blocked
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
          guests: guests,
          nights: bookingNights,
          special_requests: specialRequests || "None",
        })
        emailSent = true
      } catch (emailError) {
        // EMAIL-FIX-4: Log a readable hint when the private key env var is missing
        const emailMessage =
          emailError instanceof Error ? emailError.message : String(emailError)
        console.warn("Booking email failed:", emailMessage)
      }

      Alert.alert(
        "Booking Confirmed! 🎉",
        emailSent
          ? "Your booking request has been sent. We will contact you shortly."
          : "Your booking was saved. We will contact you shortly.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
      )

    } catch (error: unknown) {
      console.error("Booking failed:", error)
      let message = "Something went wrong. Please try again."
      if (error && typeof error === "object" && "message" in error) {
        const raw = String((error as { message: string }).message)
        if (raw.includes("bookings")) {
          message = "Bookings are not set up in the database yet. Run supabase/bookings.sql in your Supabase SQL Editor."
        } else {
          message = raw
        }
      }
      Alert.alert("Booking failed", message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // Main screen with cream background
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Navy header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Hotel</Text>
        {/* Empty view keeps title centered */}
        <View style={{ width: 38 }} />
      </View>

      {/* Hotel summary — shows what hotel user is booking */}
      <View style={styles.hotelSummary}>
        <Text style={styles.hotelSummaryName}>{hotelName}</Text>
        <Text style={styles.hotelSummaryCity}>
          {hotelCity} · ${hotelPrice} per night
        </Text>
      </View>

      {/* Scrollable form */}
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

        {/* Dates section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Dates</Text>

          {/* Check in date button */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Check In Date</Text>
            {/* Tapping opens check in calendar */}
            <TouchableOpacity 
              style={styles.dateBtn}
              onPress={() => openDatePicker("checkIn")}
            >
              <Ionicons name="calendar-outline" size={20} color="#1E3A5F" />
              {/* Shows formatted date or placeholder if not selected */}
              <Text style={[styles.dateBtnText, !checkIn && styles.datePlaceholder]}>
                {checkIn ? formatDate(checkIn) : "Select check in date"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Check out date button — same as check in */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Check Out Date</Text>
            <TouchableOpacity 
              style={styles.dateBtn}
              onPress={() => openDatePicker("checkOut")}
            >
              <Ionicons name="calendar-outline" size={20} color="#1E3A5F" />
              <Text style={[styles.dateBtnText, !checkOut && styles.datePlaceholder]}>
                {checkOut ? formatDate(checkOut) : "Select check out date"}
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Android: native date dialog */}
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

        {/* Guests and contact section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Guests & Contact</Text>

          {/* Guest counter — minus, number, plus */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Guests</Text>
            <View style={styles.guestsRow}>
              {/* Minus button — minimum 1 guest */}
              <TouchableOpacity 
                style={styles.guestBtn}
                onPress={() => setGuests(prev => String(Math.max(1, parseInt(prev) - 1)))}
              >
                <Text style={styles.guestBtnText}>−</Text>
              </TouchableOpacity>
              {/* Current guest count */}
              <Text style={styles.guestCount}>{guests}</Text>
              {/* Plus button — maximum 10 guests */}
              <TouchableOpacity 
                style={styles.guestBtn}
                onPress={() => setGuests(prev => String(Math.min(10, parseInt(prev) + 1)))}
              >
                <Text style={styles.guestBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phone number input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#888"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad" // Shows number keyboard
            />
          </View>

        </View>

        {/* Price summary — updates when dates and guests are set */}
        <View style={styles.priceSummary}>
          <Text style={styles.priceSummaryTitle}>💰 Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Room rate</Text>
            <Text style={styles.priceValue}>${pricePerNight} / night</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Guests</Text>
            <Text style={styles.priceValue}>{guestCount} {guestCount === 1 ? "guest" : "guests"}</Text>
          </View>
          {checkIn && checkOut ? (
            nights > 0 ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Stay</Text>
                  <Text style={styles.priceValue}>
                    {formatDate(checkIn)} → {formatDate(checkOut)} ({nights} {nights === 1 ? "night" : "nights"})
                  </Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    ${pricePerNight} × {nights} nights
                  </Text>
                  <Text style={styles.priceValue}>${totalPrice}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>Total</Text>
                  <Text style={styles.priceTotalValue}>${totalPrice}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.priceHint}>
                Check-out must be after check-in to calculate your total.
              </Text>
            )
          ) : (
            <Text style={styles.priceHint}>Select check-in and check-out dates to see your total.</Text>
          )}
        </View>

        {/* Special requests — optional multiline input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Special Requests</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Any special requests? (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. High floor, extra pillows, early check in..."
              placeholderTextColor="#888"
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline // Allows multiple lines
              numberOfLines={4} // Shows 4 lines tall
            />
          </View>
        </View>

        {/* Confirm booking button — disabled and faded while loading */}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          <Text style={styles.confirmBtnText}>
            {/* Button text changes while loading */}
            {loading ? "Sending booking..." : "Confirm Booking 🕋"}
          </Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* iOS date picker — outside ScrollView so spinner text renders correctly */}
      {showPicker !== null && Platform.OS === "ios" && (
        <Modal transparent animationType="slide" visible>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={handleDateCancel}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>
                  {showPicker === "checkIn" ? "Check in" : "Check out"}
                </Text>
                <TouchableOpacity onPress={() => handleDateConfirm(pickerDate)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.pickerPreview}>
                {pickerDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
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
    </View>
  )
}

const styles = StyleSheet.create({
  // Full screen cream background
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  // Navy header
  header: { backgroundColor: "#1E3A5F", padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  // Circular back button
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  // Header title text
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  // Hotel name and price below header — still navy
  hotelSummary: { backgroundColor: "#1E3A5F", paddingHorizontal: 20, paddingBottom: 20 },
  // Hotel name in white
  hotelSummaryName: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  // City and price in gold
  hotelSummaryCity: { color: "#C9A84C", fontSize: 13, marginTop: 4 },
  // Scrollable form area
  form: { flex: 1 },
  // White card sections
  section: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E0D9CE" },
  // Section title
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#1E3A5F", marginBottom: 14 },
  // Space between input fields
  inputGroup: { marginBottom: 14 },
  // Label above each input
  label: { fontSize: 13, fontWeight: "600", color: "#1E3A5F", marginBottom: 8 },
  // Text input styling
  input: { backgroundColor: "#F5F0E8", borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 0.5, borderColor: "#E0D9CE", color: "#1E3A5F" },
  // Makes special requests input taller
  textArea: { height: 100, textAlignVertical: "top" },
  // Date picker button styling
  dateBtn: { backgroundColor: "#F5F0E8", borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: "#E0D9CE", flexDirection: "row", alignItems: "center", gap: 10 },
  // Date text inside button
  dateBtnText: { fontSize: 14, color: "#1E3A5F", flex: 1 },
  // Grey placeholder when no date selected
  datePlaceholder: { color: "#888" },
  // Row containing minus number plus
  guestsRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  // Circular minus and plus buttons
  guestBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" },
  // The − and + symbols
  guestBtnText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  // The number between minus and plus
  guestCount: { fontSize: 20, fontWeight: "bold", color: "#1E3A5F", minWidth: 30, textAlign: "center" },
  // Dark navy price summary box
  priceSummary: { backgroundColor: "#1E3A5F", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16 },
  // Gold price summary title
  priceSummaryTitle: { color: "#C9A84C", fontSize: 15, fontWeight: "bold", marginBottom: 12 },
  // Each price row — label on left, value on right
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  // Price breakdown label
  priceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  // Price breakdown value
  priceValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
  // Thin divider between breakdown and total
  priceDivider: { height: 0.5, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 8 },
  // Total label in white bold
  priceTotalLabel: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  // Total amount in gold
  priceTotalValue: { color: "#C9A84C", fontSize: 18, fontWeight: "bold" },
  priceHint: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4, lineHeight: 20 },
  // Gold confirm button
  confirmBtn: { backgroundColor: "#C9A84C", marginHorizontal: 16, marginTop: 16, borderRadius: 25, padding: 16, alignItems: "center" },
  // Faded when loading
  confirmBtnDisabled: { opacity: 0.6 },
  // Button text in navy
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