import { useQuery } from "@tanstack/react-query";
import { getMaterials } from "@/actions/materials";

export const useMaterials = () => {
  return useQuery({
    queryKey: ["materials"],
    queryFn: () => getMaterials(),
  });
};
