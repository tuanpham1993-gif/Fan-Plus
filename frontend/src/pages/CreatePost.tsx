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
    formData.append("content_type", "ARTICLE");
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
    {/* Header */}
    <header className="create-post-header">
      <div className="create-post-heading">
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
    </header>

    <form
      onSubmit={handleSubmit}
      className="create-post-form"
    >
      {error && (
        <div
          className="form-error"
          role="alert"
        >
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
          placeholder="Give your post a title..."
        />
      </div>

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
        <div className="form-field-header">
          <label htmlFor="post-body">
            Your post
          </label>

          <span className="form-field-hint">
            Share your thoughts, ideas, or discoveries
          </span>
        </div>

        <textarea
          id="post-body"
          value={body}
          onChange={(event) =>
            setBody(event.target.value)
          }
          placeholder="What would you like to share with the community?"
          rows={9}
        />
      </div>

      <div className="form-field">
        <label htmlFor="post-media">
          Media
        </label>

        <label
          htmlFor="post-media"
          className="create-post-upload"
        >
          <span className="create-post-upload-icon">
            <Icon name="plus" size={22} />
          </span>

          <span className="create-post-upload-content">
            <strong>
              Add images or videos
            </strong>

            <small>
              You can select multiple files
            </small>
          </span>
        </label>

        <input
          id="post-media"
          className="create-post-file-input"
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
          <div className="create-post-file-count">
            <Icon name="check" size={15} />

            <span>
              {files.length} file
              {files.length > 1 ? "s" : ""} selected
            </span>
          </div>
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