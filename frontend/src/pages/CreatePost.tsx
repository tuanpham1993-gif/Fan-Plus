import React, { useState } from "react";
import { Button, Icon } from "../components/ui";
import { apiClient } from "../shared/http/client";
const CONTENT_TYPES = [
  { value: "POST", label: "Post" },
  { value: "NEWS", label: "News" },
  { value: "ARTICLE", label: "Article" },
  { value: "EVENT", label: "Event" },
];

interface CreatePostProps {
  onClose: () => void;
}

export default function CreatePost({ onClose }: CreatePostProps) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [contentType, setContentType] = useState("POST");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  setError("");

  if (!title.trim()) {
    setError("Title is required.");
    return;
  }

  if (!categoryId) {
    setError("Please choose a category.");
    return;
  }

  if (!body.trim()) {
    setError("Body is required.");
    return;
  }

  try {
    const formData = new FormData();

    formData.append("title", title.trim());
    formData.append("category_id", categoryId);
    formData.append("content_type", contentType);
    formData.append("body", body.trim());

    files.forEach((file) => {
      formData.append("media", file);
    });

    const data = await apiClient.postForm("/contents", formData);

    console.log("Created content:", data);

    onClose();
  } catch (error) {
    console.error("Create post failed:", error);

    setError(
      error instanceof Error
        ? error.message
        : "Failed to create post."
    );
  }
};
  return (
    <div
      className="create-post-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="create-post-modal">
        <div className="create-post-header">
          <div>
            <span className="create-post-eyebrow">
              CONTENT DESK
            </span>

            <h2 id="create-post-title">
              Create a new post
            </h2>

            <p>
              Share something with the Fan Hub Plus community.
            </p>
          </div>

          <button
            type="button"
            className="create-post-close"
            onClick={onClose}
            aria-label="Close create post form"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="create-post-form"
        >
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="post-title">
              Title
            </label>

            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Enter your post title"
            />
          </div>

          <div className="create-post-row">
            <div className="form-field">
              <label htmlFor="post-category">
                Category
              </label>

              <select
                id="post-category"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
              >
                <option value="">
                  Choose a category
                </option>
                <option value="1">Anime</option>
                <option value="2">Gaming</option>
                <option value="3">Movies</option>
                <option value="4">TV Shows</option>
                <option value="5">K-Pop</option>
                <option value="6">Comics</option>
                <option value="7">Manga</option>
                <option value="8">Cosplay</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="post-type">
                Content type
              </label>

              <select
                id="post-type"
                value={contentType}
                onChange={(event) =>
                  setContentType(event.target.value)
                }
              >
                {CONTENT_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="post-body">
              Body
            </label>

            <textarea
              id="post-body"
              value={body}
              onChange={(event) =>
                setBody(event.target.value)
              }
              placeholder="Write your content here..."
              rows={8}
            />
          </div>

          <div className="form-field">
            <label htmlFor="post-media">
              Media
            </label>

            <input
              id="post-media"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(event) => {
                setFiles(
                  Array.from(event.target.files || [])
                );
              }}
            />

            {files.length > 0 && (
              <p className="create-post-file-count">
                {files.length} file
                {files.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <div className="create-post-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button type="submit">
              Create Post
              <Icon name="arrow" size={15} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}