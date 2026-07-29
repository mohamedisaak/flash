/** A horizontal, scrollable strip of category shortcuts for the top of the feed. */
import { Link } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import type { Category } from "@/lib/types";

export function CategoryChips({ categories }: { categories: Category[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
      className="mb-4"
    >
      {categories.map((c) => (
        <Link key={c.id} href={{ pathname: "/category/[slug]", params: { slug: c.slug } }} asChild>
          <Pressable className="rounded-full border border-border bg-white px-4 py-2 shadow-sm active:opacity-70">
            <Text className="text-sm font-semibold text-slate-700">{c.name}</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}
