import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");



const slides = [
  {
    id: "1",
    emoji: "🌙",
    title: "Welcome to UmrahConnect",
    subtitle: "Your complete Umrah companion",
    bg: "#1E3A5F",
  },
  {
    id: "2",
    emoji: "🕋",
    title: "Hotels, Restaurants & Guide",
    subtitle: "Everything you need for your blessed journey in one place",
    bg: "#162D47",
  },
  {
    id: "3",
    emoji: "✨",
    title: "Your journey starts here",
    subtitle: "Find hotels, discover restaurants and learn Umrah step by step",
    bg: "#0F1F30",
  },
]


  export default function OnboardingScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [currentIndex, setCurrentIndex] = useState(0)
    const flatListRef = useRef<FlatList>(null)

    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
          flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
          setCurrentIndex(currentIndex + 1)
        } else {
          await AsyncStorage.setItem("onboardingSeen", "true")
          router.replace("/auth/login")
        }
      }
    
      const handleScroll = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width)
        setCurrentIndex(index)
      }

      return (
        <View style={styles.screen}>
          <FlatList
            ref={flatListRef}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.slide, { backgroundColor: item.bg, width }]}>
                <View style={[styles.slideContent, { paddingTop: insets.top + 40 }]}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                </View>
              </View>
            )}
          />

          {/* Dots */}
            <View style={styles.dotsRow}>
                {slides.map((_, index) => (
                <View
                    key={index}
                    style={[
                    styles.dot,
                    currentIndex === index && styles.dotActive
                    ]}
                />
                ))}
            </View>

            {/* Button */}
            <TouchableOpacity
                style={[styles.btn, { marginBottom: insets.bottom + 20 }]}
                onPress={handleNext}
            >
                <Text style={styles.btnText}>
                {currentIndex === slides.length - 1 ? "Get Started" : "Next →"}
                </Text>
            </TouchableOpacity>

        </View>
  )
}


const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#1E3A5F" },
  
    slide: { flex: 1, alignItems: "center", justifyContent: "center" },
    slideContent: { alignItems: "center", paddingHorizontal: 40 },
    emoji: { fontSize: 80, marginBottom: 32 },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 16 },
    subtitle: { fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 24 },
  
    dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" },
    dotActive: { width: 24, backgroundColor: "#C9A84C" },
  
    btn: {
      backgroundColor: "#C9A84C",
      marginHorizontal: 24,
      borderRadius: 25,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 40,
    },
    btnText: { color: "#1E3A5F", fontSize: 16, fontWeight: "bold" },
  })