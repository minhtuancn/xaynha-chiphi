"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/actions/dashboard";
import { serialize } from "@/lib/serialize";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const data = await getDashboardData();
      if (!data.project) return null;
      return serialize(data);
    },
    staleTime: 30_000, // 30s
    refetchInterval: 60_000, // auto-refresh mỗi phút
  });
}
