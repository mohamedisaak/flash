/** The Flash wordmark: a lightning bolt + "Flash News", for the header. */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function Logo() {
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name="flash" size={22} color="#ffffff" />
      <Text className="text-lg font-extrabold text-white">Flash News</Text>
    </View>
  );
}
