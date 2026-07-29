/** A horizontal article row used in feeds and lists. Taps through to the article. */
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { env } from "@/lib/env";
import type { ArticleListItem } from "@/lib/types";
import { formatDate, mediaUrl } from "@/lib/utils";

export function ArticleCard({ article }: { article: ArticleListItem }) {
  const img = mediaUrl(article.featured_image, env.backendOrigin);
  return (
    <Link href={{ pathname: "/article/[slug]", params: { slug: article.slug } }} asChild>
      <Pressable className="mx-3 mb-3 flex-row gap-3 rounded-xl bg-white p-3 shadow-sm active:opacity-70">
        <Image
          source={img ? { uri: img } : undefined}
          style={{ width: 104, height: 78, borderRadius: 8, backgroundColor: "#e2e8f0" }}
          contentFit="cover"
          transition={150}
        />
        <View className="flex-1">
          <Text className="text-[11px] font-semibold uppercase text-accent">
            {article.category?.name}
          </Text>
          <Text numberOfLines={3} className="mt-0.5 font-bold leading-snug text-slate-900">
            {article.title}
          </Text>
          <Text className="mt-1 text-xs text-muted">
            {formatDate(article.published_at)} · {article.reading_time} min read
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
