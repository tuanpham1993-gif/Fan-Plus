import type { Category } from "../../domain/types";

export const FANDOM_CATEGORY_IDS = [
  "anime",
  "gaming",
  "movies",
  "tv",
  "kpop",
  "comics",
  "manga",
  "cosplay",
] as const;

export type FandomCategoryId = (typeof FANDOM_CATEGORY_IDS)[number];

export const FANDOM_CATEGORIES: readonly Category[] = [
  { id: "anime", name: "Anime", description: "Stories beyond the ordinary", icon: "sparkles", color: "#c3b0fc" },
  { id: "gaming", name: "Gaming", description: "Your next great adventure", icon: "gamepad", color: "#a7dab6" },
  { id: "movies", name: "Movies", description: "Made for the big screen", icon: "film", color: "#f3b08d" },
  { id: "tv", name: "TV Shows", description: "One more episode", icon: "tv", color: "#96c6f1" },
  { id: "kpop", name: "K-Pop", description: "Feel every beat", icon: "music", color: "#ef9dbf" },
  { id: "comics", name: "Comics", description: "Every panel a possibility", icon: "bolt", color: "#eed385" },
  { id: "manga", name: "Manga", description: "A world between the pages", icon: "book", color: "#bdd1cd" },
  { id: "cosplay", name: "Cosplay", description: "Bring your world to life", icon: "mask", color: "#dda9ef" },
] as const;

const ID_SET = new Set<string>(FANDOM_CATEGORY_IDS);
const CATEGORY_BY_ID = new Map(FANDOM_CATEGORIES.map((category) => [category.id, category]));

export function isFandomCategoryId(value: unknown): value is FandomCategoryId {
  return typeof value === "string" && ID_SET.has(value);
}

export function categoryLabel(value: string) {
  return CATEGORY_BY_ID.get(value)?.name || value;
}

export function canonicalizeCategories(input: readonly Category[] = []): Category[] {
  const backend = new Map(
    input
      .filter((category) => isFandomCategoryId(category.id))
      .map((category) => [category.id, category]),
  );

  return FANDOM_CATEGORIES.map((canonical) => ({
    ...canonical,
    ...backend.get(canonical.id),
    id: canonical.id,
    name: canonical.name,
  }));
}
