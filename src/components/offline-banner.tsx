"use client";

import { useState } from "react";
import { useOffline } from "./offline-provider";
import { WifiOff, X } from "lucide-react";

export function OfflineBanner() {
  const { isOffline, pendingCount } = useOffline();
  const [dismissed, setDismissed] = useState(false);

  if (!isOffline) return null;
  if (dismissed) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>
          Bạn đang ngoại tuyến.
          {pendingCount > 0
            ? ` ${pendingCount} mục đang chờ đồng bộ.`
            : " Dữ liệu sẽ được đồng bộ khi có kết nối."}
        </span>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 hover:bg-amber-600 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
