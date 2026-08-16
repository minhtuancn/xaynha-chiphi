import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Không tìm thấy trang</h2>
      <p className="text-muted-foreground">Trang bạn đang tìm kiếm không tồn tại.</p>
      <Link href="/dashboard">
        <Button>Về Dashboard</Button>
      </Link>
    </div>
  );
}
