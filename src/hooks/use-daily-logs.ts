import { useQuery } from "@tanstack/react-query";
import { getDailyLogs } from "@/actions/daily-logs";

export const useDailyLogs = () => {
  return useQuery({
    queryKey: ["daily-logs"],
    queryFn: () => getDailyLogs(),
  });
};
