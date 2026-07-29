/** A large lead/featured article card for the top of the home feed. */
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { env } from "@/lib/env";
import type { ArticleListItem } from "@/lib/types";
import { formatDate, mediaUrl } from "@/lib/utils";

export function HeroCard({ article }: { article: ArticleListItem }) {
  const img = mediaUrl(article.featured_image, env.backendOrigin);
  return (
    <Link href={{ pathname: "/article/[slug]", params: { slug: article.slug } }} asChild>
      <Pressable className="mx-3 mb-4 overflow-hidden rounded-xl bg-white shadow-sm active:opacity-80">
        <Image
          source={img ? { uri: img } : undefined}
          style={{ width: "100%", height: 200, backgroundColor: "#e2e8f0" }}
          contentFit="cover"
          transition={200}
        />
        <View className="p-4">
          <Text className="text-xs font-semibold uppercase text-accent">
            {article.category?.name}
          </Text>
          <Text
            numberOfLines={3}
            className="mt-1 text-lg font-extrabold leading-tight text-slate-900"
          >
            {article.title}
          </Text>
          {!!article.excerpt && (
            <Text numberOfLines={2} className="mt-1 text-sm text-muted">
              {article.excerpt}
            </Text>
          )}
          <Text className="mt-2 text-xs text-muted">{formatDate(article.published_at)}</Text>
        </View>
      </Pressable>
    </Link>
  );
}
