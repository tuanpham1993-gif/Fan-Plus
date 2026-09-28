import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  login: (
    email: string,
    password: string,
    captchaToken?: string,
  ) => Promise<User>;
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
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const applyUser = useCallback((next: User | null) => {
    userRef.current = next;
    setUser(next);
    const nextStatus = next ? "authenticated" : "unauthenticated";
    setStatus(nextStatus);
    if (serverMode) repository.syncLegacyAuthShadow(next);
  }, []);

  const refresh = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) {
      setStatus("loading");
    }
    setError(null);
    try {
      const next = serverMode
        ? (await authApi.me()).user
        : repository.currentSessionUser();
      applyUser(next);
      return next;
    } catch (cause) {
      setUser(null);
      userRef.current = null;
      setStatus("unauthenticated");
      setError(messageOf(cause));
      if (serverMode) repository.syncLegacyAuthShadow(null);
      return null;
    }
  }, [applyUser]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      // Temporary: use a fixed test token while the captcha UI is hidden.
      // Remove the default and require a real widget token when captcha is implemented.
      captchaToken = "PASSED_TEST_TOKEN",
    ) => {
      setError(null);
      try {
        const next = serverMode
          ? (await authApi.login(email, password, captchaToken)).user
          : repository.currentUser(await repository.login(email, password));
        if (!next)
          throw new Error("The authenticated user could not be loaded.");
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
