/** Home feed: breaking banner + featured hero + latest articles (pull to refresh). */
import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { AdBanner } from "@/components/AdBanner";
import { ArticleCard } from "@/components/ArticleCard";
import { BreakingBanner } from "@/components/BreakingBanner";
import { CategoryChips } from "@/components/CategoryChips";
import { HeroCard } from "@/components/HeroCard";
import { ErrorView, Loading } from "@/components/StateView";
import { api } from "@/lib/api";

export default function HomeScreen() {
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ["articles", "latest"],
    queryFn: () => api.listArticles(),
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.listCategories });
  const topCategories = (categories ?? []).filter((c) => c.is_active && c.parent === null);

  if (isPending) return <Loading />;
  if (isError) return <ErrorView />;

  const items = data.results;
  const breaking = items.find((a) => a.is_breaking);
  const featured = items.find((a) => a.is_featured) ?? items[0];
  const rest = items.filter((a) => a.id !== featured?.id);

  return (
    <FlatList
      data={rest}
      keyExtractor={(a) => String(a.id)}
      renderItem={({ item }) => <ArticleCard article={item} />}
      contentContainerStyle={{ paddingVertical: 12 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#4f63d2" />
      }
      ListHeaderComponent={
        <View className="pt-3">
          {breaking ? <BreakingBanner article={breaking} /> : null}
          {topCategories.length > 0 ? <CategoryChips categories={topCategories} /> : null}
          {featured ? <HeroCard article={featured} /> : null}
          <AdBanner />
          <Text className="mx-3 mb-2 text-lg font-extrabold text-slate-900">Latest News</Text>
        </View>
      }
    />
  );
}
