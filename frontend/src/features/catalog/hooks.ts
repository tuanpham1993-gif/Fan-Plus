import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Category, Content, User } from "../../domain/types";
import { useAuth } from "../auth/AuthProvider";
import { useApp } from "../../lib/store";
import {
  FANDOM_CATEGORIES,
  canonicalizeCategories,
  categoryLabel,
  isFandomCategoryId,
  type FandomCategoryId,
} from "../../shared/catalog/taxonomy";
import { ApiError, serverMode } from "../../shared/http/client";
import { catalogDataSource } from "./dataSource";
import type {
  CatalogPage,
  CatalogQuery,
  ContentDetailPayload,
  ContentRatingSummary,
} from "./api";
import { optimisticRatingSummary } from "./rating";

const EMPTY_PAGE: CatalogPage = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 9,
  pageCount: 1,
};

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Catalog data could not be loaded.";
}

export function useCatalogPage(query: CatalogQuery) {
  const { db } = useApp();
  const [categories, setCategories] = useState<Category[]>(() =>
    canonicalizeCategories(),
  );
  const [page, setPage] = useState<CatalogPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryWarning, setCategoryWarning] = useState("");
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setCategoryWarning("");

    const load = async () => {
      const [categoriesResult, pageResult] = await Promise.allSettled([
        catalogDataSource.categories(db, controller.signal),
        catalogDataSource.contents(db, query, controller.signal),
      ]);
      if (!active || controller.signal.aborted) return;

      if (categoriesResult.status === "fulfilled")
        setCategories(categoriesResult.value);
      else {
        setCategories(canonicalizeCategories());
        setCategoryWarning(errorMessage(categoriesResult.reason));
      }

      if (pageResult.status === "fulfilled") setPage(pageResult.value);
      else {
        setPage(EMPTY_PAGE);
        setError(errorMessage(pageResult.reason));
      }
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [db, queryKey]);

  return { categories, page, loading, error, categoryWarning };
}

export interface PersonalizedPick {
  content: Content;
  reason: string;
}

export function useHomeCatalog(user: User | null) {
  const { db } = useApp();
  const [categories, setCategories] = useState<Category[]>(() =>
    canonicalizeCategories(),
  );
  const [featured, setFeatured] = useState<Content[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryWarning, setCategoryWarning] = useState("");

  const favoriteCategory = useMemo<FandomCategoryId | null>(() => {
    const found = user?.favoriteCategories.find(isFandomCategoryId);
    return found || null;
  }, [user?.favoriteCategories.join("|")]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setCategoryWarning("");

    const load = async () => {
      const favoritePromise = favoriteCategory
        ? catalogDataSource.favoriteCategoryContents(
            db,
            favoriteCategory,
            controller.signal,
          )
        : Promise.resolve(null);
      const [categoriesResult, featuredResult, favoriteResult] =
        await Promise.allSettled([
          catalogDataSource.categories(db, controller.signal),
          catalogDataSource.contents(
            db,
            { sortBy: "popular", page: 1, pageSize: 12 },
            controller.signal,
          ),
          favoritePromise,
        ]);
      if (!active || controller.signal.aborted) return;

      if (categoriesResult.status === "fulfilled")
        setCategories(categoriesResult.value);
      else {
        setCategories(canonicalizeCategories());
        setCategoryWarning(errorMessage(categoriesResult.reason));
      }

      if (featuredResult.status === "fulfilled")
        setFeatured(featuredResult.value.items);
      else {
        setFeatured([]);
        setError(errorMessage(featuredResult.reason));
      }

      if (
        favoriteResult.status === "fulfilled" &&
        favoriteResult.value !== null
      ) {
        setFavoriteItems(favoriteResult.value.items);
      } else setFavoriteItems([]);

      setLoading(false);
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [db, favoriteCategory]);

  const picks = useMemo<PersonalizedPick[]>(() => {
    const deduped = new Map<string, Content>();
    for (const content of [...favoriteItems, ...featured]) {
      if (!deduped.has(content.id)) deduped.set(content.id, content);
    }
    return [...deduped.values()]
      .map((content) => {
        const categoryMatch = user?.favoriteCategories.includes(
          content.categoryId,
        );
        const fandomMatch = user?.favoriteFandoms.includes(content.fandom);
        return {
          content,
          reason: categoryMatch
            ? `Because you like ${categoryLabel(content.categoryId)}`
            : fandomMatch
              ? `From ${content.fandom}, a fandom you follow`
              : "An editorial discovery",
          score:
            content.popularity +
            (categoryMatch ? 100 : 0) +
            (fandomMatch ? 150 : 0),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ content, reason }) => ({ content, reason }));
  }, [featured, favoriteItems, user]);

  return {
    categories: categories.length ? categories : [...FANDOM_CATEGORIES],
    picks,
    favoriteCategory,
    favoriteCategoryLabel: favoriteCategory
      ? categoryLabel(favoriteCategory)
      : "",
    favoriteItems,
    loading,
    error,
    categoryWarning,
  };
}

export interface ContentDetailState {
  detail: ContentDetailPayload | null;
  loading: boolean;
  error: string;
  notFound: boolean;
}

export function useContentDetail(id: string): ContentDetailState {
  const { db, setDb } = useApp();
  const { user } = useAuth();
  const [detail, setDetail] = useState<ContentDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const recordedView = useRef("");
  const demoReady = serverMode || Boolean(db);

  useEffect(() => {
    if (!demoReady) return;

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setNotFound(false);
    setDetail(null);

    const load = async () => {
      try {
        const result = await catalogDataSource.detail(
          db,
          id,
          user,
          controller.signal,
        );
        if (!active || controller.signal.aborted) return;
        setDetail(result);
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        const is404 = cause instanceof ApiError && cause.status === 404;
        setNotFound(is404);
        setError(
          is404
            ? "This story is unavailable. It may have been removed or may not be published yet."
            : errorMessage(cause),
        );
      } finally {
        if (active && !controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
    // Demo data is only required to become available once for this route.
    // Subsequent demo rating/activity writes should not refetch and flash Detail.
  }, [id, user?.id, user?.role, demoReady]);

  useEffect(() => {
    if (!detail || !user) return;
    const key = `${user.id}:${detail.content.id}`;
    if (recordedView.current === key) return;
    recordedView.current = key;

    void catalogDataSource
      .recordView(detail.content.id)
      .then((nextDb) => {
        if (nextDb) setDb(nextDb);
      })
      .catch(() => {
        // Reading activity is non-critical and is still demo-only until its
        // dedicated server contract is refactored.
      });
  }, [detail?.content.id, user?.id, setDb]);

  return { detail, loading, error, notFound };
}

export function useContentRating(
  contentId: string,
  initial: ContentRatingSummary,
) {
  const { db, setDb, notify } = useApp();
  const { user } = useAuth();
  const [rating, setRating] = useState<ContentRatingSummary>(initial);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setRating(initial);
  }, [
    contentId,
    initial.userRating,
    initial.average,
    initial.count,
  ]);

  const rate = useCallback(
    async (value: number) => {
      if (!user || pending) return false;

      const previous = rating;
      setRating(optimisticRatingSummary(previous, value));
      setPending(true);

      try {
        const result = await catalogDataSource.rate(
          db,
          contentId,
          value,
          user,
        );
        if (result.legacyDb) setDb(result.legacyDb);
        setRating(result.rating);
        notify("Your rating has been saved.");
        return true;
      } catch (cause) {
        setRating(previous);
        notify(
          cause instanceof Error
            ? cause.message
            : "Your rating could not be saved. Please retry.",
          "error",
        );
        return false;
      } finally {
        setPending(false);
      }
    },
    [contentId, db, notify, pending, rating, setDb, user],
  );

  return { rating, pending, rate };
}
