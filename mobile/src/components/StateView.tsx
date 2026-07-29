/** Small reusable loading / error / empty placeholders. */
import { ActivityIndicator, Text, View } from "react-native";

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 py-16">
      <ActivityIndicator size="large" color="#4f63d2" />
    </View>
  );
}

export function ErrorView({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-8">
      <Text className="text-center text-base font-semibold text-slate-700">
        Couldn’t load content
      </Text>
      <Text className="mt-1 text-center text-sm text-muted">
        {message ?? "Check your connection and pull to refresh."}
      </Text>
    </View>
  );
}

export function EmptyView({ message }: { message: string }) {
  return (
    <View className="items-center justify-center p-10">
      <Text className="text-center text-sm text-muted">{message}</Text>
    </View>
  );
}
