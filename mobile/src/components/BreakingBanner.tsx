/** A red "breaking" strip linking to the most recent breaking article. */
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { ArticleListItem } from "@/lib/types";

export function BreakingBanner({ article }: { article: ArticleListItem }) {
  return (
    <Link href={{ pathname: "/article/[slug]", params: { slug: article.slug } }} asChild>
      <Pressable className="mx-3 mb-4 flex-row items-center gap-2 rounded-lg bg-red-600 p-3 active:opacity-80">
        <View className="rounded bg-white px-2 py-0.5">
          <Text className="text-[11px] font-extrabold uppercase text-red-600">Breaking</Text>
        </View>
        <Text numberOfLines={2} className="flex-1 text-sm font-semibold text-white">
          {article.title}
        </Text>
      </Pressable>
    </Link>
  );
}
