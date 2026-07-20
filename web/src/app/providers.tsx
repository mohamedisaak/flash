"use client";

/**
 * Client-side providers. `"use client"` marks this as a Client Component (it runs
 * in the browser), which is required for TanStack Query's React context.
 *
 * TanStack Query manages *server state on the client* — fetching, caching, and
 * refetching data for interactive features like search. Server Components handle
 * the initial page render; TanStack Query handles what happens after hydration.
 * See teaching/17-react-query/01-what-is-react-query.md.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session. useState keeps it stable across re-renders.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
