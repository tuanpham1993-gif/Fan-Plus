import React, { useMemo, useState } from "react";
import type { Content } from "../../domain/types";
import { Icon, Notice } from "../../components/ui";

function safeMediaSource(value?: string) {
  const candidate = value?.trim();
  if (!candidate) return "";

  try {
    // document.baseURI also works in the offline UI harness, where the page
    // itself is about:blank but the application has an explicit <base>.
    const base = new URL(document.baseURI);
    const parsed = new URL(candidate, base);
    const sameOrigin = parsed.origin === base.origin;
    if (parsed.username || parsed.password) return "";
    if (sameOrigin && (parsed.protocol === "http:" || parsed.protocol === "https:")) {
      return candidate;
    }
    if (parsed.protocol === "https:") return parsed.href;
  } catch {
    return "";
  }

  return "";
}

function videoMime(src: string) {
  const clean = src.split(/[?#]/)[0].toLowerCase();
  if (clean.endsWith(".mp4")) return "video/mp4";
  if (clean.endsWith(".ogv") || clean.endsWith(".ogg")) return "video/ogg";
  if (clean.endsWith(".webm")) return "video/webm";
  return undefined;
}

export function ContentMedia({
  content,
  galleryImages,
  onOpenGallery,
}: {
  content: Content;
  galleryImages: string[];
  onOpenGallery: (index: number) => void;
}) {
  const [mediaError, setMediaError] = useState(false);
  const mediaUrl = useMemo(
    () => safeMediaSource(content.mediaUrl),
    [content.mediaUrl],
  );

  if (content.type === "article") return null;

  if (content.type === "character") {
    return (
      <div className="character-facts">
        <div>
          <span>Universe</span>
          <strong>{content.fandom}</strong>
        </div>
        <div>
          <span>Genre</span>
          <strong>{content.genre}</strong>
        </div>
        <div>
          <span>Demo year</span>
          <strong>{content.year}</strong>
        </div>
      </div>
    );
  }

  if (content.type === "video") {
    return (
      <>
        {mediaUrl ? (
          <div className="media-player">
            <video
              key={content.id}
              controls
              preload="metadata"
              poster={content.image}
              onError={() => setMediaError(true)}
            >
              <source
                src={mediaUrl}
                type={videoMime(mediaUrl)}
                onError={() => setMediaError(true)}
              />
              <track
                kind="captions"
                src="/media/portal.vtt"
                srcLang="en"
                label="English"
                default
              />
              Your browser does not support this video.
            </video>
            <p className="caption">
              Original demo animation. Captions are available when supplied by
              the content package.
            </p>
          </div>
        ) : (
          <Notice kind="error">
            This video does not have a safe playable media URL.
          </Notice>
        )}
        {mediaError && (
          <Notice kind="error">
            The media could not load. Check the media URL and try again.
          </Notice>
        )}
      </>
    );
  }

  if (content.type === "audio") {
    return (
      <>
        {mediaUrl ? (
          <div className="audio-player">
            <span className="audio-icon">
              <Icon name="music" size={38} />
            </span>
            <div>
              <h2>{content.title}</h2>
              <audio
                controls
                preload="metadata"
                src={mediaUrl}
                onError={() => setMediaError(true)}
              >
                Your browser does not support audio.
              </audio>
              <p className="caption">
                Audio is loaded only from a same-origin or HTTPS source.
              </p>
            </div>
          </div>
        ) : (
          <Notice kind="error">
            This audio entry does not have a safe playable media URL.
          </Notice>
        )}
        {mediaError && (
          <Notice kind="error">
            The media could not load. Check the media URL and try again.
          </Notice>
        )}
      </>
    );
  }

  if (content.type === "gallery" || content.type === "merchandise") {
    return (
      <>
        <h2 className="section-small-title">A closer look</h2>
        <div className="gallery-grid">
          {galleryImages.map((src, index) => (
            <button
              type="button"
              key={`${src}-${index}`}
              className="gallery-item"
              onClick={() => onOpenGallery(index)}
              aria-label={`Open concept image ${index + 1}`}
            >
              <img
                src={src}
                alt={`Original concept study ${index + 1}`}
                width="640"
                height="450"
              />
              <span>
                <Icon name="plus" size={18} />
              </span>
            </button>
          ))}
        </div>
        {content.type === "merchandise" && (
          <Notice>
            This is a fictional showcase concept. There is no purchase,
            payment, preorder transaction or delivery service.
          </Notice>
        )}
      </>
    );
  }

  return null;
}
