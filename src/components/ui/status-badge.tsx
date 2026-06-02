import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  labels?: Record<string, string>;
  className?: string;
}

const defaultColors: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  NOT_STARTED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  ON_HOLD: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  RECEIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  UNPAID: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PARTIAL: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function StatusBadge({ status, labels, className }: StatusBadgeProps) {
  const label = labels?.[status] || status;
  const colorClass = defaultColors[status] || "bg-gray-100 text-gray-800";

  return (
    <Badge className={cn("font-normal", colorClass, className)}>
      {label}
    </Badge>
  );
}
