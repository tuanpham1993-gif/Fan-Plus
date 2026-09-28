import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "../../domain/types";
import { useApp } from "../../lib/store";
import { useAuth } from "../auth/AuthProvider";
import {
  profileDataSource,
  type EditableProfile,
  type ProfileUpdateResult,
} from "./dataSource";

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Your profile could not be loaded.";
}

function hasMeaningfulProfileDiff(current: User | null, next: User): boolean {
  if (!current) return true;

  const currentFavoriteFandoms = current.favorite_fandoms ?? [];
  const nextFavoriteFandoms = next.favorite_fandoms ?? [];
  const currentDisplayPreferences = current.display_preferences ?? {};
  const nextDisplayPreferences = next.display_preferences ?? {};

  return (
    current.name !== next.name ||
    (current.avatar ?? null) !== (next.avatar ?? null) ||
    current.status !== next.status ||
    JSON.stringify(currentFavoriteFandoms) !==
      JSON.stringify(nextFavoriteFandoms) ||
    JSON.stringify(currentDisplayPreferences) !==
      JSON.stringify(nextDisplayPreferences)
  );
}

export function useProfileSettings() {
  const { user, adoptUser } = useAuth();
  const { setDb } = useApp();
  const [profile, setProfile] = useState<User | null>(user);
  const [loading, setLoading] = useState(Boolean(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const lastFetchedUserIdRef = useRef<number | string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        setError("");
        return null;
      }

      setLoading(true);
      setError("");
      try {
        const next = await profileDataSource.current(user, signal);
        if (signal?.aborted) return null;

        setProfile(next);

        if (hasMeaningfulProfileDiff(user, next)) {
          adoptUser(next);
        }

        return next;
      } catch (cause) {
        if (!signal?.aborted) setError(messageOf(cause));
        return null;
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [user, adoptUser],
  );

  useEffect(() => {
    if (!user) {
      lastFetchedUserIdRef.current = null;
      setProfile(null);
      setLoading(false);
      setError("");
      return;
    }

    if (
      lastFetchedUserIdRef.current === user.id &&
      profile &&
      profile.id === user.id
    ) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let completed = false;
    const request = load(controller.signal);
    void request.then((next) => {
      if (!controller.signal.aborted && next) {
        lastFetchedUserIdRef.current = user.id;
        completed = true;
      }
    });

    return () => {
      controller.abort();
      if (!completed) {
        if (lastFetchedUserIdRef.current === user.id) {
          lastFetchedUserIdRef.current = null;
        }
        setLoading(false);
      }
    };
  }, [user?.id, load, profile]);

  const save = useCallback(
    async (input: EditableProfile): Promise<ProfileUpdateResult> => {
      const current = profile || user;
      if (!current) throw new Error("Please sign in to edit your profile.");

      setSaving(true);
      setError("");
      try {
        const result = await profileDataSource.update(current, input);
        if (result.legacyDb) setDb(result.legacyDb);
        setProfile(result.user);
        adoptUser(result.user);
        return result;
      } catch (cause) {
        setError(messageOf(cause));
        throw cause;
      } finally {
        setSaving(false);
      }
    },
    [profile, user?.id, adoptUser, setDb],
  );

  const adoptProfile = useCallback(
    (next: User) => {
      setProfile(next);
      adoptUser(next);
    },
    [adoptUser],
  );

  return {
    profile,
    loading,
    saving,
    error,
    reload: load,
    save,
    adoptProfile,
  };
}
