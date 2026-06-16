"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type OfflineContextType = {
  isOffline: boolean;
  pendingCount: number;
};

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  pendingCount: 0,
});

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      window.dispatchEvent(new Event("xaynha:online"));
    }
    function handleOffline() {
      setIsOffline(true);
    }

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    function handleQueueUpdate() {
      try {
        const raw = localStorage.getItem("xaynha_offline_queue");
        const queue = raw ? JSON.parse(raw) : [];
        setPendingCount(queue.length);
      } catch {
        setPendingCount(0);
      }
    }
    window.addEventListener("xaynha:queue-update", handleQueueUpdate);
    handleQueueUpdate();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("xaynha:queue-update", handleQueueUpdate);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOffline, pendingCount }}>
      {children}
    </OfflineContext.Provider>
  );
}
