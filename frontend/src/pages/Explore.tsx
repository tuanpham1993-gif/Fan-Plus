import React, { useEffect, useState } from "react";
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
} from "../components/ui";
import { useCatalogPage } from "../features/catalog/hooks";
import type { CatalogQuery } from "../features/catalog/api";
import { isFandomCategoryId } from "../shared/catalog/taxonomy";
import { useApp } from "../lib/store";
import CreatePost from "../pages/CreatePost";

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function Explore({ mode = "explore" }: { mode?: string }) {
  const { params, pathname, search } = useLocation();
  const { user } = useApp();
  const [q, setQ] = useState(params.get("q") || "");
  const [list, setList] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  useEffect(() => {
    setQ(params.get("q") || "");
  }, [search]);

  const requestedCategory = params.get("category");

  const type =
    mode === "media"
      ? params.get("type") || "video,audio,gallery"
      : mode === "characters"
        ? "character"
        : mode === "showcase"
          ? "merchandise"
          : params.get("type") || undefined;

  const requestedSort =
    params.get("sort_by") || params.get("sort") || "latest";

  const sortBy = ["latest", "popular", "az"].includes(requestedSort)
    ? (requestedSort as CatalogQuery["sortBy"])
    : "latest";

  const query: CatalogQuery = {
    q: params.get("q") || undefined,
    category: isFandomCategoryId(requestedCategory)
      ? requestedCategory
      : undefined,
    fandom: params.get("fandom") || undefined,
    type,
    genre: params.get("genre") || undefined,
    year: params.get("year") || undefined,
    popular: params.get("popular") === "true",
    sortBy,
    page: positiveInt(params.get("page"), 1),
    pageSize: 9,
  };

  const {
    categories,
    page: result,
    loading,
    error,
    categoryWarning,
  } = useCatalogPage(query);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(search);

    value ? next.set(key, value) : next.delete(key);

    if (key === "sort_by") {
      next.delete("sort");
    }

    if (key !== "page") {
      next.delete("page");
    }

    navigate(
      pathname + (next.size ? `?${next.toString()}` : "")
    );
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

  const active = [
    ["q", query.q || ""],
    ["category", query.category || ""],
    ["fandom", query.fandom || ""],
    ["genre", query.genre || ""],
    ["year", query.year || ""],
    ["popular", query.popular ? "true" : ""],
    ...(mode === "explore" && query.type
      ? [["type", query.type] as [string, string]]
      : []),
  ].filter(([, value]) => Boolean(value));

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

      <PageHeading
        eyebrow="THE DISCOVERY DESK"
        title={title}
        description={desc}
      >
        {user?.role === "admin" && (
          <Button
            onClick={() => setShowCreatePost(true)}
          >
            Add New Post <Icon name="plus" size={15} />
          </Button>
        )}

        <Link className="btn btn-secondary" to="/categories">
          Browse categories <Icon name="arrow" size={15} />
        </Link>
      </PageHeading>
      {showCreatePost && (
        <CreatePost onClose={() => setShowCreatePost(false)} />
      )}
      {mode === "showcase" && (
        <Notice>
          No cart, checkout, payments or orders. All objects and release
          information in this prototype are fictional concepts.
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
      </div>

      <div
        className="category-tabs"
        role="group"
        aria-label="Filter by category"
      >
        <button
          className={!query.category ? "active" : ""}
          onClick={() => update("category", "")}
        >
          All categories
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => update("category", category.id)}
            className={
              query.category === category.id ? "active" : ""
            }
          >
            <Icon name={category.icon} size={15} />
            {category.name}
          </button>
        ))}
      </div>

      <div className="explore-results">
        <div className="results-toolbar">
          <p role="status">
            <strong>{loading ? "..." : result.total}</strong>{" "}
            {result.total === 1 ? "discovery" : "discoveries"}
            <span> in this collection</span>
          </p>

          <div>
            <select
              aria-label="Sort content"
              value={query.sortBy || "latest"}
              onChange={(event) =>
                update("sort_by", event.target.value)
              }
            >
              <option value="latest">Latest first</option>
              <option value="popular">Most popular</option>
              <option value="az">A to Z</option>
            </select>

            <div className="view-toggle">
              <button
                aria-label="Grid view"
                aria-pressed={!list}
                onClick={() => setList(false)}
                className={!list ? "active" : ""}
              >
                <Icon name="grid" size={16} />
              </button>

              <button
                aria-label="List view"
                aria-pressed={list}
                onClick={() => setList(true)}
                className={list ? "active" : ""}
              >
                <Icon name="list" size={18} />
              </button>
            </div>
          </div>
        </div>

        {categoryWarning && (
          <Notice>
            Category metadata could not be loaded from the API. The
            canonical eight-category SRS taxonomy is shown instead.{" "}
            {categoryWarning}
          </Notice>
        )}

        {active.length > 0 && (
          <div className="active-filters">
            {active.map(([key, value]) => (
              <button
                className="chip"
                key={key}
                onClick={() => update(key, "")}
              >
                {key}: {value}
                <Icon name="close" size={12} />
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <Skeleton cards={6} />
        ) : error ? (
          <Empty
            title="Catalog data is not available yet."
            description={error}
          >
            <Button
              onClick={() => {
                setQ("");
                navigate(pathname);
              }}
            >
              Clear filters
            </Button>
          </Empty>
        ) : result.total ? (
          <>
            <div className={`card-grid ${list ? "list-view" : ""}`}>
              {result.items.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>

            <nav
              className="pagination"
              aria-label="Results pages"
            >
              <Button
                variant="secondary"
                disabled={result.page === 1}
                onClick={() =>
                  update("page", String(result.page - 1))
                }
              >
                Previous
              </Button>

              <span>
                Page {result.page} of {result.pageCount}
              </span>

              <Button
                variant="secondary"
                disabled={result.page === result.pageCount}
                onClick={() =>
                  update("page", String(result.page + 1))
                }
              >
                Next <Icon name="arrow" size={15} />
              </Button>
            </nav>
          </>
        ) : (
          <Empty
            title="No worlds found. Yet."
            description="Try another search or clear a filter. Your next discovery could be just around the corner."
          >
            <Button
              onClick={() => {
                setQ("");
                navigate(pathname);
              }}
            >
              Clear all filters
            </Button>
          </Empty>
        )}
      </div>
    </>
  );
}