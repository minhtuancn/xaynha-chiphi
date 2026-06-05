import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card } from "./card";
import { Inbox, AlertCircle, SearchX, FileX } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed shadow-sm", className)}>
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
          {icon ?? <Inbox className="h-8 w-8" />}
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
        {action && (
          <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function EmptySearchState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<SearchX className="h-8 w-8" />}
      title="Không tìm thấy kết quả"
      description={query ? `Không có dữ liệu phù hợp với "${query}"` : "Thử thay đổi từ khóa tìm kiếm"}
    />
  );
}

export function EmptyTableState({ title = "Chưa có dữ liệu" }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <div className="mb-3 rounded-full bg-muted p-3">
        <FileX className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Có lỗi xảy ra",
  message = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("border-destructive/20 shadow-sm", className)}>
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </div>
    </Card>
  );
}
