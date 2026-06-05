import { useQuery } from "@tanstack/react-query";
import { getMaterialCategories } from "@/actions/materials";

export const useMaterialCategories = () => {
  return useQuery({
    queryKey: ["material-categories"],
    queryFn: () => getMaterialCategories(),
  });
};
