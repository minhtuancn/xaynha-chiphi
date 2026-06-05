import { useQuery } from "@tanstack/react-query";
import { getWorkers } from "@/actions/workers";

export const useWorkers = () => {
  return useQuery({
    queryKey: ["workers"],
    queryFn: () => getWorkers(),
  });
};
