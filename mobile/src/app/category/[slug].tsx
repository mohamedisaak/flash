/** Category screen: the latest articles in one section. */
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { FlatList } from "react-native";
import { ArticleCard } from "@/components/ArticleCard";
import { EmptyView, ErrorView, Loading } from "@/components/StateView";
import { api } from "@/lib/api";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isPending, isError } = useQuery({
    queryKey: ["category-articles", slug],
    queryFn: () => api.articlesInCategory(slug),
    enabled: !!slug,
  });

  if (isPending) return <Loading />;
  if (isError) return <ErrorView />;

  const items = data.results;
  const title = items[0]?.category?.name ?? "Category";

  return (
    <>
      <Stack.Screen options={{ title }} />
      {items.length === 0 ? (
        <EmptyView message="No articles in this category yet." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => <ArticleCard article={item} />}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      )}
    </>
  );
}
