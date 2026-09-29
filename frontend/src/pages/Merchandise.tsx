import React, { useEffect, useMemo, useState } from "react";
import { useLocation, navigate, Link } from "../lib/router";
import { useAuth } from "../features/auth/AuthProvider";
import {
  resourceApi,
  imageSource,
  type CategoryRecord,
  type CharacterRecord,
  type MerchandiseRecord,
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

const TAGS = ["Limited Edition", "Pre-Order", "Collectible"] as const;
const EMPTY_PAGE: ResourcePage<MerchandiseRecord> = {
  items: [], page: 1, limit: 10, total: 0, pages: 1,
};

const DRAFT_KEY = "merch_draft";
interface MerchDraft {
  name: string;
  categoryId: string;
  characterId: string;
  tag: string;
  upcoming: boolean;
}
function saveDraft(draft: MerchDraft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* quota */ }
}
function loadDraft(): MerchDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as MerchDraft) : null;
  } catch { return null; }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
}

function positiveInt(value: string | null, fallback: number) {
  const number = Number.parseInt(value || "", 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export default function Merchandise() {
  const { params, search, pathname } = useLocation();
  const { user } = useAuth();
  const query = useMemo(() => ({
    search: params.get("search") || "",
    categoryId: params.get("category_id") || "",
    characterId: params.get("character_id") || "",
    tag: params.get("tag") || "",
    upcoming: params.get("is_upcoming") || "",
    page: positiveInt(params.get("page"), 1),
  }), [search]);
  const [searchInput, setSearchInput] = useState(query.search);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [characterOptions, setCharacterOptions] = useState<CharacterRecord[]>([]);
  const [result, setResult] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MerchandiseRecord | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [tag, setTag] = useState("");
  const [upcoming, setUpcoming] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const canManage = user?.role === "admin";

  useEffect(() => setSearchInput(query.search), [query.search]);

  useEffect(() => {
    const controller = new AbortController();
    void resourceApi.categories(controller.signal).then(setCategories).catch(() => undefined);
    void resourceApi.characters({ page: 1, limit: 1000 }, controller.signal)
      .then((page) => setCharacterOptions(page.items))
      .catch(() => setCharacterOptions([]));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const category = Number.parseInt(query.categoryId, 10);
    const character = Number.parseInt(query.characterId, 10);
    void resourceApi.merchandise({
      search: query.search || undefined,
      category_id: Number.isFinite(category) ? category : undefined,
      character_id: Number.isFinite(character) ? character : undefined,
      tag: query.tag || undefined,
      is_upcoming: query.upcoming === "true" ? true : query.upcoming === "false" ? false : undefined,
      page: query.page,
      limit: 10,
    }, controller.signal).then(setResult).catch((cause) => {
      if (!controller.signal.aborted) {
        setResult(EMPTY_PAGE);
        setError(cause instanceof Error ? cause.message : "Merchandise could not be loaded.");
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

  const setCategoryFilter = (value: string) => {
    const next = new URLSearchParams(search);
    value ? next.set("category_id", value) : next.delete("category_id");
    next.delete("character_id");
    next.delete("page");
    navigate(pathname + (next.size ? `?${next.toString()}` : ""));
  };

  const filteredCharacters = useMemo(() => {
    const category = Number.parseInt(categoryId, 10);
    return characterOptions.filter((character) =>
      !categoryId || character.category_id === category,
    );
  }, [characterOptions, categoryId]);

  const openCreate = () => {
    setEditing(null);
    const draft = loadDraft();
    if (draft) {
      setName(draft.name);
      setCategoryId(draft.categoryId || query.categoryId || String(categories[0]?.category_id || ""));
      setCharacterId(draft.characterId);
      setTag(draft.tag);
      setUpcoming(draft.upcoming);
    } else {
      setName("");
      setCategoryId(query.categoryId || String(categories[0]?.category_id || ""));
      setCharacterId("");
      setTag("");
      setUpcoming(false);
    }
    setImage(null);
    setFormError("");
    setEditorOpen(true);
  };

  const openEdit = (item: MerchandiseRecord) => {
    setEditing(item);
    setName(item.name);
    setCategoryId(String(item.category_id));
    setCharacterId(item.character_id === null ? "" : String(item.character_id));
    setTag(item.tag || "");
    setUpcoming(item.is_upcoming);
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
    body.append("is_upcoming", upcoming ? "true" : "false");
    if (characterId) body.append("character_id", characterId);
    if (tag) body.append("tag", tag);
    if (image) body.append("image", image);
    try {
      await resourceApi.saveMerchandise(editing?.item_id ?? null, body);
      clearDraft();
      setEditorOpen(false);
      setReloadKey((key) => key + 1);
    } catch (cause: any) {
      let message = "Merchandise could not be saved.";
      if (cause instanceof Error) {
        message = cause.message;
      } else if (Array.isArray(cause)) {
        message = cause.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
      }
      setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: MerchandiseRecord) => {
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    try {
      await resourceApi.deleteMerchandise(item.item_id);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Merchandise could not be deleted.");
    }
  };

  return (
    <>
      <Crumbs items={[{ label: "Categories", to: "/categories" }, { label: "Merchandise" }]} />
      <PageHeading eyebrow="COLLECTIBLES FROM EVERY WORLD" title="Merchandise" description="Explore collectible highlights, special tags and upcoming items." >
        {canManage && <Button onClick={openCreate}><Icon name="plus" size={17} /> Add Merchandise</Button>}
      </PageHeading>

      <div className="explore-search">
        <form className="search-box" onSubmit={(event) => { event.preventDefault(); update("search", searchInput.trim()); }}>
          <Icon name="search" />
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} aria-label="Search merchandise" placeholder="Search merchandise..." />
          <Button type="submit" className="btn-small">Search <Icon name="arrow" size={15} /></Button>
        </form>
      </div>
      <div className="resource-filters">
        <Field label="Category"><select value={query.categoryId} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}
        </select></Field>
        <Field label="Character"><select value={query.characterId} onChange={(event) => update("character_id", event.target.value)}>
          <option value="">All characters</option>
          {characterOptions.filter((character) => !query.categoryId || character.category_id === Number(query.categoryId)).map((character) => <option key={character.character_id} value={character.character_id}>{character.name}</option>)}
        </select></Field>
        <Field label="Tag"><select value={query.tag} onChange={(event) => update("tag", event.target.value)}>
          <option value="">All tags</option>
          {TAGS.map((value) => <option key={value} value={value}>{value}</option>)}
        </select></Field>
        <Field label="Upcoming"><select value={query.upcoming} onChange={(event) => update("is_upcoming", event.target.value)}>
          <option value="">All items</option><option value="true">Upcoming</option><option value="false">Available / not upcoming</option>
        </select></Field>
      </div>
      <p className="resource-category-link"><Link className="small-link" to="/categories">Browse categories <Icon name="arrow" size={13} /></Link></p>

      {error && <Notice kind="error">{error}</Notice>}
      {!error && <div className="results-toolbar"><p role="status"><strong>{loading ? "..." : result.total}</strong> items</p></div>}
      {loading ? <Skeleton cards={6} /> : error ? (
        <Empty title="Merchandise could not be loaded." description={error}><Button onClick={() => setReloadKey((key) => key + 1)}>Try again</Button></Empty>
      ) : result.total ? (
        <>
          <div className="card-grid resource-grid">
            {result.items.map((item) => {
              const category = categories.find((candidate) => candidate.category_id === item.category_id);
              const character = characterOptions.find((candidate) => candidate.character_id === item.character_id);
              return (
                <article className="content-card resource-card" key={item.item_id}>
                  <Link className="card-art" to={`/merchandise/${item.item_id}`} aria-label={`View ${item.name}`}>
                    <img src={imageSource(item.image_url)} alt={item.name} width="640" height="450" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/art/community.svg"; }} />
                    {item.is_upcoming && <span className="type-badge">Upcoming</span>}
                  </Link>
                  <div className="card-body">
                    <div className="card-meta"><span>{category?.name || `Category ${item.category_id}`}</span>{item.tag && <><span className="dot" /><span>{item.tag}</span></>}</div>
                    <h3><Link to={`/merchandise/${item.item_id}`}>{item.name}</Link></h3>
                    <p>{character ? `Character: ${character.name}` : item.character_id ? `Character #${item.character_id}` : "No character linked."}</p>
                    <div className="resource-actions">
                      <Link className="btn btn-secondary btn-small" to={`/merchandise/${item.item_id}`}>View detail <Icon name="arrow" size={14} /></Link>
                      {canManage && <>
                        <Button variant="ghost" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}><Icon name="edit" size={15} /> Edit</Button>
                        <Button variant="ghost" onClick={() => void remove(item)} aria-label={`Delete ${item.name}`}><Icon name="trash" size={15} /> Delete</Button>
                      </>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <nav className="pagination" aria-label="Merchandise pages">
            <Button variant="secondary" disabled={result.page <= 1} onClick={() => update("page", String(result.page - 1))}>Previous</Button>
            <span>Page {result.page} of {result.pages}</span>
            <Button variant="secondary" disabled={result.page >= result.pages} onClick={() => update("page", String(result.page + 1))}>Next <Icon name="arrow" size={15} /></Button>
          </nav>
        </>
      ) : (
        <Empty title="No merchandise found." description="Try a different search or adjust the filters." />
      )}

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editing ? "Edit merchandise" : "Add merchandise"}>
        <form className="stack-form" onSubmit={(event) => void save(event)}>
          <Field label="Name"><input value={name} onChange={(event) => { setName(event.target.value); if (!editing) saveDraft({ name: event.target.value, categoryId, characterId, tag, upcoming }); }} required maxLength={200} /></Field>
          <Field label="Category"><select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setCharacterId(""); if (!editing) saveDraft({ name, categoryId: event.target.value, characterId: "", tag, upcoming }); }} required>
            <option value="" disabled>Select a category</option>
            {categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}
          </select></Field>
          <Field label="Character (optional)"><select value={characterId} onChange={(event) => { setCharacterId(event.target.value); if (!editing) saveDraft({ name, categoryId, characterId: event.target.value, tag, upcoming }); }}>
            <option value="">No character</option>
            {filteredCharacters.map((character) => <option key={character.character_id} value={character.character_id}>{character.name}</option>)}
          </select></Field>
          <div className="form-row">
            <Field label="Tag"><select value={tag} onChange={(event) => { setTag(event.target.value); if (!editing) saveDraft({ name, categoryId, characterId, tag: event.target.value, upcoming }); }}><option value="">No tag</option>{TAGS.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
            <Field label="Release status"><select value={String(upcoming)} onChange={(event) => { const next = event.target.value === "true"; setUpcoming(next); if (!editing) saveDraft({ name, categoryId, characterId, tag, upcoming: next }); }}><option value="false">Not upcoming</option><option value="true">Upcoming</option></select></Field>
          </div>
          <Field label={editing ? "Replace image (optional)" : "Image (optional)"} hint="JPG, PNG, WEBP; maximum 2 MB."><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} /></Field>
          {formError && <Notice kind="error">{formError}</Notice>}
          <div className="modal-actions"><Button variant="secondary" onClick={() => setEditorOpen(false)}>Cancel</Button><Button type="submit" busy={busy}>{editing ? "Save changes" : "Create merchandise"}</Button></div>
        </form>
      </Modal>
    </>
  );
}
