import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();

  const [ayah, setAyah] = useState("Loading verse...");
  const [ayahRef, setAyahRef] = useState("");

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
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.safeTop} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌙</Text>
              </View>
              <View>
                <Text style={styles.greeting}>Assalamu Alaikum 👋</Text>
                <Text style={styles.appName}>UmrahConnect</Text>
              </View>
            </View>
            <View style={styles.iconRow}>
            <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="search" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <View style={styles.hamburger}>
                  <View style={styles.bar} />
                  <View style={styles.bar} />
                  <View style={styles.bar} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.heroBanner}>
          <Text style={styles.heroText}>Your complete Umrah companion</Text>
          <Text style={styles.heroSub}>Hotels - Restaurants - Guide</Text>
        </View>

        <Text style={styles.sectionTitle}>Explore</Text>


        <TouchableOpacity style={styles.cardWide} onPress={() => router.push("/umrah")}>
          <Text style={styles.cardIcon}>📖</Text>
          <View>
            <Text style={styles.cardTitle}>Umrah Guide</Text>
            <Text style={styles.cardSub}>
              Step by step for beginners 
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.cardsRow}>
          <TouchableOpacity style={styles.card} onPress={() => router.push("/hotels")}>
            <Text style={styles.cardIcon}>🏨</Text>
            <Text style={styles.cardTitle}>Hotels</Text>
            <Text style={styles.cardSub}>Find your stay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/restaurants")}
          >
            <Text style={styles.cardIcon}>🍽️</Text>
            <Text style={styles.cardTitle}>Restaurants</Text>
            <Text style={styles.cardSub}>Near the Haram</Text>
          </TouchableOpacity>
        </View>


        <View style={styles.tipBox}>
          <Text style={styles.tipLabel}>✨ Verse of the day</Text>
          <Text style={styles.tipText}>{ayah}</Text>
          <Text style={styles.tipRef}>{ayahRef}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  safeTop: { backgroundColor: "#1E3A5F" },
  container: { flex: 1, backgroundColor: "#F5F0E8" },
  header: { backgroundColor: "#1E3A5F", paddingBottom: 20 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(201,168,76,0.2)",
    borderWidth: 1.5,
    borderColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 26 },
  greeting: { color: "#C9A84C", fontSize: 13 },
  appName: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  iconRow: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 20 },
  notifDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#C9A84C",
    position: "absolute",
    top: 6,
    right: 6,
  },
  hamburger: { gap: 5, alignItems: "center", justifyContent: "center" },
  bar: { width: 22, height: 2, backgroundColor: "#fff", borderRadius: 2 },
  heroText: { color: "#fff", fontSize: 20, fontWeight: "bold", textAlign: "center" },
  heroSub: { color: "#C9A84C", fontSize: 14, marginTop: 6 },
  sectionTitle: {
    color: "#1E3A5F",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  tipRef: { color: "#C9A84C", fontSize: 11, marginTop: 8, textAlign: "right" },

  heroBanner: {
    backgroundColor: '#2C5F8A',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  
  cardsRow: { flexDirection: "row", marginHorizontal: 16, gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D9CE",
  },
  cardWide: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#E0D9CE",
    marginBottom: 12,
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardTitle: { color: "#1E3A5F", fontSize: 15, fontWeight: "bold" },
  cardSub: { color: "#888", fontSize: 12, textAlign: "center", marginTop: 4 },
  tipBox: {
    backgroundColor: "#1E3A5F",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  tipLabel: { color: "#C9A84C", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  tipText: { color: "#fff", fontSize: 14, lineHeight: 22, fontStyle: "italic" },
});
