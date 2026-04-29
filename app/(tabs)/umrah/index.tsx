import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function UmrahScreen() {
  return (
    <View
      style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}
    >
      <Text style={{ color: "green" }}>I am Umrah</Text>
      <Button title="Go to Umrah details" onPress={() => router.push("/umrah/details")} />
      <Button title="Go to Hotels" onPress={() => router.push("/umrah/hotels")} />
    </View>
  );
}
