"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { DataAdapter } from "./contracts";
import { getDataAdapter } from ".";
import type { AuthSession, Role, User } from "./models";

type DataContextValue = DataAdapter & {
  currentUser: User | null;
  loadingSession: boolean;
  refreshSession: () => Promise<void>;
  requireRole: (role: Role) => boolean;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const adapter = useMemo(() => getDataAdapter(), []);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      setSession(await adapter.getSession());
    } finally {
      setLoadingSession(false);
    }
  }, [adapter]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo<DataContextValue>(
    () => ({
      ...adapter,
      currentUser: session?.user ?? null,
      loadingSession,
      refreshSession,
      requireRole: (role) => session?.user.role === role,
      login: async (payload) => {
        const nextSession = await adapter.login(payload);
        setSession(nextSession);
        return nextSession;
      },
      register: async (payload) => {
        const nextSession = await adapter.register(payload);
        setSession(nextSession);
        return nextSession;
      },
      logout: async () => {
        await adapter.logout();
        setSession(null);
      }
    }),
    [adapter, loadingSession, refreshSession, session]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) {
    throw new Error("useData harus digunakan di dalam DataProvider.");
  }
  return value;
}
