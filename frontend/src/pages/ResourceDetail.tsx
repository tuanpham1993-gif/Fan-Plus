import React, { useEffect, useState } from "react";
import { Link } from "../lib/router";
import {
  resourceApi,
  imageSource,
  type CategoryRecord,
  type CharacterRecord,
  type MerchandiseRecord,
} from "../features/resources/api";
import { Crumbs, Empty, Icon, Notice, PageHeading, Skeleton } from "../components/ui";

export default function ResourceDetail({
  kind,
  id,
}: {
  kind: "character" | "merchandise";
  id: number;
}) {
  const [item, setItem] = useState<CharacterRecord | MerchandiseRecord | null>(null);
  const [category, setCategory] = useState<CategoryRecord | null>(null);
  const [character, setCharacter] = useState<CharacterRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const title = kind === "character" ? "Character detail" : "Merchandise detail";

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const load = async () => {
      try {
        const [resource, categories] = await Promise.all([
          kind === "character"
            ? resourceApi.character(id, controller.signal)
            : resourceApi.merchandiseItem(id, controller.signal),
          resourceApi.categories(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setItem(resource);
        setCategory(categories.find((entry) => entry.category_id === resource.category_id) || null);
        if (kind === "merchandise") {
          const merchandise = resource as MerchandiseRecord;
          setCharacter(merchandise.character_id
            ? await resourceApi.character(merchandise.character_id, controller.signal).catch(() => null)
            : null);
        } else setCharacter(null);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : `${title} could not be loaded.`);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [id, kind]);

  if (loading) return <section className="content-section" aria-label={`Loading ${title}`}><Skeleton cards={1} /></section>;
  if (!item) {
    return <Empty title={error.toLowerCase().includes("not found") ? `${title} unavailable` : `Could not load ${title.toLowerCase()}`} description={error || "The requested item is not available."}>
      <Link className="btn btn-secondary" to={kind === "character" ? "/characters" : "/merchandise"}>Back to {kind === "character" ? "characters" : "merchandise"}</Link>
    </Empty>;
  }

  const isCharacter = kind === "character";
  const characterItem = item as CharacterRecord;
  const merchandiseItem = item as MerchandiseRecord;
  const backTo = isCharacter ? "/characters" : "/merchandise";
  const categoryUrl = `${backTo}?category_id=${item.category_id}`;

  return (
    <>
      <Crumbs items={[
        { label: "Categories", to: "/categories" },
        { label: category?.name || `Category ${item.category_id}`, to: categoryUrl },
        { label: isCharacter ? characterItem.name : merchandiseItem.name },
      ]} />
      <div className="resource-detail">
        <div
          className="resource-detail-art"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty("--zoom-x", `${x}%`);
            e.currentTarget.style.setProperty("--zoom-y", `${y}%`);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.removeProperty("--zoom-x");
            e.currentTarget.style.removeProperty("--zoom-y");
          }}
        >
          <img src={imageSource(item.image_url)} alt={item.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/art/community.svg"; }} />
        </div>
        <article className="panel resource-detail-content">
          <span className="eyebrow">{category?.name || `Category ${item.category_id}`}</span>
          <h1>{item.name}</h1>
          {!isCharacter && (
            <div className="resource-detail-meta">
              {merchandiseItem.tag && <span className="chip static-chip">{merchandiseItem.tag}</span>}
              <span className={`chip static-chip ${merchandiseItem.is_upcoming ? "upcoming-chip" : ""}`}>
                {merchandiseItem.is_upcoming ? "Upcoming" : "Not upcoming"}
              </span>
            </div>
          )}
          {isCharacter ? (
            <p className="resource-detail-bio">{characterItem.bio || "No biography has been added yet."}</p>
          ) : (
            <p className="resource-detail-bio">{character ? <>Character: <Link to={`/characters/${character.character_id}`}>{character.name}</Link></> : merchandiseItem.character_id ? `Character #${merchandiseItem.character_id}` : "No character linked."}</p>
          )}
          {error && <Notice>{error}</Notice>}
          <div className="resource-actions">
            <Link className="btn btn-secondary" to={categoryUrl}><Icon name="arrow" size={15} /> More in this category</Link>
            <Link className="btn btn-ghost" to={backTo}>Back to {isCharacter ? "characters" : "merchandise"}</Link>
          </div>
        </article>
      </div>
    </>
  );
}
