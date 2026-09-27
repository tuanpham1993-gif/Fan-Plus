import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "../../domain/types";
import { repository } from "../../services/repository";
import { AUTH_SESSION_CHANGED_EVENT } from "../../shared/auth/events";
import { serverMode } from "../../shared/http/client";
import { authApi } from "./api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  refresh: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  adoptUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Authentication could not be completed.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    setStatus(next ? "authenticated" : "unauthenticated");
    if (serverMode) repository.syncLegacyAuthShadow(next);
  }, []);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const next = serverMode
        ? (await authApi.me()).user
        : repository.currentSessionUser();
      applyUser(next);
      return next;
    } catch (cause) {
      setUser(null);
      setStatus("unauthenticated");
      setError(messageOf(cause));
      if (serverMode) repository.syncLegacyAuthShadow(null);
      return null;
    }
  }, [applyUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const next = serverMode
          ? (await authApi.login(email, password)).user
          : repository.currentUser(await repository.login(email, password));
        if (!next) throw new Error("The authenticated user could not be loaded.");
        applyUser(next);
        return next;
      } catch (cause) {
        setError(messageOf(cause));
        throw cause;
      }
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      if (serverMode) await authApi.logout();
      else await repository.logout();
      applyUser(null);
    } catch (cause) {
      setError(messageOf(cause));
      throw cause;
    }
  }, [applyUser]);

  const adoptUser = useCallback(
    (next: User) => {
      setError(null);
      applyUser(next);
    },
    [applyUser],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const resync = () => void refresh();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, resync);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, resync);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, error, refresh, login, logout, adoptUser }),
    [status, user, error, refresh, login, logout, adoptUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
