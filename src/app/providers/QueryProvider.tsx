import { hashKey, QueryClient, QueryClientProvider, type QueryKey } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { readStoredAuthUserId } from "../../features/auth/api/supabaseAuth";

// Every cached query is partitioned by the authenticated user that requested
// it, so one student's records can never be served to another account that
// signs in on the same browser. Key prefixes used for invalidation are
// unaffected because partial matching works on the key, not the hash.
let cacheScope: string = readStoredAuthUserId() ?? "anonymous";

export function setQueryCacheScope(userId: string | null): void {
  cacheScope = userId ?? "anonymous";
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      queryKeyHashFn: (queryKey: QueryKey) => `${cacheScope}::${hashKey(queryKey)}`,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Cancels in-flight requests and drops every cached query and mutation. */
export async function resetQueryCache(): Promise<void> {
  await queryClient.cancelQueries();
  queryClient.clear();
}

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
