/** Saved articles — read from on-device storage, so it works offline. */
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList } from "react-native";
import { ArticleCard } from "@/components/ArticleCard";
import { EmptyView, Loading } from "@/components/StateView";
import { getBookmarks } from "@/lib/bookmarks";
import type { ArticleListItem } from "@/lib/types";

export default function SavedScreen() {
  const [items, setItems] = useState<ArticleListItem[] | null>(null);

  // Reload every time the tab gains focus (a bookmark may have just changed).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getBookmarks().then((b) => active && setItems(b));
      return () => {
        active = false;
      };
    }, []),
  );

  if (!items) return <Loading />;
  if (items.length === 0)
    return (
      <EmptyView message="No saved articles yet. Open an article and tap Save to keep it here for offline reading." />
    );

  return (
    <FlatList
      data={items}
      keyExtractor={(a) => String(a.id)}
      renderItem={({ item }) => <ArticleCard article={item} />}
      contentContainerStyle={{ paddingVertical: 12 }}
    />
  );
}
