/** Category directory — tap a section to see its latest articles. */
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { ErrorView, Loading } from "@/components/StateView";
import { api } from "@/lib/api";

export default function CategoriesScreen() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: api.listCategories,
  });

  if (isPending) return <Loading />;
  if (isError) return <ErrorView />;

  const categories = data.filter((c) => c.is_active);

  return (
    <FlatList
      data={categories}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <Link href={{ pathname: "/category/[slug]", params: { slug: item.slug } }} asChild>
          <Pressable className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-4 shadow-sm active:opacity-70">
            <View>
              <Text className="text-base font-bold text-slate-900">{item.name}</Text>
              <Text className="mt-0.5 text-xs text-muted">{item.article_count} articles</Text>
            </View>
            <Text className="text-brand">›</Text>
          </Pressable>
        </Link>
      )}
    />
  );
}
