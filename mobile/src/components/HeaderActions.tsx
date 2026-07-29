/** Right side of the Home header: today's date + a quick search shortcut. */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export function HeaderActions() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <View className="mr-4 flex-row items-center gap-3">
      <Text className="text-xs font-medium text-white/80">{today}</Text>
      <Pressable
        onPress={() => router.navigate("/search")}
        hitSlop={8}
        className="active:opacity-60"
      >
        <Ionicons name="search" size={22} color="#ffffff" />
      </Pressable>
    </View>
  );
}
