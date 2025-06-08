import { useQuery, QueryKey, UseQueryOptions } from "@tanstack/react-query";

export interface OptimizedQueryOptions<T> {
  queryKey: QueryKey;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number | false;
  select?: (data: T) => T;
}

// High-frequency data (user actions, real-time data)
export function useOptimizedQuery<T>(
  options: OptimizedQueryOptions<T>
): ReturnType<typeof useQuery<T>> {
  return useQuery<T>({
    queryKey: options.queryKey,
    enabled: options.enabled,
    staleTime: options.staleTime || 1 * 60 * 1000, // 1 minute default
    gcTime: options.gcTime || 5 * 60 * 1000, // 5 minutes default
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    refetchOnMount: options.refetchOnMount ?? true,
    refetchInterval: options.refetchInterval ?? false,
    select: options.select,
    retry: 2,
  });
}

// Static or rarely-changing data (categories, settings)
export function useStaticQuery<T>(
  options: OptimizedQueryOptions<T>
): ReturnType<typeof useQuery<T>> {
  return useQuery<T>({
    queryKey: options.queryKey,
    enabled: options.enabled,
    staleTime: options.staleTime || 30 * 60 * 1000, // 30 minutes default
    gcTime: options.gcTime || 60 * 60 * 1000, // 1 hour default
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    select: options.select,
    retry: 1,
  });
}

// Real-time data (prices, rates, live updates)
export function useRealTimeQuery<T>(
  options: OptimizedQueryOptions<T> & { interval?: number }
): ReturnType<typeof useQuery<T>> {
  return useQuery<T>({
    queryKey: options.queryKey,
    enabled: options.enabled,
    staleTime: options.staleTime || 30 * 1000, // 30 seconds default
    gcTime: options.gcTime || 2 * 60 * 1000, // 2 minutes default
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: options.interval || 2 * 60 * 1000, // 2 minutes default
    select: options.select,
    retry: 3,
  });
}