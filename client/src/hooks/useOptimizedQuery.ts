import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useMemo } from "react";

// Optimized query hook with intelligent caching and stale time
export function useOptimizedQuery<T>(
  queryKey: (string | number)[],
  options?: Omit<UseQueryOptions<T>, "queryKey">
) {
  const optimizedOptions = useMemo(() => ({
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    ...options,
  }), [options]);

  return useQuery({
    queryKey,
    ...optimizedOptions,
  });
}

// Static data cache for rarely changing data
export function useStaticQuery<T>(
  queryKey: (string | number)[],
  options?: Omit<UseQueryOptions<T>, "queryKey">
) {
  const staticOptions = useMemo(() => ({
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 1,
    ...options,
  }), [options]);

  return useQuery({
    queryKey,
    ...staticOptions,
  });
}