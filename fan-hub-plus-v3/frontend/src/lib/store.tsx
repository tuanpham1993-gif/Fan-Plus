import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Database, User } from "../domain/types";
import { repository } from "../services/repository";
interface Notice {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}
interface AppState {
  db: Database | null;
  user: User | null;
  loading: boolean;
  error: string;
  theme: "dark" | "light";
  fontScale: number;
  spoilerSafe: boolean;
  notices: Notice[];
  reload: () => Promise<void>;
  perform: (op: () => Promise<Database>, message?: string) => Promise<boolean>;
  setDb: (db: Database) => void;
  notify: (message: string, kind?: Notice["kind"]) => void;
  toggleTheme: () => void;
  setFontScale: (n: number) => void;
  toggleSpoilers: () => void;
}
const Context = createContext<AppState | null>(null);
function pref(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(
    pref("fanhub.theme", "dark") === "light" ? "light" : "dark",
  );
  const [fontScale, setScale] = useState(
    Math.max(1, Math.min(1.25, Number(pref("fanhub.font", "1")) || 1)),
  );
  const [spoilerSafe, setSafe] = useState(
    pref("fanhub.spoilers", "true") === "true",
  );
  const [notices, setNotices] = useState<Notice[]>([]);
  const notify = useCallback(
    (message: string, kind: Notice["kind"] = "success") => {
      const id = Date.now() + Math.random();
      setNotices((n) => [...n.slice(-2), { id, message, kind }]);
      window.setTimeout(
        () => setNotices((n) => n.filter((x) => x.id !== id)),
        4500,
      );
    },
    [],
  );
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDb(await repository.load());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load demo data.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    const sync = (e: StorageEvent) => {
      if (e.key === "fanhub.demo.db.v1") void reload();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [reload]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
    try {
      localStorage.setItem("fanhub.theme", theme);
      localStorage.setItem("fanhub.font", String(fontScale));
      localStorage.setItem("fanhub.spoilers", String(spoilerSafe));
    } catch {}
  }, [theme, fontScale, spoilerSafe]);
  const perform = useCallback(
    async (op: () => Promise<Database>, message?: string) => {
      try {
        setDb(await op());
        if (message) notify(message);
        return true;
      } catch (e) {
        notify(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please retry.",
          "error",
        );
        return false;
      }
    },
    [notify],
  );
  return (
    <Context.Provider
      value={{
        db,
        user: db ? repository.currentUser(db) : null,
        loading,
        error,
        theme,
        fontScale,
        spoilerSafe,
        notices,
        reload,
        perform,
        setDb,
        notify,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        setFontScale: (n) => setScale(Math.max(1, Math.min(1.25, n))),
        toggleSpoilers: () => setSafe((s) => !s),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider is required.");
  return value;
}
