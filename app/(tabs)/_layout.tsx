import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

export default function TabsLayout() {
  if (Platform.OS === "ios") {
    return (
      <NativeTabs
        iconColor={{ default: "#94A3B8", selected: "#0EA5E9" }}
        labelStyle={{ color: "#0F172A" }}
        tintColor="#0EA5E9"
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf={{ default: "house", selected: "house.fill" }} drawable="ic_menu_view" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="umrah">
          <Label>Guide</Label>
          <Icon sf={{ default: "book", selected: "book.fill" }} drawable="ic_menu_today" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="hotels">
          <Label>Hotels</Label>
          <Icon sf={{ default: "bed.double", selected: "bed.double.fill" }} drawable="ic_menu_myplaces" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="restaurants">
          <Label>Restaurants</Label>
          <Icon sf={{ default: "fork.knife", selected: "fork.knife.circle.fill" }} drawable="ic_menu_compass" />
        </NativeTabs.Trigger>
      </NativeTabs>
    )
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0.5,
          borderTopColor: "#E0D9CE",
          height: 90,
          paddingBottom: 22,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#1E3A5F",
        tabBarInactiveTintColor: "#C9A84C",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} /> }} />
      <Tabs.Screen name="umrah" options={{ title: "Guide", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "book" : "book-outline"} size={26} color={color} /> }} />
      <Tabs.Screen name="hotels" options={{ title: "Hotels", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "bed" : "bed-outline"} size={26} color={color} /> }} />
      <Tabs.Screen name="restaurants" options={{ title: "Restaurants", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={26} color={color} /> }} />
      <Tabs.Screen name="favorite" options={{ href: null }} />
    </Tabs>
  )
}