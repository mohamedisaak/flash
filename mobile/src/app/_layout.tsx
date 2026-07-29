/**
 * Root layout: global providers + the app's navigation stack.
 *
 * - `../global.css` boots NativeWind (Tailwind classes on native).
 * - TanStack Query caches API data (same pattern as the website).
 * - A Stack hosts the tab navigator plus the article & category detail screens.
 *
 * See teaching/22-mobile-architecture/ and teaching/20-expo/ (Expo Router).
 */
import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initAds } from "@/lib/ads";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export default function RootLayout() {
  // Initialise the AdMob SDK once at startup (no-op in Expo Go / on web).
  useEffect(() => {
    void initAds();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#4f63d2" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: "#f1f5f9" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="article/[slug]" options={{ title: "Article" }} />
          <Stack.Screen name="category/[slug]" options={{ title: "Category" }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
