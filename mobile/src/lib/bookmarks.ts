/**
 * Bookmarks (a.k.a. "Saved") — stored on-device with AsyncStorage so they
 * survive restarts and are readable offline. We keep the lightweight
 * `ArticleListItem` (title, image, excerpt) so the Saved tab renders without a
 * network call. See teaching/22-mobile-architecture/ (local storage).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ArticleListItem } from "./types";

const KEY = "flash:bookmarks";

export async function getBookmarks(): Promise<ArticleListItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as ArticleListItem[]) : [];
}

export async function isBookmarked(id: number): Promise<boolean> {
  return (await getBookmarks()).some((a) => a.id === id);
}

/** Add/remove the article. Returns the new bookmarked state (true = saved). */
export async function toggleBookmark(article: ArticleListItem): Promise<boolean> {
  const list = await getBookmarks();
  const exists = list.some((a) => a.id === article.id);
  const next = exists ? list.filter((a) => a.id !== article.id) : [article, ...list];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return !exists;
}
