import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import DrawerMenu from "../component/DrawerMenu";

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ayah, setAyah] = useState("Loading verse...");
  const [ayahRef, setAyahRef] = useState("");
  const [userName, setUserName] = useState("")

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

  return (
    // Main screen — background changes with theme
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {/* Dynamic island area — always navy */}
      <SafeAreaView edges={["top"]} style={styles.safeTop} />

      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>

        {/* Navy header — always navy regardless of theme */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Logo and greeting */}
            <View style={styles.headerLeft}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌙</Text>
              </View>
              <View>
                <Text style={styles.greeting}>Assalamu Alaikum 👋</Text>
                <Text style={styles.appName}>UmrahConnect</Text>
              </View>
            </View>
            {/* Search and hamburger */}
            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="search" size={24} color="#fff" />
              </TouchableOpacity>
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
          <Text style={styles.heroWelcome}>Welcome back, {userName || "Pilgrim"} 🌙</Text>
          <Text style={styles.heroText}>Your complete Umrah companion</Text>
          <Text style={styles.heroSub}>Hotels · Restaurants · Guide</Text>
        </View>

        {/* Explore section title — changes with theme */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Explore</Text>

        {/* Umrah Guide wide card */}
        <TouchableOpacity
          style={[styles.cardWide, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/umrah")}
        >
          <Text style={styles.cardIcon}>📖</Text>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Umrah Guide</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Step by step for beginners</Text>
          </View>
        </TouchableOpacity>

        {/* Hotels and Restaurants cards */}
        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/hotels")}
          >
            <Text style={styles.cardIcon}>🏨</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Hotels</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Find your stay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/restaurants")}
          >
            <Text style={styles.cardIcon}>🍽️</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Restaurants</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Near the Haram</Text>
          </TouchableOpacity>
        </View>

        {/* Verse of the day — always navy */}
        <View style={styles.tipBox}>
          <Text style={styles.tipLabel}>✨ Verse of the day</Text>
          <Text style={styles.tipText}>{ayah}</Text>
          <Text style={styles.tipRef}>{ayahRef}</Text>
        </View>

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