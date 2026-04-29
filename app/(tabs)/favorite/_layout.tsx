import { Stack } from "expo-router";

export default function FavoriteStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#DC2626" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "600" },
        headerLargeTitle: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Favorite" }} />
    </Stack>
  );
}
