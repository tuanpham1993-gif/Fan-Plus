import React, { useEffect, useMemo, useState } from "react";
import { useLocation, navigate } from "../lib/router";
import { useApp } from "../lib/store";
import {
  Button,
  Icon,
  PageHeading,
  Crumbs,
  ContentCard,
  Empty,
  Notice,
  typeLabels,
} from "../components/ui";
import { filterContents } from "../domain/logic";
import type { Filter } from "../domain/types";
export default function Explore({ mode = "explore" }: { mode?: string }) {
  const { db } = useApp();
  const { params, pathname, search } = useLocation();
  const [q, setQ] = useState(params.get("q") || ""),
    [list, setList] = useState(false),
    [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setQ(params.get("q") || ""), [search]);
  const filter: Filter = Object.fromEntries(params.entries());
  if (mode === "media")
    filter.type = params.get("type") || "video,audio,gallery";
  if (mode === "characters") filter.type = "character";
  if (mode === "showcase") filter.type = "merchandise";
  const result = useMemo(
    () => filterContents(db?.contents || [], filter),
    [db, search, mode],
  );
  if (!db) return null;
  const update = (key: string, value: string) => {
    const p = new URLSearchParams(search);
    value ? p.set(key, value) : p.delete(key);
    if (key !== "page") p.delete("page");
    navigate(pathname + (p.size ? "?" + p.toString() : ""));
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
  const genres = [
      ...new Set(
        db.contents.filter((c) => c.status === "published").map((c) => c.genre),
      ),
    ].sort(),
    fandoms = [
      ...new Set(
        db.contents
          .filter((c) => c.status === "published")
          .map((c) => c.fandom),
      ),
    ].sort();
  const active = Object.entries(filter).filter(
    ([k, v]) =>
      v &&
      k !== "page" &&
      k !== "sort" &&
      !(mode !== "explore" && k === "type"),
  );
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
      />
      {mode === "showcase" && (
        <Notice>
          No cart, checkout, payments or orders. All objects and release
          information in this prototype are fictional concepts.
        </Notice>
      )}
      <div className="explore-search">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update("q", q.trim());
          }}
          className="search-box"
        >
          <Icon name="search" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
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
          onClick={() => setFiltersOpen((s) => !s)}
          aria-expanded={filtersOpen}
        >
          <Icon name="filter" />
          Filters
        </Button>
      </div>
      <div
        className="category-tabs"
        role="group"
        aria-label="Filter by category"
      >
        <button
          className={!filter.category ? "active" : ""}
          onClick={() => update("category", "")}
        >
          All worlds
        </button>
        {db.categories.map((c) => (
          <button
            key={c.id}
            onClick={() => update("category", c.id)}
            className={filter.category === c.id ? "active" : ""}
          >
            <Icon name={c.icon} size={15} />
            {c.name}
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
            <select
              aria-label="Fandom filter"
              value={filter.fandom || ""}
              onChange={(e) => update("fandom", e.target.value)}
            >
              <option value="">All fandoms</option>
              {fandoms.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Genre</span>
            <select
              aria-label="Genre filter"
              value={filter.genre || ""}
              onChange={(e) => update("genre", e.target.value)}
            >
              <option value="">All genres</option>
              {genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Release year</span>
            <select
              aria-label="Release year filter"
              value={filter.year || ""}
              onChange={(e) => update("year", e.target.value)}
            >
              <option value="">Any year</option>
              {[2026, 2025, 2024].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          {["explore", "media"].includes(mode) && (
            <label className="field">
              <span>Content type</span>
              <select
                aria-label="Content type filter"
                value={params.get("type") || ""}
                onChange={(e) => update("type", e.target.value)}
              >
                <option value="">
                  All {mode === "media" ? "media" : "types"}
                </option>
                {Object.entries(typeLabels)
                  .filter(
                    ([k]) =>
                      mode !== "media" ||
                      ["video", "audio", "gallery"].includes(k),
                  )
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label className="check-row">
            <input
              type="checkbox"
              checked={filter.popular === "true"}
              onChange={(e) =>
                update("popular", e.target.checked ? "true" : "")
              }
            />
            Popular picks only
          </label>
          <div className="filter-note">
            <Icon name="shield" size={20} />
            <strong>Explore at your pace.</strong>
            <p>
              Spoiler warnings help you choose what to read. Change reading
              preferences in the header.
            </p>
          </div>
        </aside>
        <div className="explore-results">
          <div className="results-toolbar">
            <p role="status">
              <strong>{result.total}</strong>{" "}
              {result.total === 1 ? "discovery" : "discoveries"}
              <span> in this collection</span>
            </p>
            <div>
              <select
                aria-label="Sort content"
                value={filter.sort || "latest"}
                onChange={(e) => update("sort", e.target.value)}
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
          {result.total ? (
            <>
              <div className={`card-grid ${list ? "list-view" : ""}`}>
                {result.items.map((c) => (
                  <ContentCard key={c.id} content={c} />
                ))}
              </div>
              <nav className="pagination" aria-label="Results pages">
                <Button
                  variant="secondary"
                  disabled={result.page === 1}
                  onClick={() => update("page", String(result.page - 1))}
                >
                  Previous
                </Button>
                <span>
                  Page {result.page} of {result.pageCount}
                </span>
                <Button
                  variant="secondary"
                  disabled={result.page === result.pageCount}
                  onClick={() => update("page", String(result.page + 1))}
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
      </div>
    </>
  );
}
