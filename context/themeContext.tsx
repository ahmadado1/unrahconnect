import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";


const lightTheme = {
    dark: false,
  background: "#F5F0E8",
  surface: "#ffffff",
  header: "#1E3A5F",
  headerSecondary: "#2C5F8A",
  text: "#1E3A5F",
  textSecondary: "#888888",
  textMuted: "#64748B",
  gold: "#C9A84C",
  border: "#E0D9CE",
  card: "#ffffff",
  inputBg: "#F5F0E8",
  overlay: "rgba(0,0,0,0.5)",
  success: "#2D6A4F",
  error: "#E24B4A",
}

const darkTheme = {
    dark: true,
  background: "#0F1923",
  surface: "#1A1A1A",
  header: "#111827",
  headerSecondary: "#1F2937",
  text: "#F9FAFB",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  gold: "#C9A84C",
  border: "#374151",
  card: "#1E2A3A",
  inputBg: "#1F2937",
  overlay: "rgba(0,0,0,0.7)",
  success: "#2D6A4F",
  error: "#E24B4A",
}

// The type for our theme object
export type Theme = typeof lightTheme


// The context type
type ThemeContextType = {
    theme: Theme
    isDark: boolean
    toggleTheme: () => void
  }
  
  // Create the context
  const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    isDark: false,
    toggleTheme: () => {},
  })


  // The provider that wraps the whole app
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false)
  
    // Load saved theme when app starts
    useEffect(() => {
      const loadTheme = async () => {
        const saved = await AsyncStorage.getItem("darkMode")
        if (saved === "true") setIsDark(true)
      }
      loadTheme()
    }, [])

    // Toggle between dark and light
  const toggleTheme = async () => {
    const newValue = !isDark
    setIsDark(newValue)
    // Save preference so it persists after app restart
    await AsyncStorage.setItem("darkMode", String(newValue))
  }

  return (
    <ThemeContext.Provider value={{
      theme: isDark ? darkTheme : lightTheme,
      isDark,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook — every screen uses this to get the theme
export const useTheme = () => useContext(ThemeContext)