import { Stack } from "expo-router";

export default function UmrahStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#16A34A" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "600" },
        headerLargeTitle: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Umrah Guide" }} />
      <Stack.Screen name="details" options={{ title: "Umrah Details" }} />
      <Stack.Screen name="hotels" options={{ title: "Hotels" }} />
    </Stack>
  );
}
