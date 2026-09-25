import React, { useEffect, useRef, useState, useId } from "react";
import { Link, navigate, currentPath } from "../lib/router";
import { useApp } from "../lib/store";
import { repository } from "../services/repository";
import type { Content } from "../domain/types";
const paths: Record<string, React.ReactNode> = {
  chat: (
    <>
      <path d="M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 17-5Z" />
      <path d="M8 10h8m-8 4h5" />
    </>
  ),
  like: (
    <>
      <path d="M8 10 12 3c2 0 3 1 2 5h5c2 0 3 2 2 4l-2 7H8Z" />
      <path d="M3 10h5v10H3Z" />
    </>
  ),
  flag: (
    <>
      <path d="M5 22V3c5-4 9 4 15 0v10c-6 4-10-4-15 0" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z" />
      <path d="M15 5v3m0 3v2m0 3v3" />
    </>
  ),
  expand: <path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5" />,
  arrow: (
    <>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z" />
      <path d="m20 2 .7 2.3L23 5l-2.3.7L20 8l-.7-2.3L17 5l2.3-.7Z" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7 7h10c3 0 5 10 3 11-2 1-4-3-5-3H9c-1 0-3 4-5 3S4 7 7 7Z" />
      <path d="M8 9v5m-2.5-2.5h5M16 10h.01M18 13h.01" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4m10 0h4M3 15h4m10 0h4" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="m8 2 4 4 4-4M9 16h6" />
    </>
  ),
  music: (
    <>
      <path d="M9 17V5l11-2v12M9 8l11-2" />
      <ellipse cx="6" cy="18" rx="3" ry="3" />
      <ellipse cx="17" cy="16" rx="3" ry="3" />
    </>
  ),
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7Z" />,
  book: (
    <>
      <path d="M12 5v16M3 3c4-1 7 1 9 2 2-1 5-3 9-2v16c-4-1-7 1-9 2-2-1-5-3-9-2Z" />
    </>
  ),
  mask: (
    <>
      <path d="M3 5c3 2 5 2 9 0 4 2 6 2 9 0v6c0 5-4 9-9 11-5-2-9-6-9-11Z" />
      <path d="m6 10 3 1m6 0 3-1m-9 6h6" />
    </>
  ),
  bookmark: <path d="M6 3h12v19l-6-4-6 4Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2" />
    </>
  ),
  moon: <path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m4 12 5 5L20 6" />,
  play: <path d="m8 4 13 8-13 8Z" />,
  star: (
    <path d="m12 2 3 6.5 7 .8-5.1 5 1.3 7-6.2-3.5-6.2 3.5 1.3-7L2 9.3l7-.8Z" />
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="17" rx="2" />
      <path d="M7 2v6m10-6v6M3 11h18m-13 4h2m4 0h2m-8 4h2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  list: <path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01" />,
  filter: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="10" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M2 20v-2a7 7 0 0 1 14 0v2m0-16a3 3 0 0 1 0 6m3 4c2 1 3 3 3 6" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  share: (
    <>
      <circle cx="5" cy="12" r="3" />
      <circle cx="19" cy="5" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path d="m8 11 8-5m-8 7 8 5" />
    </>
  ),
  edit: (
    <>
      <path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2" />
    </>
  ),
  logout: (
    <>
      <path d="M9 3H3v18h6m4-5 4-4-4-4m-5 4h14" />
    </>
  ),
  heart: (
    <path d="M12 21S1 14 2 7c1-6 8-6 10-1 2-5 9-5 10 1 1 7-10 14-10 14Z" />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10h.01" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7m0-7L11 13M10 3H3v18h18v-7" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Zm0 0L11 13" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 3h10v8a5 5 0 0 1-10 0Zm10 2h4v3a5 5 0 0 1-4 5M7 5H3v3a5 5 0 0 0 4 5M12 16v5m-5 0h10" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="3" />
      <path d="M12 9V5m0 0a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 12 5ZM2 13h2m16 0h2" />
      <circle cx="9" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M9.5 18h5" />
    </>
  ),
};
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: string;
  size?: number;
} & React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.sparkles}
    </svg>
  );
}
export function Button({
  children,
  variant = "primary",
  busy = false,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={busy || props.disabled}
      className={`btn btn-${variant} ${className}`}
      aria-busy={busy || undefined}
    >
      {busy ? <span className="spinner" /> : null}
      {children}
    </button>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}
export function Crumbs({
  items,
}: {
  items: {
    label: string;
    to?: string;
  }[];
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {items.map((i, n) => (
        <React.Fragment key={n}>
          <Icon name="chevron" size={12} />
          {i.to ? (
            <Link to={i.to}>{i.label}</Link>
          ) : (
            <span aria-current="page">{i.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
export function Empty({
  icon = "search",
  title,
  description,
  children,
}: {
  icon?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={30} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Skeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="card-grid" aria-label="Loading content" aria-busy="true">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {open && children}
    </dialog>
  );
}
export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  description,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="muted">{description}</p>
      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          busy={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
              onClose();
            }
          }}
        >
          Confirm action
        </Button>
      </div>
    </Modal>
  );
}
export const typeLabels: Record<string, string> = {
  article: "Story",
  character: "Character",
  video: "Video",
  audio: "Audio",
  gallery: "Gallery",
  merchandise: "Collectible",
};
export function BookmarkButton({
  content,
  compact = true,
}: {
  content: Content;
  compact?: boolean;
}) {
  const { db, user, perform } = useApp();
  const [busy, setBusy] = useState(false);
  const saved = db?.bookmarks.some(
    (b) => b.userId === user?.id && b.contentId === content.id,
  );
  return (
    <button
      type="button"
      className={
        compact
          ? `card-bookmark ${saved ? "saved" : ""}`
          : `btn btn-${saved ? "primary" : "secondary"}`
      }
      disabled={busy}
      aria-pressed={!!saved}
      aria-label={`${saved ? "Remove bookmark" : "Bookmark"}: ${content.title}`}
      onClick={async () => {
        if (!user) {
          navigate("/login?next=" + encodeURIComponent(currentPath()));
          return;
        }
        setBusy(true);
        await perform(
          () => repository.toggleBookmark(content.id),
          saved ? "Removed from your collection." : "Saved to your collection.",
        );
        setBusy(false);
      }}
    >
      <Icon name="bookmark" size={18} fill={saved ? "currentColor" : "none"} />
      {!compact && (saved ? "Saved" : "Save to collection")}
    </button>
  );
}
export function ContentCard({
  content,
  reason,
}: {
  content: Content;
  reason?: string;
}) {
  const { db, spoilerSafe } = useApp();
  const cat = db?.categories.find((c) => c.id === content.categoryId);
  return (
    <article className="content-card" data-testid="content-card">
      <div className="card-art">
        <Link to={"/content/" + content.id} tabIndex={-1} aria-hidden="true">
          <img
            src={content.image}
            alt=""
            width="640"
            height="450"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/art/community.svg";
            }}
          />
        </Link>
        <span className="type-badge">
          <Icon
            name={
              content.type === "video"
                ? "play"
                : content.type === "audio"
                  ? "music"
                  : content.type === "character"
                    ? "user"
                    : "book"
            }
            size={12}
          />
          {typeLabels[content.type]}
        </span>
        <BookmarkButton content={content} />
        {content.spoiler && spoilerSafe && (
          <span className="spoiler-badge">
            <Icon name="shield" size={12} />
            Spoiler flagged
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span style={{ color: cat?.color }}>{cat?.name || "Community"}</span>
          <span className="dot" />
          <span>{content.fandom}</span>
        </div>
        <h3>
          <Link to={"/content/" + content.id}>{content.title}</Link>
        </h3>
        <p>{content.description}</p>
        <div className="card-bottom">
          <span>
            <Icon name="clock" size={13} />
            {content.duration}
          </span>
          <span title="Editorial score from the fictional demo dataset">
            <Icon name="star" size={13} />
            {content.rating > 0 ? content.rating.toFixed(1) : "New"}
          </span>
        </div>
        {reason && (
          <div className="recommend-reason">
            <Icon name="sparkles" size={12} />
            {reason}
          </div>
        )}
      </div>
    </article>
  );
}
export function Gate({
  admin = false,
  children,
}: {
  admin?: boolean;
  children: React.ReactNode;
}) {
  const { user } = useApp();
  if (!user)
    return (
      <Empty
        icon="lock"
        title="Your own corner of the universe"
        description="Sign in to save discoveries, personalize your profile and share your stories."
      >
        <Link
          className="btn btn-primary"
          to={"/login?next=" + encodeURIComponent(currentPath())}
        >
          Sign in <Icon name="arrow" />
        </Link>
      </Empty>
    );
  if (admin && user.role !== "admin")
    return (
      <Empty
        icon="shield"
        title="Admin access required"
        description="This demo account does not have permission to open the editorial workspace."
      >
        <Link className="btn btn-secondary" to="/dashboard">
          Back to your dashboard
        </Link>
      </Empty>
    );
  return <>{children}</>;
}
export function Notice({
  children,
  kind = "info",
}: {
  children: React.ReactNode;
  kind?: string;
}) {
  return (
    <div className={`notice notice-${kind}`}>
      <Icon name={kind === "success" ? "check" : "info"} size={18} />
      <div>{children}</div>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  const uid = useId(),
    controlId = "field-" + uid,
    hintId = controlId + "-hint";
  let assigned = false;
  const attach = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;
    const element = node as React.ReactElement<{
      id?: string;
      children?: React.ReactNode;
      "aria-describedby"?: string;
    }>;
    if (
      !assigned &&
      typeof element.type === "string" &&
      ["input", "select", "textarea"].includes(element.type)
    ) {
      assigned = true;
      return React.cloneElement(element, {
        id: controlId,
        "aria-describedby": hint ? hintId : element.props["aria-describedby"],
      });
    }
    return element.props.children
      ? React.cloneElement(element, {
          children: React.Children.map(element.props.children, attach),
        })
      : element;
  };
  return (
    <div className="field">
      <label className="field-label" htmlFor={controlId}>
        {label}
      </label>
      {React.Children.map(children, attach)}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  return false;
}
export function downloadFile(
  name: string,
  content: string,
  mime = "text/plain",
) {
  const blob = new Blob([content], { type: mime }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
