/** Bottom tab navigator: Home, Categories, Search, Saved. */
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { HeaderActions } from "@/components/HeaderActions";
import { Logo } from "@/components/Logo";

const tabIcon =
  (emoji: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4f63d2",
        tabBarInactiveTintColor: "#94a3b8",
        headerStyle: { backgroundColor: "#4f63d2" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <Logo />,
          headerRight: () => <HeaderActions />,
          tabBarLabel: "Home",
          tabBarIcon: tabIcon("🏠"),
        }}
      />
      <Tabs.Screen name="categories" options={{ title: "Categories", tabBarIcon: tabIcon("🗂") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: tabIcon("🔍") }} />
      <Tabs.Screen name="saved" options={{ title: "Saved", tabBarIcon: tabIcon("🔖") }} />
    </Tabs>
  );
}
