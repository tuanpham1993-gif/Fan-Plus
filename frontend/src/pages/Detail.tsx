
import React, { useMemo, useState } from "react";
import { Link } from "../lib/router";
import { RemainingImages } from "../features/catalog/RemainingImages";
import {
  Icon,
  Button,
  Crumbs,
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
import { useApp } from "../lib/store";

export function RichText({ text }: { text: string }) {
  return (
    <div className="prose">
      {text.split(/\n\s*\n/).map((block, i) => {
        if (block.startsWith("## ")) {
          return <h2 key={i}>{block.slice(3)}</h2>;
        }

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

function resolveMediaUrl(value?: string) {
  const candidate = value?.trim();

  if (!candidate) return "";

  try {
    if (
      candidate.startsWith("http://") ||
      candidate.startsWith("https://")
    ) {
      return candidate;
    }

    const normalized = candidate.startsWith("/")
      ? candidate
      : `/${candidate}`;

    return `http://127.0.0.1:5000${normalized}`;
  } catch {
    return "";
  }
}

export default function Detail({ id }: { id: string }) {
  const { notify } = useApp();

  const { detail, loading, error, notFound } = useContentDetail(id);

  const [gallery, setGallery] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const content = detail?.content ?? null;

  const galleryImages = useMemo(() => {
    if (!content) return [];

    const mediaList = content.media || [];
    const fromMedia = mediaList
      .filter((item) => item.media_type === "IMAGE")
      .map((item) => resolveMediaUrl(item.media_url))
      .filter(Boolean);

    if (fromMedia.length > 0) return fromMedia;
    return content.image ? [resolveMediaUrl(content.image)].filter(Boolean) : [];
  }, [content]);

  const heroImage =
    galleryImages[0] || content?.image || "/art/community.svg";

  const share = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: content?.title ?? "Fan Hub",
          url,
        });
        return;
      } catch (cause) {
        if (
          cause instanceof Error &&
          cause.name === "AbortError"
        ) {
          return;
        }
      }
    }

    if (await copyText(url)) {
      notify("Story link copied.");
    } else {
      setShareOpen(true);
    }
  };

  if (loading) {
    return (
      <section
        className="content-section"
        aria-label="Loading content detail"
      >
        <Skeleton cards={1} />
      </section>
    );
  }

  if (!detail || !content) {
    return (
      <Empty
        title={
          notFound
            ? "This story is unavailable"
            : "We couldn't load this story"
        }
        description={
          error ||
          "The content detail service is unavailable. Please try again later."
        }
      >
        <Link
          className="btn btn-primary"
          to="/explore"
        >
          Back to Explore
        </Link>
      </Empty>
    );
  }

  const categoryName = content.categoryId
    ? content.categoryId.charAt(0).toUpperCase() + content.categoryId.slice(1)
    : "Community";

  const contentType =
    typeLabels[content.type] ??
    content.type;

  const authorName =
    typeof content.author === "string" && content.author
      ? content.author
      : "Unknown author";

  const publishedDate = content.publishedAt
    ? new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(content.publishedAt))
    : "Unknown date";

  return (
    <>
      <Crumbs
        items={[
          {
            label: "Explore",
            to: "/explore",
          },
          {
            label: categoryName,
            to: `/explore?category=${encodeURIComponent(
              String(content.categoryId),
            )}`,
          },
          {
            label: contentType,
          },
        ]}
      />

      <div className="detail-banner">
        <img
          src={heroImage}
          alt={content.title}
          width="1280"
          height="900"
        />

        <div className="detail-banner-bottom">
          <span className="pill">
            {categoryName}
          </span>

          <span>{contentType}</span>

          <span className="pill pill-outline">
            {content.status}
          </span>
        </div>
      </div>

      <div className="detail-layout">
        <article>
          <div className="detail-title">
            <span className="eyebrow">
              {content.status === "pending"
                ? "PENDING REVIEW"
                : content.status === "rejected"
                  ? "REJECTED CONTENT"
                  : "FROM THE FAN HUB COLLECTION"}
            </span>

            <h1>{content.title}</h1>

            <p className="detail-deck">
              {content.description}
            </p>

            <div className="byline">
              <span className="avatar avatar-small">
                {authorName
                  .slice(0, 2)
                  .toUpperCase()}
              </span>

              <span>
                <strong>{authorName}</strong>

                <br />

                <small>{publishedDate}</small>
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

          <RichText text={content.body} />

          <RemainingImages
            content={content}
            galleryImages={galleryImages}
            onOpenGallery={setGallery}
          />
          <ContentRating
            contentId={String(content.id)}
            initial={detail.rating}
          />
        </article>

        <aside className="detail-sidebar">
          <div className="panel">
            <span className="eyebrow">
              MAKE ROOM FOR A NEW FAVORITE
            </span>

            <h2>Keep this world close.</h2>

            <p>
              Save it for later. Add a note. Pick up
              where curiosity left off.
            </p>

            <BookmarkButton
              content={content}
              compact={false}
            />

            <Button
              variant="ghost"
              onClick={share}
            >
              <Icon name="share" size={17} />
              Share this discovery
            </Button>
          </div>

          <div className="panel source-panel">
            <Icon name="shield" size={24} />

            <h3>Know what you're reading</h3>

            <p>
              Fan Hub Content. This entry is from the
              catalog dataset.
            </p>

            <Link
              to="/privacy"
              className="small-link"
            >
              Content & privacy notes{" "}
              <Icon name="arrow" size={13} />
            </Link>
          </div>

          <Link
            to={`/explore?category=${encodeURIComponent(
              String(content.categoryId),
            )}`}
            className="world-callout"
          >
            <span>MORE FROM</span>

            <h3>{categoryName}</h3>

            <Icon name="arrow" />
          </Link>
        </aside>
      </div>

      {galleryImages.length > 0 && (
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
                alt={`Content image ${gallery + 1}`}
              />

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setGallery(
                      (gallery +
                        galleryImages.length -
                        1) %
                      galleryImages.length,
                    )
                  }
                >
                  Previous
                </Button>

                <span>
                  {gallery + 1} / {galleryImages.length}
                </span>

                <Button
                  onClick={() =>
                    setGallery(
                      (gallery + 1) %
                      galleryImages.length,
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}

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
            onFocus={(event) =>
              event.currentTarget.select()
            }
          />
        </label>
      </Modal>
    </>
  );
}
