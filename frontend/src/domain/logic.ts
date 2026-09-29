import type {
  Content,
  Filter,
  Page,
  FanEvent,
} from "./types";


export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();


export function filterContents(
  contents: Content[],
  f: Filter,
  pageSize = 9,
): Page<Content> {
  const terms = normalize(f.q || "")
    .split(/\s+/)
    .filter(Boolean);

  const items = contents
    .filter((c) => c.status === "published")
    .filter((c) => !f.category || c.categoryId === f.category)
    .filter((c) => !f.type || f.type.split(",").includes(c.type))
    .filter((c) =>
      terms.every((t) =>
        normalize(
          [c.title, c.description, c.body].join(" "),
        ).includes(t),
      ),
    )
    .sort((a, b) => {
      if (f.sort === "az") {
        return a.title.localeCompare(b.title);
      }

      if (f.sort === "popular") {
        return (
          b.rating - a.rating ||
          a.id.localeCompare(b.id)
        );
      }

      return (
        Date.parse(b.publishedAt) -
          Date.parse(a.publishedAt) ||
        a.id.localeCompare(b.id)
      );
    });

  const pageCount = Math.max(
    1,
    Math.ceil(items.length / pageSize),
  );

  const requested = Number.parseInt(
    f.page || "1",
    10,
  );

  const page = Math.min(
    pageCount,
    Math.max(
      1,
      Number.isFinite(requested)
        ? requested
        : 1,
    ),
  );

  return {
    items: items.slice(
      (page - 1) * pageSize,
      page * pageSize,
    ),
    total: items.length,
    page,
    pageSize,
    pageCount,
  };
}


export function distanceKm(
  a: {
    lat: number;
    lng: number;
  },
  b: {
    lat: number;
    lng: number;
  },
) {
  const rad = (x: number) =>
    (x * Math.PI) / 180;

  const dlat = rad(b.lat - a.lat);
  const dlng = rad(b.lng - a.lng);

  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.lat)) *
      Math.cos(rad(b.lat)) *
      Math.sin(dlng / 2) ** 2;

  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(Math.min(1, h)),
      Math.sqrt(Math.max(0, 1 - h)),
    )
  );
}


export function safeExternalUrl(
  value: string,
): string | null {
  try {
    const u = new URL(value);

    return u.protocol === "https:" &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}


export function safeReturnPath(
  value: string | null,
) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/dashboard";
}


export function validateContent(
  c: Partial<Content>,
): string | null {
  if (
    !c.title ||
    c.title.trim().length < 3 ||
    c.title.length > 120
  ) {
    return "Title must contain 3-120 characters.";
  }

  if (!c.categoryId) {
    return "Choose a category.";
  }

  if (
    !c.description ||
    c.description.trim().length < 12
  ) {
    return "Summary must contain at least 12 characters.";
  }

  if (!c.body || !c.body.trim()) {
    return "Content body cannot be empty.";
  }

  if (!c.type) {
    return "Choose a content type.";
  }

  if (
    c.mediaUrl &&
    !c.mediaUrl.startsWith("/media/") &&
    !safeExternalUrl(c.mediaUrl)
  ) {
    return "Media must use a local demo path or HTTPS.";
  }

  return null;
}


export function calendarFile(
  event: FanEvent,
  demo = true,
): string {
  const escape = (x: string) =>
    x
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const dt = (x: string) =>
    new Date(x)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const fold = (s: string) => {
    let out = "";
    let line = "";
    let size = 0;

    for (const ch of s) {
      const len = new TextEncoder()
        .encode(ch)
        .length;

      if (size + len > 74) {
        out += line + "\r\n ";
        line = "";
        size = 1;
      }

      line += ch;
      size += len;
    }

    return out + line;
  };

  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Fan Hub Plus//Frontend Demo//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",

      `UID:${event.id}@demo.fanhub.local`,

      `DTSTAMP:${dt(
        new Date().toISOString(),
      )}`,

      `DTSTART:${dt(event.startsAt)}`,
      `DTEND:${dt(event.endsAt)}`,

      `SUMMARY:${escape(
        (demo ? "[DEMO] " : "") +
          event.title,
      )}`,

      `LOCATION:${escape(
        event.venue + ", " + event.city,
      )}`,

      `DESCRIPTION:${escape(
        (demo
          ? "Fictional event for frontend testing. "
          : "") +
          event.description,
      )}`,

      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}