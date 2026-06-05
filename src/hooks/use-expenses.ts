"use client";

import { useQuery } from "@tanstack/react-query";
import { getExpenses } from "@/actions/financial";
import { serialize } from "@/lib/serialize";

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const data = await getExpenses();
      return serialize(data);
    },
    staleTime: 60_000,
  });
}
