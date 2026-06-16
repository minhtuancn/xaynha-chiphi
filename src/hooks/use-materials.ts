import { useQuery } from "@tanstack/react-query";
import { getMaterials } from "@/actions/materials";

export const useMaterials = () => {
  return useQuery({
    queryKey: ["materials"],
    queryFn: () => getMaterials(),
  });
};

export const useAllMaterials = () => {
  return useQuery({
    queryKey: ["materials", "all"],
    queryFn: () => getMaterials(),
  });
};

export const useMaterialsPaginated = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["materials", "paginated", page, limit],
    queryFn: () => getMaterials({ page, limit }),
  });
};