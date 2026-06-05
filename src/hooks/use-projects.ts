"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/actions/projects";
import { serialize } from "@/lib/serialize";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const data = await getProjects();
      return serialize(data);
    },
  });
}
