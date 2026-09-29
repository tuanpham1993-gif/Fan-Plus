import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { eventsDataSource } from "../features/events/dataSource";
import { useEventCategories, useEventDetail } from "../features/events/hooks";
import {
  isoToVnInput,
  type EventDraft,
  type EventItem,
} from "../features/events/api";
import { EVENT_CITIES, cityCenter } from "../features/events/cities";
import { safeExternalUrl } from "../domain/logic";
import { useApp } from "../lib/store";
import { Link, navigate } from "../lib/router";
import { ApiError, serverMode } from "../shared/http/client";
import {
  Button,
  Crumbs,
  Empty,
  Field,
  Gate,
  Icon,
  Notice,
  PageHeading,
  Skeleton,
} from "../components/ui";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

type FieldKey = keyof EventDraft | "image" | "location";
type Errors = Partial<Record<FieldKey, string>>;

/** Maps Flask field names back onto form fields. */
const SERVER_FIELDS: Record<string, FieldKey> = {
  title: "title",
  body: "body",
  category_id: "categoryId",
  city: "city",
  location_name: "venue",
  latitude: "location",
  longitude: "location",
  start_time: "startsAt",
  end_time: "endsAt",
  register_url: "registerUrl",
  image: "image",
};

function nowVnInput() {
  return isoToVnInput(new Date().toISOString());
}

function emptyDraft(): EventDraft {
  return {
    title: "",
    body: "",
    categoryId: "",
    city: "",
    venue: "",
    lat: null,
    lng: null,
    startsAt: "",
    endsAt: "",
    registerUrl: "",
  };
}

function draftFrom(event: EventItem): EventDraft {
  return {
    title: event.title,
    body: event.description,
    categoryId: event.categoryId,
    city: event.city,
    venue: event.venue,
    lat: event.lat,
    lng: event.lng,
    startsAt: isoToVnInput(event.startsAt),
    endsAt: event.endsAt !== event.startsAt ? isoToVnInput(event.endsAt) : "",
    registerUrl: event.ticketUrl || "",
  };
}

export function validateDraft(draft: EventDraft, image: File | null, isNew: boolean): Errors {
  const errors: Errors = {};
  const title = draft.title.trim();
  if (title.length < 3) errors.title = "Give the event a name of at least 3 characters.";
  else if (title.length > 255) errors.title = "Keep the name under 255 characters.";
  if (!draft.body.trim()) errors.body = "Tell fans what to expect.";
  else if (draft.body.length > 5000) errors.body = "Keep the description under 5000 characters.";
  if (!draft.categoryId) errors.categoryId = "Choose a category.";
  if (!draft.city.trim()) errors.city = "Choose or type the city.";
  if (!draft.venue.trim()) errors.venue = "Add the venue or address.";
  if (draft.lat === null || draft.lng === null)
    errors.location = "Use your current location, or pick a listed city so we can place the map pin.";
  if (!draft.startsAt) errors.startsAt = "Choose when the event starts.";
  else if (isNew && draft.startsAt <= nowVnInput())
    errors.startsAt = "The start time must be in the future.";
  if (draft.endsAt && draft.startsAt && draft.endsAt <= draft.startsAt)
    errors.endsAt = "The end time must be after the start time.";
  if (draft.registerUrl.trim() && !safeExternalUrl(draft.registerUrl.trim()))
    errors.registerUrl = "Use a full https:// link.";
  if (image) {
    if (!IMAGE_TYPES.includes(image.type)) errors.image = "Use a JPG, PNG, GIF or WEBP image.";
    else if (image.size > MAX_IMAGE_BYTES) errors.image = "The image must be 5 MB or smaller.";
  }
  return errors;
}

export default function EventForm({ id }: { id?: string }) {
  return (
    <Gate>
      <EventFormBody id={id} />
    </Gate>
  );
}

function EventFormBody({ id }: { id?: string }) {
  const { user } = useAuth();
  const { event, status } = useEventDetail(id);

  if (!serverMode)
    return (
      <Empty
        icon="calendar"
        title="Connect the backend to create events"
        description="The offline demo shows sample events only. Start the Flask backend to create and review real events."
      >
        <Link className="btn btn-primary" to="/events">
          Browse events
        </Link>
      </Empty>
    );

  if (user?.status === "suspended")
    return (
      <Empty
        icon="lock"
        title="Your account cannot create events"
        description="This account is suspended. Contact the Fan Hub team if you think this is a mistake."
      />
    );

  if (!id) return <EventEditor />;
  if (status === "loading" || status === "idle") return <Skeleton cards={1} />;

  const editable =
    event &&
    user &&
    (user.role === "admin" ||
      (event.authorId === String(user.id) && event.status === "pending"));
  if (!event || !editable)
    return (
      <Empty
        icon="lock"
        title="This event can't be edited"
        description="Organizers can edit an event only while it is waiting for review. Administrators can edit any event."
      >
        <Link className="btn btn-primary" to={event ? `/events/${event.id}` : "/events"}>
          Back to event
        </Link>
      </Empty>
    );
  return <EventEditor event={event} />;
}

function EventEditor({ event }: { event?: EventItem }) {
  const { notify } = useApp();
  const { user } = useAuth();
  const { categories, error: categoryError } = useEventCategories();
  const isNew = !event;
  const [draft, setDraft] = useState<EventDraft>(() =>
    event ? draftFrom(event) : emptyDraft(),
  );
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [usingDevice, setUsingDevice] = useState(false);

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : ""), [image]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!draft.categoryId && categories.length && isNew)
      setDraft((d) => ({ ...d, categoryId: categories[0].id }));
  }, [categories]);

  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError("");
  };

  const changeCity = (city: string) => {
    setErrors((e) => ({ ...e, city: undefined, location: undefined }));
    setDraft((d) => {
      if (usingDevice) return { ...d, city };
      const center = cityCenter(city);
      return { ...d, city, lat: center?.lat ?? null, lng: center?.lng ?? null };
    });
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setErrors((e) => ({ ...e, location: "Location is unavailable in this browser. Pick a listed city instead." }));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setUsingDevice(true);
        setDraft((d) => ({
          ...d,
          lat: Math.round(p.coords.latitude * 1e6) / 1e6,
          lng: Math.round(p.coords.longitude * 1e6) / 1e6,
        }));
        setErrors((e) => ({ ...e, location: undefined }));
      },
      (err) => {
        setLocating(false);
        setErrors((e) => ({
          ...e,
          location:
            err.code === 1
              ? "Location permission was denied. Pick a listed city instead."
              : "Your location could not be determined. Pick a listed city instead.",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const resetToCityPin = () => {
    setUsingDevice(false);
    const center = cityCenter(draft.city);
    setDraft((d) => ({ ...d, lat: center?.lat ?? null, lng: center?.lng ?? null }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const found = validateDraft(draft, image, isNew);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setBusy(true);
    try {
      const saved = isNew
        ? await eventsDataSource.create(draft, image)
        : await eventsDataSource.update(event!.id, draft);
      notify(
        !isNew
          ? "Event updated."
          : saved.status === "published"
            ? "Event published."
            : "Event submitted. It will appear publicly once an administrator approves it.",
        "success",
      );
      navigate(`/events/${saved.id}`);
    } catch (cause) {
      if (cause instanceof ApiError && Object.keys(cause.fieldErrors).length) {
        const mapped: Errors = {};
        for (const [field, message] of Object.entries(cause.fieldErrors)) {
          mapped[SERVER_FIELDS[field] || "title"] = message;
        }
        setErrors(mapped);
      }
      setFormError(cause instanceof Error ? cause.message : "The event could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const errorOf = (key: FieldKey) =>
    errors[key] ? (
      <span className="field-error" role="alert">
        {errors[key]}
      </span>
    ) : null;
  const invalid = (key: FieldKey) => (errors[key] ? true : undefined);
  const city = cityCenter(draft.city);
  const atCityCentre = !!city && draft.lat === city.lat && draft.lng === city.lng;

  return (
    <>
      <Crumbs
        items={[
          { label: "Events", to: "/events" },
          ...(event ? [{ label: event.title, to: `/events/${event.id}` }] : []),
          { label: isNew ? "Create event" : "Edit" },
        ]}
      />
      <PageHeading
        eyebrow={isNew ? "HOST A GATHERING" : "EDIT EVENT"}
        title={isNew ? "Bring fans together." : "Update your event."}
        description={
          user?.role === "admin"
            ? "As an administrator, your events are published immediately."
            : "Fill in the details below. An administrator reviews every event before it appears publicly."
        }
      />
      <form className="panel stack-form event-form" onSubmit={submit} noValidate>
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        <Field label="Event name">
          <input
            value={draft.title}
            maxLength={255}
            required
            aria-invalid={invalid("title")}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Cosplay picnic at Tao Dan Park"
          />
          {errorOf("title")}
        </Field>
        <Field label="Description" hint={`${draft.body.length}/5000`}>
          <textarea
            rows={6}
            value={draft.body}
            maxLength={5000}
            required
            aria-invalid={invalid("body")}
            onChange={(e) => set("body", e.target.value)}
            placeholder="What will happen, who it's for, what to bring..."
          />
          {errorOf("body")}
        </Field>
        <div className="form-row">
          <Field label="Category">
            <select
              value={draft.categoryId}
              required
              aria-invalid={invalid("categoryId")}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              {!categories.length && <option value="">Loading categories...</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errorOf("categoryId")}
            {categoryError && <span className="field-error">{categoryError}</span>}
          </Field>
          <Field label="City" hint="Pick a listed city to place the map pin automatically.">
            <input
              list="event-city-options"
              value={draft.city}
              maxLength={100}
              required
              aria-invalid={invalid("city")}
              onChange={(e) => changeCity(e.target.value)}
              placeholder="Ho Chi Minh City"
            />
            {errorOf("city")}
          </Field>
          <datalist id="event-city-options">
            {EVENT_CITIES.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </div>
        <Field label="Venue or address">
          <input
            value={draft.venue}
            maxLength={255}
            required
            aria-invalid={invalid("venue")}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="Tao Dan Park, District 1"
          />
          {errorOf("venue")}
        </Field>
        <div className="event-location-row">
          <div>
            <strong>Map pin</strong>
            <p className="muted">
              {draft.lat !== null && draft.lng !== null
                ? usingDevice
                  ? `Your current location (${draft.lat.toFixed(4)}, ${draft.lng.toFixed(4)}). It will be shown publicly as the event location.`
                  : atCityCentre
                    ? `Centre of ${city!.name}. Use your location if you are at the venue for a precise pin.`
                    : `Pin at (${draft.lat.toFixed(4)}, ${draft.lng.toFixed(4)}).`
                : "No pin yet. Pick a listed city or use your current location."}
            </p>
            {errorOf("location")}
          </div>
          <div className="row-actions">
            <Button variant="secondary" busy={locating} onClick={useDeviceLocation}>
              <Icon name="pin" size={16} />
              Use my current location
            </Button>
            {usingDevice && city && (
              <button type="button" className="small-link" onClick={resetToCityPin}>
                Use city centre instead
              </button>
            )}
          </div>
        </div>
        <div className="form-row">
          <Field label="Starts (Vietnam time, GMT+7)">
            <input
              type="datetime-local"
              value={draft.startsAt}
              min={isNew ? nowVnInput() : undefined}
              required
              aria-invalid={invalid("startsAt")}
              onChange={(e) => set("startsAt", e.target.value)}
            />
            {errorOf("startsAt")}
          </Field>
          <Field label="Ends (optional)">
            <input
              type="datetime-local"
              value={draft.endsAt}
              min={draft.startsAt || undefined}
              aria-invalid={invalid("endsAt")}
              onChange={(e) => set("endsAt", e.target.value)}
            />
            {errorOf("endsAt")}
          </Field>
        </div>
        <Field label="Registration or ticket link (optional)">
          <input
            type="url"
            value={draft.registerUrl}
            maxLength={500}
            aria-invalid={invalid("registerUrl")}
            onChange={(e) => set("registerUrl", e.target.value)}
            placeholder="https://"
          />
          {errorOf("registerUrl")}
        </Field>
        {isNew ? (
          <Field label="Cover image (optional)" hint="JPG, PNG, GIF or WEBP, up to 5 MB.">
            <input
              type="file"
              accept={IMAGE_TYPES.join(",")}
              aria-invalid={invalid("image")}
              onChange={(e) => {
                setImage(e.target.files?.[0] || null);
                setErrors((x) => ({ ...x, image: undefined }));
              }}
            />
            {errorOf("image")}
          </Field>
        ) : (
          <p className="caption">The cover image can't be changed after the event is created.</p>
        )}
        {preview && (
          <img className="event-form-preview" src={preview} alt="Selected cover preview" />
        )}
        {isNew && user?.role !== "admin" && (
          <Notice>
            Your event will be marked <strong>Pending review</strong> and only you
            can see it until an administrator approves it.
          </Notice>
        )}
        <div className="row-actions">
          <Button type="submit" busy={busy}>
            <Icon name={isNew ? "send" : "check"} size={16} />
            {isNew
              ? user?.role === "admin"
                ? "Publish event"
                : "Submit for review"
              : "Save changes"}
          </Button>
          <Link className="btn btn-ghost" to={event ? `/events/${event.id}` : "/events"}>
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
