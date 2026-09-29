import React from "react";
import type { Content } from "../../domain/types";
import { Icon } from "../../components/ui";

export function RemainingImages({
  content,
  galleryImages,
  onOpenGallery,
}: {
  content: Content;
  galleryImages: string[];
  onOpenGallery: (index: number) => void;
}) {
  const remainingImages = galleryImages.slice(1);

  if (remainingImages.length === 0) {
    return null;
  }

  return (
    <section className="remaining-images">
      <h2 className="section-small-title">More images</h2>

      <div className="gallery-grid">
        {remainingImages.map((src, index) => {
          const galleryIndex = index + 1;

          return (
            <button
              type="button"
              key={`${src}-${galleryIndex}`}
              className="gallery-item"
              onClick={() => onOpenGallery(galleryIndex)}
              aria-label={`Open image ${galleryIndex + 1}`}
            >
              <img
                src={src}
                alt={`${content.title} image ${galleryIndex + 1}`}
                width="640"
                height="450"
              />

              <span>
                <Icon name="plus" size={18} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}