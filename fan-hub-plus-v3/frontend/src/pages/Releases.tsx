import React, { useState } from "react";
import { useApp } from "../lib/store";
import { Link } from "../lib/router";
import { PageHeading, Crumbs, Notice, Icon, Empty } from "../components/ui";
export default function Releases() {
  const { db } = useApp();
  const [category, setCategory] = useState("");
  if (!db) return null;
  const releases = db.contents
    .filter(
      (c) =>
        c.status === "published" &&
        c.releaseDate &&
        (!category || c.categoryId === category),
    )
    .sort((a, b) => a.releaseDate!.localeCompare(b.releaseDate!));
  return (
    <>
      <Crumbs items={[{ label: "Release calendar" }]} />
      <PageHeading
        eyebrow="SOMETHING TO LOOK FORWARD TO"
        title="The next chapter."
        description="A cross-fandom release calendar for stories, screens, games and collectibles."
      />
      <Notice>
        These are fictional October 2026 release fixtures, not current
        entertainment news or real pre-orders. Dates are supplied by demo
        content editors.
      </Notice>
      <div className="category-tabs" aria-label="Filter releases">
        {[{ id: "", name: "All worlds" }, ...db.categories].map((c) => (
          <button
            type="button"
            key={c.id}
            className={c.id === category ? "active" : ""}
            onClick={() => setCategory(c.id)}
            aria-pressed={c.id === category}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="release-timeline">
        {releases.length ? (
          releases.map((c) => (
            <article className="release-row" key={c.id}>
              <div className="release-date">
                <span>
                  {new Date(c.releaseDate! + "T12:00:00Z").toLocaleDateString(
                    "en-US",
                    { month: "short", timeZone: "UTC" },
                  )}
                </span>
                <strong>{c.releaseDate?.slice(8)}</strong>
                <small>{c.releaseDate?.slice(0, 4)}</small>
              </div>
              <img src={c.image} alt="" />
              <div>
                <span className="eyebrow">
                  {db.categories.find((x) => x.id === c.categoryId)?.name} /{" "}
                  {c.fandom}
                </span>
                <h2>
                  <Link to={"/content/" + c.id}>{c.title}</Link>
                </h2>
                <p className="muted">{c.description}</p>
                <div className="tag-list">
                  {c.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                to={"/content/" + c.id}
                className="icon-btn"
                aria-label={"View " + c.title}
              >
                <Icon name="arrow" />
              </Link>
            </article>
          ))
        ) : (
          <Empty
            icon="calendar"
            title="No release fixtures in this category"
            description="Try another world or add a release date in the admin content editor."
          />
        )}
      </div>
    </>
  );
}
