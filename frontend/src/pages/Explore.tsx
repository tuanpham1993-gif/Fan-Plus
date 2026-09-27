import React, { useEffect, useMemo, useState } from "react";
import { useLocation, navigate, Link } from "../lib/router";
import {
  Button,
  Icon,
  PageHeading,
  Crumbs,
  ContentCard,
  Empty,
  Notice,
  Skeleton,
  typeLabels,
} from "../components/ui";
import { useCatalogPage } from "../features/catalog/hooks";
import type { CatalogQuery } from "../features/catalog/api";
import { isFandomCategoryId } from "../shared/catalog/taxonomy";

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function Explore({ mode = "explore" }: { mode?: string }) {
  const { params, pathname, search } = useLocation();
  const [q, setQ] = useState(params.get("q") || "");
  const [list, setList] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => setQ(params.get("q") || ""), [search]);

  const query = useMemo<CatalogQuery>(() => {
    const requestedCategory = params.get("category");
    const type =
      mode === "media"
        ? params.get("type") || "video,audio,gallery"
        : mode === "characters"
          ? "character"
          : mode === "showcase"
            ? "merchandise"
            : params.get("type") || undefined;
    const requestedSort = params.get("sort_by") || params.get("sort") || "latest";
    const sortBy = ["latest", "popular", "az"].includes(requestedSort)
      ? (requestedSort as CatalogQuery["sortBy"])
      : "latest";

    return {
      q: params.get("q") || undefined,
      category: isFandomCategoryId(requestedCategory) ? requestedCategory : undefined,
      fandom: params.get("fandom") || undefined,
      type,
      genre: params.get("genre") || undefined,
      year: params.get("year") || undefined,
      popular: params.get("popular") === "true",
      sortBy,
      page: positiveInt(params.get("page"), 1),
      pageSize: 9,
    };
  }, [search, mode]);

  const { categories, page: result, loading, error, categoryWarning } = useCatalogPage(query);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(search);
    value ? next.set(key, value) : next.delete(key);
    if (key === "sort_by") next.delete("sort");
    if (key !== "page") next.delete("page");
    navigate(pathname + (next.size ? `?${next.toString()}` : ""));
  };

  const title =
    mode === "media"
      ? "The media room"
      : mode === "characters"
        ? "The characters we connect with"
        : mode === "showcase"
          ? "Objects from other worlds"
          : "Find your next obsession";
  const desc =
    mode === "showcase"
      ? "A curated collection of fictional collectibles. Made to discover, not to purchase."
      : mode === "media"
        ? "A little motion, a little sound, and a lot of imagination."
        : "Eight categories. A thousand ways to get curious. Start with what you love.";

  const genres = result.facets?.genres?.length
    ? result.facets.genres
    : [...new Set(result.items.map((content) => content.genre))].sort();
  const fandoms = result.facets?.fandoms?.length
    ? result.facets.fandoms
    : [...new Set(result.items.map((content) => content.fandom))].sort();
  const years = result.facets?.years?.length ? result.facets.years : [2026, 2025, 2024];

  const active = ([
    ["q", query.q || ""],
    ["category", query.category || ""],
    ["fandom", query.fandom || ""],
    ["genre", query.genre || ""],
    ["year", query.year || ""],
    ["popular", query.popular ? "true" : ""],
    ...(mode === "explore" && query.type ? [["type", query.type] as [string, string]] : []),
  ] as Array<[string, string]>).filter(([, value]) => Boolean(value));

  return (
    <>
      <Crumbs
        items={[
          {
            label:
              mode === "explore"
                ? "Explore"
                : mode === "showcase"
                  ? "Showcase"
                  : mode === "media"
                    ? "Media room"
                    : "Characters",
          },
        ]}
      />
      <PageHeading eyebrow="THE DISCOVERY DESK" title={title} description={desc}>
        <Link className="btn btn-secondary" to="/categories">
          Browse categories <Icon name="arrow" size={15} />
        </Link>
      </PageHeading>
      {mode === "showcase" && (
        <Notice>
          No cart, checkout, payments or orders. All objects and release information in this prototype are fictional concepts.
        </Notice>
      )}

      <div className="explore-search">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update("q", q.trim());
          }}
          className="search-box"
        >
          <Icon name="search" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            aria-label="Search content"
            placeholder="Search stories, characters, fandoms..."
          />
          <Button type="submit" className="btn-small">
            Search <Icon name="arrow" size={15} />
          </Button>
        </form>
        <Button
          variant="secondary"
          className="filter-mobile"
          onClick={() => setFiltersOpen((state) => !state)}
          aria-expanded={filtersOpen}
        >
          <Icon name="filter" />
          Filters
        </Button>
      </div>

      <div className="category-tabs" role="group" aria-label="Filter by category">
        <button className={!query.category ? "active" : ""} onClick={() => update("category", "")}>
          All categories
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => update("category", category.id)}
            className={query.category === category.id ? "active" : ""}
          >
            <Icon name={category.icon} size={15} />
            {category.name}
          </button>
        ))}
      </div>

      <div className="explore-layout">
        <aside className={`filter-panel ${filtersOpen ? "open" : ""}`}>
          <div className="filter-panel-heading">
            <h2>
              <Icon name="filter" size={17} />
              Refine your world
            </h2>
            <button
              className="small-link"
              onClick={() => {
                setQ("");
                navigate(pathname);
              }}
            >
              Reset
            </button>
          </div>

          <label className="field">
            <span>Fandom</span>
            <select aria-label="Fandom filter" value={query.fandom || ""} onChange={(event) => update("fandom", event.target.value)}>
              <option value="">All fandoms</option>
              {fandoms.map((fandom) => (
                <option key={fandom}>{fandom}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Genre</span>
            <select aria-label="Genre filter" value={query.genre || ""} onChange={(event) => update("genre", event.target.value)}>
              <option value="">All genres</option>
              {genres.map((genre) => (
                <option key={genre}>{genre}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Release year</span>
            <select aria-label="Release year filter" value={query.year || ""} onChange={(event) => update("year", event.target.value)}>
              <option value="">Any year</option>
              {years.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>

          {["explore", "media"].includes(mode) && (
            <label className="field">
              <span>Content type</span>
              <select aria-label="Content type filter" value={params.get("type") || ""} onChange={(event) => update("type", event.target.value)}>
                <option value="">All {mode === "media" ? "media" : "types"}</option>
                {Object.entries(typeLabels)
                  .filter(([key]) => mode !== "media" || ["video", "audio", "gallery"].includes(key))
                  .map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
            </label>
          )}

          <label className="check-row">
            <input
              type="checkbox"
              checked={Boolean(query.popular)}
              onChange={(event) => update("popular", event.target.checked ? "true" : "")}
            />
            Popular picks only
          </label>
          <div className="filter-note">
            <Icon name="shield" size={20} />
            <strong>Explore at your pace.</strong>
            <p>Spoiler warnings help you choose what to read. Change reading preferences in the header.</p>
          </div>
        </aside>

        <div className="explore-results">
          <div className="results-toolbar">
            <p role="status">
              <strong>{loading ? "..." : result.total}</strong>{" "}
              {result.total === 1 ? "discovery" : "discoveries"}
              <span> in this collection</span>
            </p>
            <div>
              <select aria-label="Sort content" value={query.sortBy || "latest"} onChange={(event) => update("sort_by", event.target.value)}>
                <option value="latest">Latest first</option>
                <option value="popular">Most popular</option>
                <option value="az">A to Z</option>
              </select>
              <div className="view-toggle">
                <button aria-label="Grid view" aria-pressed={!list} onClick={() => setList(false)} className={!list ? "active" : ""}>
                  <Icon name="grid" size={16} />
                </button>
                <button aria-label="List view" aria-pressed={list} onClick={() => setList(true)} className={list ? "active" : ""}>
                  <Icon name="list" size={18} />
                </button>
              </div>
            </div>
          </div>

          {categoryWarning && (
            <Notice>
              Category metadata could not be loaded from the API. The canonical eight-category SRS taxonomy is shown instead. {categoryWarning}
            </Notice>
          )}

          {active.length > 0 && (
            <div className="active-filters">
              {active.map(([key, value]) => (
                <button className="chip" key={key} onClick={() => update(key, "")}>
                  {key}: {value}
                  <Icon name="close" size={12} />
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <Skeleton cards={6} />
          ) : error ? (
            <Empty title="Catalog data is not available yet." description={error}>
              <Button onClick={() => { setQ(""); navigate(pathname); }}>Clear filters</Button>
            </Empty>
          ) : result.total ? (
            <>
              <div className={`card-grid ${list ? "list-view" : ""}`}>
                {result.items.map((content) => (
                  <ContentCard key={content.id} content={content} />
                ))}
              </div>
              <nav className="pagination" aria-label="Results pages">
                <Button variant="secondary" disabled={result.page === 1} onClick={() => update("page", String(result.page - 1))}>
                  Previous
                </Button>
                <span>Page {result.page} of {result.pageCount}</span>
                <Button variant="secondary" disabled={result.page === result.pageCount} onClick={() => update("page", String(result.page + 1))}>
                  Next <Icon name="arrow" size={15} />
                </Button>
              </nav>
            </>
          ) : (
            <Empty title="No worlds found. Yet." description="Try another search or clear a filter. Your next discovery could be just around the corner.">
              <Button onClick={() => { setQ(""); navigate(pathname); }}>Clear all filters</Button>
            </Empty>
          )}
        </div>
      </div>
    </>
  );
}
