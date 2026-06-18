'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function EstimateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Estimate page error:', error);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Không thể tải trang dự toán. Vui lòng thử lại hoặc liên hệ quản trị viên.
      </p>
      <Button onClick={reset}>
        <RefreshCw className="h-4 w-4 mr-2" /> Thử lại
      </Button>
    </div>
  );
}