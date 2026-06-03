import { useTheme } from "@/context/themeContext";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import DrawerMenu from "../component/DrawerMenu";

// This component displays one booking as a card
// It receives a single booking object as a prop
function BookingCard({ booking, theme }: { booking: any, theme: any }) {
  
  // Today's date for status comparison
  const today = new Date().toISOString().split("T")[0]

  // Format date helper
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  // Get status label and color
  const getStatus = () => {
    if (booking.check_in > today) return { label: "Upcoming", color: "#2D6A4F" }
    if (booking.check_out >= today) return { label: "Active", color: "#C9A84C" }
    return { label: "Past", color: "#888" }
  }

  const status = getStatus()

  return (
    // Card container — uses theme colors for dark/light mode
    <View style={[bookingStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      
      {/* Top row — hotel name + status badge */}
      <View style={bookingStyles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[bookingStyles.hotelName, { color: theme.text }]}>{booking.hotel_name}</Text>
          <Text style={[bookingStyles.city, { color: theme.textSecondary }]}>{booking.hotel_city}</Text>
        </View>
        {/* Colored badge showing Upcoming / Active / Past */}
        <View style={[bookingStyles.statusBadge, { backgroundColor: status.color + "22" }]}>
          <Text style={[bookingStyles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Thin divider line */}
      <View style={[bookingStyles.divider, { backgroundColor: theme.border }]} />

      {/* 3 columns — check in, check out, total price */}
      <View style={bookingStyles.details}>
        <View style={bookingStyles.detailItem}>
          <Text style={[bookingStyles.detailLabel, { color: theme.textSecondary }]}>Check in</Text>
          <Text style={[bookingStyles.detailValue, { color: theme.text }]}>{formatDate(booking.check_in)}</Text>
        </View>
        <View style={bookingStyles.detailItem}>
          <Text style={[bookingStyles.detailLabel, { color: theme.textSecondary }]}>Check out</Text>
          <Text style={[bookingStyles.detailValue, { color: theme.text }]}>{formatDate(booking.check_out)}</Text>
        </View>
        <View style={bookingStyles.detailItem}>
          <Text style={[bookingStyles.detailLabel, { color: theme.textSecondary }]}>Total</Text>
          <Text style={[bookingStyles.detailValue, { color: "#C9A84C" }]}>${booking.total_price}</Text>
        </View>
      </View>

      {/* Bottom — nights and guests summary */}
      <Text style={[bookingStyles.nights, { color: theme.textSecondary }]}>
        {booking.nights} {booking.nights === 1 ? "night" : "nights"} · {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
      </Text>

    </View>
  )
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ayah, setAyah] = useState("Loading verse...");
  const [ayahRef, setAyahRef] = useState("");
  const [userName, setUserName] = useState("")
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  // Fetches logged in user's first name
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserName(user.user_metadata?.full_name?.split(" ")[0] || "")
    }
    getUser()
  }, [])

  // Fetches random Quran verse
  useEffect(() => {
    const randomVerse = Math.floor(Math.random() * 6236) + 1
    fetch(`https://api.alquran.cloud/v1/ayah/${randomVerse}/en.asad`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 200) {
          setAyah(`"${data.data.text}"`)
          setAyahRef(`Quran — ${data.data.surah.englishName} ${data.data.numberInSurah}`)
        }
      })
      .catch(() => {
        setAyah("In the name of Allah, the Most Gracious, the Most Merciful.")
        setAyahRef("Quran — 1:1")
      })
  }, [])

  // State to store the bookings we fetch from Supabase
    const [bookings, setBookings] = useState<any[]>([])

    useEffect(() => {
      // This function runs once when the home screen loads
      const fetchBookings = async () => {
        // Get the currently logged in user
        const { data: { user } } = await supabase.auth.getUser()
        
        // If no user is logged in, stop here
        if (!user) return

        // Query the bookings table — only get rows where user_id matches
        // Order by check_in date so upcoming ones appear first
        const { data } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("check_in", { ascending: true })

        // If we got data back, save it to state so the screen can display it
        if (data) setBookings(data)
      }

      fetchBookings()
    }, []) // Empty array means "only run this once on mount"

          // Today's date as a string like "2026-05-31"
      // We use this to compare against check_in dates
      const today = new Date().toISOString().split("T")[0]

      // Upcoming = check_in date is today or in the future
      const upcoming = bookings.filter(b => b.check_in >= today)

      // Past = check_in date was before today
      const past = bookings.filter(b => b.check_in < today)

      // Converts "2026-06-15" → "Jun 15, 2026"
      const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

        // Returns a label and color based on when the booking is
      const getStatus = (b: any) => {
        if (b.check_in > today) return { label: "Upcoming", color: "#2D6A4F" } // green
        if (b.check_out >= today) return { label: "Active", color: "#C9A84C" } // gold
        return { label: "Past", color: "#888" } // grey
        
        
}
    
      
  return (
    // Main screen — background changes with theme
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {/* Dynamic island area — always navy */}
      

      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>

        {/* Navy header — always navy regardless of theme */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            {/* Logo and greeting */}
            <View style={styles.headerLeft}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌙</Text>
              </View>
              <View>
                <Text style={styles.greeting}>{t("greeting")}</Text>
                <Text style={styles.appName}>UmrahConnect</Text>
              </View>
            </View>
            {/* Search and hamburger */}
            <View style={styles.iconRow}>
              
              <TouchableOpacity style={styles.iconBtn} onPress={() => setDrawerOpen(true)}>
                <View style={styles.hamburger}>
                  <View style={styles.bar} />
                  <View style={styles.bar} />
                  <View style={styles.bar} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Hero banner — always blue */}
        <View style={styles.heroBanner}>
        <Text style={styles.heroWelcome}>{t("welcomeBack")}, {userName || t("pilgrim")} 🌙</Text>
        <Text style={styles.heroText}>{t("completeCompanion")}</Text>
        <Text style={styles.heroSub}>{t("hotelsTitle")} · {t("restaurantsTitle")} · {t("guide")}</Text>
        </View>

        {/* Explore section title — changes with theme */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("exploreTitle")}</Text>

        {/* Umrah Guide wide card */}
        <TouchableOpacity
          style={[styles.cardWide, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/umrah")}
        >
          <Text style={styles.cardIcon}>📖</Text>
          <View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t("umrahGuide")}</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{t("umrahGuideSub")}</Text>
          </View>
        </TouchableOpacity>

        {/* Hotels and Restaurants cards */}
        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/hotels")}
          >
            <Text style={styles.cardIcon}>🏨</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t("hotelsTitle")}</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{t("hotelsSub")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/restaurants")}
          >
            <Text style={styles.cardIcon}>🍽️</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t("restaurantsTitle")}</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{t("restaurantsSub")}</Text>
          </TouchableOpacity>
        </View>

        {/* Verse of the day — always navy */}
        <View style={styles.tipBox}>
          <Text style={styles.tipLabel}>{t("verseOfDay")}</Text>
          <Text style={styles.tipText}>{ayah}</Text>
          <Text style={styles.tipRef}>{ayahRef}</Text>
        </View>

          {/* Only show if user has bookings */}
        {bookings.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 80 }}>
            
            <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 0, marginTop: 8 }]}>
              🗓️ My Bookings
            </Text>

            {/* Upcoming bookings group */}
            {upcoming.length > 0 && (
              <>
                <Text style={[bookingStyles.groupLabel, { color: theme.textSecondary }]}>UPCOMING</Text>
                {upcoming.map(b => (
                  <BookingCard key={b.id} booking={b} theme={theme} />
                ))}
              </>
            )}

            {/* Past bookings group */}
            {past.length > 0 && (
              <>
                <Text style={[bookingStyles.groupLabel, { color: theme.textSecondary }]}>PAST</Text>
                {past.map(b => (
                  <BookingCard key={b.id} booking={b} theme={theme} />
                ))}
              </>
            )}

          </View>
        )}
      </ScrollView>

      {/* Drawer */}
      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeTop: { backgroundColor: "#1E3A5F" },
  container: { flex: 1 },
  // Header always navy
  header: { backgroundColor: "#1E3A5F", paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(201,168,76,0.2)", borderWidth: 1.5, borderColor: "#C9A84C", alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 26 },
  greeting: { color: "#C9A84C", fontSize: 13 },
  appName: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  iconRow: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  hamburger: { gap: 5, alignItems: "center", justifyContent: "center" },
  bar: { width: 22, height: 2, backgroundColor: "#fff", borderRadius: 2 },
  // Hero banner always blue
  heroBanner: { backgroundColor: "#2C5F8A", margin: 16, borderRadius: 16, padding: 24, alignItems: "center" },
  heroWelcome: { color: "#C9A84C", fontSize: 13, marginBottom: 6 },
  heroText: { color: "#fff", fontSize: 20, fontWeight: "bold", textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginHorizontal: 16, marginBottom: 10 },
  cardsRow: { flexDirection: "row", marginHorizontal: 16, gap: 12, marginBottom: 12 },
  card: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1 },
  cardWide: { borderRadius: 16, padding: 16, marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 16, borderWidth: 1, marginBottom: 12 },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: "bold" },
  cardSub: { fontSize: 12, textAlign: "center", marginTop: 4 },
  // Verse box always navy
  tipBox: { backgroundColor: "#1E3A5F", margin: 16, borderRadius: 16, padding: 20, marginBottom: 80 },
  tipLabel: { color: "#C9A84C", fontSize: 12, fontWeight: "bold", margin: 8 },
  tipText: { color: "#fff", fontSize: 14, lineHeight: 22, fontStyle: "italic" },
  tipRef: { color: "#C9A84C", fontSize: 11, marginTop: 8, textAlign: "right" },
})

// Styles specifically for the booking cards
const bookingStyles = StyleSheet.create({
  
  // The card container itself
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5 },
  
  // Top row with hotel name and status badge
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  
  // Hotel name text
  hotelName: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  
  // City text below hotel name
  city: { fontSize: 13 },
  
  // The colored pill badge (Upcoming / Active / Past)
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "600" },
  
  // Thin horizontal line
  divider: { height: 0.5, marginBottom: 12 },
  
  // Row of 3 detail columns
  details: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  detailItem: { alignItems: "center" },
  detailLabel: { fontSize: 11, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  
  // Nights and guests summary at bottom
  nights: { fontSize: 12, textAlign: "center", marginTop: 4 },
  
  // "UPCOMING" / "PAST" group label
  groupLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
})