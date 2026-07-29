/**
 * Article detail: hero image, headline, meta, and the body (HTML converted to
 * text paragraphs). A Save button bookmarks the article on-device, and Share
 * opens the OS share sheet with a link to the website version.
 */
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { ErrorView, Loading } from "@/components/StateView";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import { formatDate, htmlToParagraphs, mediaUrl } from "@/lib/utils";

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const {
    data: article,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.getArticle(slug),
    enabled: !!slug,
  });

  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (article) isBookmarked(article.id).then(setSaved);
  }, [article]);

  if (isPending) return <Loading />;
  if (isError || !article) return <ErrorView />;

  const img = mediaUrl(article.featured_image, env.backendOrigin);
  const paragraphs = htmlToParagraphs(article.content);

  const onSave = async () => setSaved(await toggleBookmark(article));
  const onShare = () =>
    Share.share({ message: `${article.title}\n\n${env.siteUrl}/articles/${article.slug}` });

  return (
    <>
      <Stack.Screen options={{ title: article.category?.name ?? "Article" }} />
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: "100%", height: 240, backgroundColor: "#e2e8f0" }}
            contentFit="cover"
            transition={200}
          />
        ) : null}

        <View className="p-4">
          <Text className="text-xs font-semibold uppercase text-accent">
            {article.category?.name}
          </Text>
          <Text className="mt-1 text-2xl font-extrabold leading-tight text-slate-900">
            {article.title}
          </Text>
          {!!article.subtitle && (
            <Text className="mt-1 text-base text-muted">{article.subtitle}</Text>
          )}

          <Text className="mt-3 text-xs text-muted">
            {article.author?.full_name || article.author?.username} ·{" "}
            {formatDate(article.published_at)} · {article.reading_time} min read
          </Text>

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={onSave}
              className={`rounded-lg px-4 py-2 ${saved ? "bg-accent" : "bg-brand"} active:opacity-80`}
            >
              <Text className="text-sm font-semibold text-white">
                {saved ? "✓ Saved" : "🔖 Save"}
              </Text>
            </Pressable>
            <Pressable
              onPress={onShare}
              className="rounded-lg border border-border px-4 py-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-slate-700">Share</Text>
            </Pressable>
          </View>

          {!!article.image_caption && (
            <Text className="mt-3 text-xs italic text-muted">{article.image_caption}</Text>
          )}

          <View className="mt-4">
            {paragraphs.map((p, i) => (
              <Text key={i} className="mb-3 text-[15px] leading-6 text-slate-800">
                {p}
              </Text>
            ))}
          </View>

          {!!article.source && (
            <Text className="mt-2 text-xs text-muted">Source: {article.source}</Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}
