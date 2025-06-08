import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { 
    data: user, 
    isLoading, 
    error 
  } = useQuery<User | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isWholesaler: user?.role === "wholesaler",
    isCustomer: user?.role === "customer",
    isEmailVerified: user?.isEmailVerified ?? false,
    isApproved: user?.isApproved ?? false,
  };
}