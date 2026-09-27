import React, { useEffect, useMemo, useState } from "react";
import { useLocation, navigate, Link } from "../lib/router";
import { useAuth } from "../features/auth/AuthProvider";
import {
  resourceApi,
  imageSource,
  type CategoryRecord,
  type CharacterRecord,
  type ResourcePage,
} from "../features/resources/api";
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

const EMPTY_PAGE: ResourcePage<CharacterRecord> = {
  items: [], page: 1, limit: 10, total: 0, pages: 1,
};

function positiveInt(value: string | null, fallback: number) {
  const number = Number.parseInt(value || "", 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export default function Characters() {
  const { params, search, pathname } = useLocation();
  const { user } = useAuth();
  const query = useMemo(() => ({
    search: params.get("search") || "",
    categoryId: params.get("category_id") || "",
    page: positiveInt(params.get("page"), 1),
  }), [search]);
  const [searchInput, setSearchInput] = useState(query.search);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [result, setResult] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CharacterRecord | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const canManage = Boolean(user);

  useEffect(() => setSearchInput(query.search), [query.search]);

  useEffect(() => {
    const controller = new AbortController();
    void resourceApi.categories(controller.signal).then(setCategories).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const category = Number.parseInt(query.categoryId, 10);
    void resourceApi.characters({
      search: query.search || undefined,
      category_id: Number.isFinite(category) ? category : undefined,
      page: query.page,
      limit: 10,
    }, controller.signal).then((page) => {
      setResult(page);
    }).catch((cause) => {
      if (!controller.signal.aborted) {
        setResult(EMPTY_PAGE);
        setError(cause instanceof Error ? cause.message : "Characters could not be loaded.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [query, reloadKey]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(search);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.delete("page");
    navigate(pathname + (next.size ? `?${next.toString()}` : ""));
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setBio("");
    setCategoryId(query.categoryId || String(categories[0]?.category_id || ""));
    setImage(null);
    setFormError("");
    setEditorOpen(true);
  };

  const openEdit = (character: CharacterRecord) => {
    setEditing(character);
    setName(character.name);
    setBio(character.bio || "");
    setCategoryId(String(character.category_id));
    setImage(null);
    setFormError("");
    setEditorOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    const body = new FormData();
    body.append("category_id", categoryId);
    body.append("name", name.trim());
    body.append("bio", bio);
    if (image) body.append("image", image);
    try {
      await resourceApi.saveCharacter(editing?.character_id ?? null, body);
      setEditorOpen(false);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Character could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (character: CharacterRecord) => {
    if (!window.confirm(`Delete “${character.name}”?`)) return;
    try {
      await resourceApi.deleteCharacter(character.character_id);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Character could not be deleted.");
    }
  };

  return (
    <>
      <Crumbs items={[{ label: "Categories", to: "/categories" }, { label: "Characters" }]} />
      <PageHeading eyebrow="MEET THE CHARACTERS" title="Characters" description="Discover the people and personalities behind each world." >
        {canManage && <Button onClick={openCreate}><Icon name="plus" size={17} /> Add Character</Button>}
      </PageHeading>

      <div className="explore-search">
        <form className="search-box" onSubmit={(event) => { event.preventDefault(); update("search", searchInput.trim()); }}>
          <Icon name="search" />
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} aria-label="Search characters" placeholder="Search characters..." />
          <Button type="submit" className="btn-small">Search <Icon name="arrow" size={15} /></Button>
        </form>
      </div>
      <div className="resource-filter-row">
        <Field label="Category">
          <select value={query.categoryId} onChange={(event) => update("category_id", event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}
          </select>
        </Field>
        <Link className="small-link" to="/categories">Browse categories <Icon name="arrow" size={13} /></Link>
      </div>

      {error && <Notice kind="error">{error}</Notice>}
      {!error && <div className="results-toolbar"><p role="status"><strong>{loading ? "..." : result.total}</strong> characters</p></div>}
      {loading ? <Skeleton cards={6} /> : error ? (
        <Empty title="Characters could not be loaded." description={error}><Button onClick={() => setReloadKey((key) => key + 1)}>Try again</Button></Empty>
      ) : result.total ? (
        <>
          <div className="card-grid resource-grid">
            {result.items.map((character) => (
              <article className="content-card resource-card" key={character.character_id}>
                <Link className="card-art" to={`/characters/${character.character_id}`} aria-label={`View ${character.name}`}>
                  <img src={imageSource(character.image_url)} alt={character.name} width="640" height="450" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/art/community.svg"; }} />
                  <span className="type-badge">Character</span>
                </Link>
                <div className="card-body">
                  <div className="card-meta"><span>{categories.find((category) => category.category_id === character.category_id)?.name || `Category ${character.category_id}`}</span></div>
                  <h3><Link to={`/characters/${character.character_id}`}>{character.name}</Link></h3>
                  <p>{character.bio || "No biography has been added yet."}</p>
                  <div className="resource-actions">
                    <Link className="btn btn-secondary btn-small" to={`/characters/${character.character_id}`}>View detail <Icon name="arrow" size={14} /></Link>
                    {canManage && <>
                      <Button variant="ghost" onClick={() => openEdit(character)} aria-label={`Edit ${character.name}`}><Icon name="edit" size={15} /> Edit</Button>
                      <Button variant="ghost" onClick={() => void remove(character)} aria-label={`Delete ${character.name}`}><Icon name="trash" size={15} /> Delete</Button>
                    </>}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <nav className="pagination" aria-label="Character pages">
            <Button variant="secondary" disabled={result.page <= 1} onClick={() => update("page", String(result.page - 1))}>Previous</Button>
            <span>Page {result.page} of {result.pages}</span>
            <Button variant="secondary" disabled={result.page >= result.pages} onClick={() => update("page", String(result.page + 1))}>Next <Icon name="arrow" size={15} /></Button>
          </nav>
        </>
      ) : (
        <Empty title="No characters found." description="Try a different search or category filter." />
      )}

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editing ? "Edit character" : "Add character"}>
        <form className="stack-form" onSubmit={(event) => void save(event)}>
          <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} required maxLength={150} /></Field>
          <Field label="Category"><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
            <option value="" disabled>Select a category</option>
            {categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}
          </select></Field>
          <Field label="Bio"><textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} /></Field>
          <Field label={editing ? "Replace image (optional)" : "Image (optional)"} hint="JPG, PNG, WEBP; maximum 2 MB."><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} /></Field>
          {formError && <Notice kind="error">{formError}</Notice>}
          <div className="modal-actions"><Button variant="secondary" onClick={() => setEditorOpen(false)}>Cancel</Button><Button type="submit" busy={busy}>{editing ? "Save changes" : "Create character"}</Button></div>
        </form>
      </Modal>
    </>
  );
}
