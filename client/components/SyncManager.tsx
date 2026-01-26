import React, { createContext, useContext } from "react";
import { useSyncManager } from "@/hooks/useSyncManager";
import { SyncStatus } from "@/lib/sync";

interface SyncContextType {
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  syncNow: () => void;
}

const SyncContext = createContext<SyncContextType>({
  syncStatus: "idle",
  lastSyncTime: null,
  syncNow: () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const syncManager = useSyncManager();

  return (
    <SyncContext.Provider value={syncManager}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
