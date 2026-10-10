"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { apiRequest } from "@/lib/client/api";
import type { ClientUser } from "@/types/domain";
import type { LoginRequest, LoginResponse, MeResponse } from "@/types/api";

export interface AuthContextValue {
  user: ClientUser | null;
  isReady: boolean;
  login(credentials: LoginRequest): Promise<ClientUser>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  setUser(user: ClientUser | null): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const fetchCurrentUser = (): Promise<ClientUser | null> =>
  apiRequest<MeResponse>("/api/auth/me")
    .then((data) => data.user)
    .catch(() => null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    const data = await fetchCurrentUser();
    setUser(data);
    setIsReady(true);
  }, []);

  useEffect(() => {
    let isActive = true;
    fetchCurrentUser().then((data) => {
      if (!isActive) return;
      setUser(data);
      setIsReady(true);
    });
    return () => {
      isActive = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const data = await apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: credentials,
    });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isReady, login, logout, refresh, setUser }),
    [user, isReady, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
