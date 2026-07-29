/** Search screen — queries the same full-text search API the website uses. */
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, TextInput, View } from "react-native";
import { ArticleCard } from "@/components/ArticleCard";
import { EmptyView, ErrorView, Loading } from "@/components/StateView";
import { api } from "@/lib/api";

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.length > 1,
  });

  const results = data?.results ?? [];

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-brand px-3 pb-3">
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => setQuery(text.trim())}
          returnKeyType="search"
          placeholder="Search news…"
          placeholderTextColor="#94a3b8"
          className="rounded-lg bg-white px-4 py-3 text-base text-slate-900"
        />
      </View>

      {query.length <= 1 ? (
        <EmptyView message="Type a word and hit search to find articles." />
      ) : isPending || isFetching ? (
        <Loading />
      ) : isError ? (
        <ErrorView />
      ) : results.length === 0 ? (
        <EmptyView message={`No results for “${query}”.`} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => <ArticleCard article={item} />}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      )}
    </View>
  );
}
