import React, { useEffect, useState } from "react";
import { useApp } from "../lib/store";
import { Link } from "../lib/router";
import {
  Icon,
  Button,
  Crumbs,
  ContentCard,
  BookmarkButton,
  Empty,
  Modal,
  Skeleton,
  copyText,
  typeLabels,
} from "../components/ui";
import { ContentMedia } from "../features/catalog/ContentMedia";
import { ContentRating } from "../features/catalog/ContentRating";
import { useContentDetail } from "../features/catalog/hooks";
import { categoryLabel } from "../shared/catalog/taxonomy";

export function RichText({ text }: { text: string }) {
  return (
    <div className="prose">
      {text.split(/\n\s*\n/).map((block, i) => {
        if (block.startsWith("## ")) return <h2 key={i}>{block.slice(3)}</h2>;
        const bits = block.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {bits.map((part, j) =>
              part.startsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                <React.Fragment key={j}>{part}</React.Fragment>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function Detail({ id }: { id: string }) {
  const { spoilerSafe, notify } = useApp();
  const { detail, loading, error, notFound } = useContentDetail(id);
  const [revealed, setRevealed] = useState(false);
  const [gallery, setGallery] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setRevealed(false);
    setGallery(null);
  }, [id]);

  if (loading) {
    return (
      <section className="content-section" aria-label="Loading content detail">
        <Skeleton cards={1} />
      </section>
    );
  }

  if (!detail) {
    return (
      <Empty
        title={notFound ? "This story is unavailable" : "We couldn't load this story"}
        description={
          error ||
          "The content detail service is unavailable. Please try again later."
        }
      >
        <Link className="btn btn-primary" to="/explore">
          Back to Explore
        </Link>
      </Empty>
    );
  }

  const { content, related, rating } = detail;
  const categoryName = categoryLabel(content.categoryId);
  const galleryImages = [content.image, "/art/community.svg", "/art/manga.svg"];

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: content.title, url });
        return;
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
      }
    }
    if (await copyText(url)) notify("Story link copied.");
    else setShareOpen(true);
  };

  return (
    <>
      <Crumbs
        items={[
          { label: "Explore", to: "/explore" },
          {
            label: categoryName,
            to: `/explore?category=${encodeURIComponent(content.categoryId)}`,
          },
          { label: typeLabels[content.type] },
        ]}
      />

      <div className="detail-banner">
        <img
          src={content.image}
          alt={`Original ${content.fandom} concept illustration`}
          width="1280"
          height="900"
        />
        <div className="detail-banner-bottom">
          <span className="pill">{categoryName}</span>
          <span>{content.fandom}</span>
          <span className="pill pill-outline">{typeLabels[content.type]}</span>
        </div>
      </div>

      <div className="detail-layout">
        <article>
          <div className="detail-title">
            <span className="eyebrow">
              {content.status === "draft"
                ? "UNPUBLISHED DRAFT - ADMIN PREVIEW"
                : "FROM THE FAN HUB COLLECTION"}
            </span>
            <h1>{content.title}</h1>
            <p className="detail-deck">{content.description}</p>
            <div className="byline">
              <span className="avatar avatar-small">FH</span>
              <span>
                <strong>{content.author}</strong>
                <br />
                <small>
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeZone: "Asia/Ho_Chi_Minh",
                  }).format(new Date(content.publishedAt))}{" "}
                  / {content.duration}
                </small>
              </span>
              <button
                className="icon-btn"
                type="button"
                onClick={share}
                aria-label="Share this story"
              >
                <Icon name="share" />
              </button>
            </div>
          </div>

          <ContentMedia
            content={content}
            galleryImages={galleryImages}
            onOpenGallery={setGallery}
          />

          {content.spoiler && spoilerSafe && !revealed ? (
            <div className="spoiler-gate">
              <Icon name="shield" size={38} />
              <h2>A little heads-up.</h2>
              <p>
                This section discusses a story reveal. Your spoiler-safe
                preference is on.
              </p>
              <Button variant="secondary" onClick={() => setRevealed(true)}>
                I'm ready - reveal this section
              </Button>
            </div>
          ) : (
            <RichText text={content.body} />
          )}

          <div className="tag-list">
            {content.tags.map((tag) => (
              <span className="chip static-chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <ContentRating contentId={content.id} initial={rating} />
        </article>

        <aside className="detail-sidebar">
          <div className="panel">
            <span className="eyebrow">MAKE ROOM FOR A NEW FAVORITE</span>
            <h2>Keep this world close.</h2>
            <p>
              Save it for later. Add a note. Pick up where curiosity left off.
            </p>
            <BookmarkButton content={content} compact={false} />
            <Button variant="ghost" onClick={share}>
              <Icon name="share" size={17} />
              Share this discovery
            </Button>
          </div>

          <div className="panel source-panel">
            <Icon name="shield" size={24} />
            <h3>Know what you're reading</h3>
            <p>
              {content.sourceLabel}. This entry is for interface testing, not a
              verified reference about a real franchise.
            </p>
            <Link to="/privacy" className="small-link">
              Content & privacy notes <Icon name="arrow" size={13} />
            </Link>
          </div>

          <Link
            to={`/explore?fandom=${encodeURIComponent(content.fandom)}`}
            className="world-callout"
          >
            <span>MORE FROM</span>
            <h3>{content.fandom}</h3>
            <Icon name="arrow" />
          </Link>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="content-section">
          <div className="section-heading">
            <h2>
              Stay a little longer<span className="accent">.</span>
            </h2>
            <Link
              to={`/explore?category=${encodeURIComponent(content.categoryId)}`}
              className="text-link"
            >
              Explore this world <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="card-grid">
            {related.map((item) => (
              <ContentCard content={item} key={item.id} />
            ))}
          </div>
        </section>
      )}

      <Modal
        title="Concept gallery"
        open={gallery !== null}
        onClose={() => setGallery(null)}
        wide
      >
        {gallery !== null && (
          <>
            <img
              className="lightbox-image"
              src={galleryImages[gallery]}
              alt={`Original concept study ${gallery + 1}`}
            />
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setGallery((gallery + 2) % galleryImages.length)}
              >
                Previous
              </Button>
              <span>
                {gallery + 1} / {galleryImages.length}
              </span>
              <Button
                onClick={() => setGallery((gallery + 1) % galleryImages.length)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title="Share this discovery"
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      >
        <label className="field">
          <span>Copy this address</span>
          <input
            readOnly
            value={window.location.href}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      </Modal>
    </>
  );
}
