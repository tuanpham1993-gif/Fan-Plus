import React, { useEffect, useState } from "react";
import { Link } from "../lib/router";
import { useAuth } from "../features/auth/AuthProvider";
import { resourceApi, type CategoryRecord } from "../features/resources/api";
import {
  Button,
  Crumbs,
  Empty,
  Field,
  Icon,
  Modal,
  Notice,
  PageHeading,
  Skeleton,
} from "../components/ui";

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const isAdmin = user?.role === "admin";

  const load = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      setCategories(await resourceApi.categories(signal));
      setError("");
    } catch (cause) {
      if (!signal?.aborted)
        setError(cause instanceof Error ? cause.message : "Categories could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setFormError("");
    setEditorOpen(true);
  };

  const openEdit = (category: CategoryRecord) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description || "");
    setFormError("");
    setEditorOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const body = { name: name.trim(), description: description.trim() || null };
      if (editing) await resourceApi.updateCategory(editing.category_id, body);
      else await resourceApi.createCategory(body);
      setEditorOpen(false);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Category could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (category: CategoryRecord) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return;
    setError("");
    try {
      await resourceApi.deleteCategory(category.category_id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Category could not be deleted.");
    }
  };

  return (
    <>
      <Crumbs items={[{ label: "Explore", to: "/explore" }, { label: "Categories" }]} />
      <PageHeading
        eyebrow="THE DISCOVERY DESK"
        title="Explore categories"
        description="Choose a world, then explore its characters or collectibles."
      >
        {isAdmin && (
          <Button onClick={openCreate}>
            <Icon name="plus" size={17} /> Add Category
          </Button>
        )}
      </PageHeading>

      {error && <Notice kind="error">{error}</Notice>}
      {loading ? (
        <Skeleton cards={6} />
      ) : categories.length ? (
        <div className="card-grid resource-grid">
          {categories.map((category) => (
            <article className="content-card resource-card category-card" key={category.category_id}>
              <div className="resource-category-art">
                <Icon name="globe" size={34} />
              </div>
              <div className="card-body">
                <div className="card-meta"><span>Category {category.category_id}</span></div>
                <h3>{category.name}</h3>
                {category.description && <p>{category.description}</p>}
                <div className="resource-actions">
                  <Link className="btn btn-secondary btn-small" to={`/characters?category_id=${category.category_id}`}>
                    Characters <Icon name="arrow" size={14} />
                  </Link>
                  <Link className="btn btn-secondary btn-small" to={`/merchandise?category_id=${category.category_id}`}>
                    Merchandise <Icon name="arrow" size={14} />
                  </Link>
                </div>
                {isAdmin && (
                  <div className="resource-actions admin-actions">
                    <Button variant="ghost" onClick={() => openEdit(category)}>
                      <Icon name="edit" size={15} /> Edit
                    </Button>
                    <Button variant="ghost" onClick={() => void remove(category)}>
                      <Icon name="trash" size={15} /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="No categories are available." description="Category data could not be found in the backend." />
      )}

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? "Edit category" : "Add category"}
      >
        <form className="stack-form" onSubmit={(event) => void save(event)}>
          <Field label="Name">
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </Field>
          {formError && <Notice kind="error">{formError}</Notice>}
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button type="submit" busy={busy}>{editing ? "Save changes" : "Create category"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
