"use client";

/** Fetches categories and returns them as {value,label} options for selects. */
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth-api";

export function useCategoryOptions(opts: { topOnly?: boolean } = {}) {
  const { data: categories = [] } = useQuery({
    queryKey: ["dash-categories"],
    queryFn: () => authApi.listCategories(),
  });
  const filtered = opts.topOnly ? categories.filter((c) => c.parent === null) : categories;
  return filtered.map((c) => ({
    value: c.id,
    label: c.parent === null ? c.name : `${c.name} (sub)`,
  }));
}
