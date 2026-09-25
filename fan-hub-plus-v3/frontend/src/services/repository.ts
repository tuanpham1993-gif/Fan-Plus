import { api, json, serverMode, clearCsrf } from "../features/http";
import { initialDatabase, DEMO_PASSWORD } from "../domain/seed";
import { validateContent, safeExternalUrl } from "../domain/logic";
import type {
  Database,
  User,
  Content,
  Category,
  FanEvent,
  Feedback,
  Submission,
  FAQ,
} from "../domain/types";
const DB_KEY = "fanhub.demo.db.v1",
  SESSION_KEY = "fanhub.demo.identity.v1",
  CREDENTIALS_KEY = "fanhub.demo.verifiers.v1";
const sleep = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));
// Mirrors backend/fanhub/security.py's DISPOSABLE_EMAIL_DOMAINS for the local demo path.
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "10minutemail.com", "10minutemail.net", "guerrillamail.com",
  "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de", "sharklasers.com",
  "yopmail.com", "yopmail.fr", "yopmail.net", "trashmail.com", "trash-mail.com",
  "tempmail.com", "temp-mail.org", "tempmail.net", "tempinbox.com", "throwawaymail.com",
  "getnada.com", "dispostable.com", "maildrop.cc", "mintemail.com", "mailnesia.com",
  "fakeinbox.com", "spamgourmet.com", "discard.email", "moakt.com", "emailondeck.com",
  "33mail.com", "mytemp.email", "mohmal.com", "mail-temporaire.fr", "einrot.com",
  "jetable.org", "spam4.me", "mailcatch.com", "anonbox.net", "inboxbear.com",
]);
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function readDb(): Database {
  try {
    const d = JSON.parse(localStorage.getItem(DB_KEY) || "null");
    if (
      d?.schemaVersion === 1 &&
      [
        "categories",
        "contents",
        "users",
        "events",
        "bookmarks",
        "ratings",
        "activity",
        "feedback",
        "submissions",
        "faqs",
      ].every((k) => Array.isArray(d[k]))
    )
      return d;
  } catch {
    /* A corrupt demo store should never blank the app. */
  }
  return initialDatabase();
}
function persist(db: Database) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw new AppError(
      "Browser storage is unavailable or full. Free some space and retry.",
    );
  }
}
function id(prefix: string) {
  return prefix + "-" + crypto.randomUUID();
}
function actor(db: Database, admin = false): User {
  const u = db.users.find((x) => x.id === sessionStorage.getItem(SESSION_KEY));
  if (!u || u.suspended) throw new AppError("Sign in to continue.", 401);
  if (admin && u.role !== "admin")
    throw new AppError("This action requires an administrator.", 403);
  return u;
}
async function verifier(password: string, salt: string) {
  const raw = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(salt + password),
  );
  return [...new Uint8Array(raw)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
function credentials(): Record<
  string,
  {
    salt: string;
    hash: string;
  }
> {
  try {
    return JSON.parse(sessionStorage.getItem(CREDENTIALS_KEY) || "{}");
  } catch {
    return {};
  }
}
async function setPassword(email: string, password: string) {
  const records = credentials(),
    salt = crypto.randomUUID();
  records[email] = { salt, hash: await verifier(password, salt) };
  sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(records));
}
// This repository is a UI simulator, NOT an authentication or authorization boundary.
// A deployed application must perform every check again on a trusted backend.
export const repository = {
  async load(): Promise<Database> {
    await sleep();
    const db = readDb();
    if (serverMode) {
      const data = await api<{ user: User | null }>("/auth/me");
      if (data.user) {
        db.users = db.users.filter((u) => u.id !== data.user!.id);
        db.users.push(data.user);
        sessionStorage.setItem(SESSION_KEY, data.user.id);
      } else sessionStorage.removeItem(SESSION_KEY);
    }
    return db;
  },
  currentUser(db: Database): User | null {
    return (
      db.users.find(
        (x) => x.id === sessionStorage.getItem(SESSION_KEY) && !x.suspended,
      ) || null
    );
  },
  async login(email: string, password: string) {
    if (serverMode) {
      const data = await api<{ user: User }>(
        "/auth/login",
        json("POST", { email, password }),
      );
      clearCsrf();
      const db = readDb();
      db.users = db.users.filter((u) => u.id !== data.user.id);
      db.users.push(data.user);
      persist(db);
      sessionStorage.setItem(SESSION_KEY, data.user.id);
      return db;
    }
    await sleep();
    const db = readDb(),
      key = email.trim().toLowerCase(),
      u = db.users.find((x) => x.email === key);
    const saved = credentials()[key];
    const valid = saved
      ? (await verifier(password, saved.salt)) === saved.hash
      : ["fan@fanhub.demo", "admin@fanhub.demo"].includes(key) &&
        password === DEMO_PASSWORD;
    if (!u || !valid || u.suspended)
      throw new AppError(
        "Email or password is incorrect, or this demo account is unavailable.",
        401,
      );
    sessionStorage.setItem(SESSION_KEY, u.id);
    return db;
  },
  async register(
    name: string,
    email: string,
    password: string,
    favoriteCategories: string[] = [],
  ) {
    if (serverMode) {
      const data = await api<{
        user: User;
        verification: string;
        emailSent: boolean;
        devOtp?: string;
      }>(
        "/auth/register",
        json("POST", { name, email, password, favoriteCategories }),
      );
      return { db: readDb(), ...data };
    }
    await sleep();
    const db = readDb(),
      key = email.trim().toLowerCase();
    if (!name.trim() || name.length > 60)
      throw new AppError("Display name must contain 1-60 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key))
      throw new AppError("Enter a valid email address.");
    if (DISPOSABLE_EMAIL_DOMAINS.has(key.split("@")[1]))
      throw new AppError(
        "Disposable or throwaway email addresses cannot be used.",
      );
    if (password.length < 10) throw new AppError("Use at least 10 characters.");
    if (db.users.some((x) => x.email === key))
      throw new AppError("This demo email is already registered.");
    db.users.push({
      id: id("u"),
      name: name.trim(),
      email: key,
      role: "member",
      favoriteCategories,
      favoriteFandoms: [],
      bio: "",
      suspended: false,
    });
    await setPassword(key, password);
    persist(db);
    return {
      db,
      user: null,
      verification: "demo-auto-verified",
      emailSent: false,
      devOtp: undefined as string | undefined,
    };
  },
  async verifyEmail(email: string, code: string) {
    if (serverMode) {
      const data = await api<{ user: User }>(
        "/auth/verify",
        json("POST", { email, code }),
      );
      const db = readDb();
      db.users = db.users.filter((u) => u.id !== data.user.id);
      db.users.push(data.user);
      persist(db);
      return db;
    }
    await sleep();
    return readDb();
  },
  async resendVerification(email: string) {
    if (serverMode)
      return api<{ emailSent: boolean; devOtp?: string }>(
        "/auth/verify/resend",
        json("POST", { email }),
      );
    return { emailSent: false };
  },
  async logout() {
    if (serverMode) {
      await api("/auth/logout", json("POST", {}));
      clearCsrf();
    }
    await sleep(40);
    sessionStorage.removeItem(SESSION_KEY);
    return readDb();
  },
  async forgot(email: string) {
    if (serverMode)
      throw new AppError(
        "Email recovery is not configured in the extension demo. Contact the local administrator.",
      );
    await sleep();
    const db = readDb(),
      u = db.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u) return null;
    const token = crypto.randomUUID();
    sessionStorage.setItem(
      "fanhub.demo.reset",
      JSON.stringify({
        token,
        userId: u.id,
        expires: Date.now() + 15 * 60 * 1000,
      }),
    );
    return token;
  },
  async resetPassword(token: string, password: string) {
    if (serverMode)
      throw new AppError(
        "Email recovery is not configured in the extension demo.",
      );
    await sleep();
    let record;
    try {
      record = JSON.parse(
        sessionStorage.getItem("fanhub.demo.reset") || "null",
      );
    } catch {}
    if (!record || record.token !== token || record.expires < Date.now())
      throw new AppError(
        "This reset link is invalid or expired. Request a new demo link.",
      );
    if (password.length < 10) throw new AppError("Use at least 10 characters.");
    const u = readDb().users.find((x) => x.id === record.userId);
    if (!u) throw new AppError("This account is unavailable.");
    await setPassword(u.email, password);
    sessionStorage.removeItem("fanhub.demo.reset");
    sessionStorage.removeItem(SESSION_KEY);
  },
  async toggleBookmark(contentId: string) {
    await sleep();
    const db = readDb(),
      u = actor(db);
    if (
      !db.contents.some((c) => c.id === contentId && c.status === "published")
    )
      throw new AppError("Content is unavailable.");
    const existing = db.bookmarks.find(
      (b) => b.userId === u.id && b.contentId === contentId,
    );
    db.bookmarks = existing
      ? db.bookmarks.filter((b) => b.id !== existing.id)
      : [
          ...db.bookmarks,
          {
            id: id("b"),
            userId: u.id,
            contentId,
            note: "",
            createdAt: new Date().toISOString(),
          },
        ];
    persist(db);
    return db;
  },
  async saveNote(bookmarkId: string, note: string) {
    await sleep();
    const db = readDb(),
      u = actor(db),
      b = db.bookmarks.find((x) => x.id === bookmarkId && x.userId === u.id);
    if (!b) throw new AppError("Bookmark not found.", 404);
    b.note = note.trim().slice(0, 1000);
    persist(db);
    return db;
  },
  async rate(contentId: string, value: number) {
    await sleep();
    const db = readDb(),
      u = actor(db);
    if (
      !db.contents.some((c) => c.id === contentId && c.status === "published")
    )
      throw new AppError("Published content not found.", 404);
    if (!Number.isInteger(value) || value < 1 || value > 5)
      throw new AppError("Choose a rating from 1 to 5.");
    db.ratings = db.ratings.filter(
      (r) => !(r.userId === u.id && r.contentId === contentId),
    );
    db.ratings.push({ userId: u.id, contentId, value });
    persist(db);
    return db;
  },
  async recordView(contentId: string) {
    const db = readDb(),
      u = this.currentUser(db);
    if (!u) return db;
    db.activity = db.activity.filter(
      (a) => !(a.userId === u.id && a.contentId === contentId),
    );
    db.activity.unshift({
      userId: u.id,
      contentId,
      at: new Date().toISOString(),
    });
    db.activity = db.activity.slice(0, 200);
    persist(db);
    return db;
  },
  async updateProfile(
    patch: Pick<
      User,
      "name" | "bio" | "favoriteCategories" | "favoriteFandoms" | "avatar"
    >,
  ) {
    await sleep();
    const db = readDb(),
      u = actor(db);
    if (!patch.name.trim() || patch.name.length > 60)
      throw new AppError("Display name must contain 1-60 characters.");
    const favoriteCategories = patch.favoriteCategories.filter((c) =>
      db.categories.some((x) => x.id === c),
    );
    if (serverMode) {
      // Persist the server-backed fields so they survive the next /auth/me sync,
      // instead of being silently overwritten by the authoritative server record.
      await api(
        "/auth/profile",
        json("PATCH", {
          bio: patch.bio.slice(0, 500),
          favoriteCategories,
          favoriteFandoms: patch.favoriteFandoms,
        }),
      );
    }
    Object.assign(u, patch, {
      name: patch.name.trim(),
      bio: patch.bio.slice(0, 500),
      favoriteCategories,
    });
    persist(db);
    return db;
  },
  async feedback(type: Feedback["type"], message: string) {
    await sleep();
    const db = readDb();
    if (!["bug", "suggestion", "query"].includes(type))
      throw new AppError("Choose a valid feedback type.");
    if (message.trim().length < 10 || message.length > 2000)
      throw new AppError("Feedback must contain 10-2000 characters.");
    db.feedback.unshift({
      id: id("f"),
      userId: this.currentUser(db)?.id || null,
      type,
      message: message.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    });
    persist(db);
    return db;
  },
  async submit(
    data: Pick<Submission, "title" | "categoryId" | "fandom" | "body">,
  ) {
    await sleep();
    const db = readDb(),
      u = actor(db);
    if (!db.categories.some((c) => c.id === data.categoryId))
      throw new AppError("Choose a valid category.");
    if (
      data.title.length > 120 ||
      data.body.length > 15000 ||
      !data.fandom.trim()
    )
      throw new AppError(
        "Complete the fandom and stay within the title/story limits.",
      );
    if (data.title.trim().length < 5 || data.body.trim().length < 80)
      throw new AppError(
        "Use a title of at least 5 characters and a story of at least 80 characters.",
      );
    db.submissions.unshift({
      ...data,
      id: id("s"),
      userId: u.id,
      status: "pending",
      reason: "",
      createdAt: new Date().toISOString(),
    });
    persist(db);
    return db;
  },
  async moderate(
    submissionId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) {
    await sleep();
    const db = readDb();
    actor(db, true);
    const s = db.submissions.find((x) => x.id === submissionId);
    if (!s || s.status !== "pending")
      throw new AppError("This submission has already been reviewed.");
    if (decision === "rejected" && reason.trim().length < 5)
      throw new AppError(
        "Give the contributor a reason (at least 5 characters).",
      );
    s.status = decision;
    s.reason = reason;
    if (decision === "approved")
      db.contents.unshift({
        id: id("c"),
        title: s.title,
        description: s.body.slice(0, 200),
        body: s.body,
        categoryId: s.categoryId,
        fandom: s.fandom,
        type: "article",
        genre: "Community",
        image: "/art/community.svg",
        year: 2026,
        publishedAt: new Date().toISOString(),
        popularity: 0,
        rating: 0,
        duration: "Community story",
        tags: ["Fan submission"],
        status: "published",
        author: db.users.find((u) => u.id === s.userId)?.name || "Community",
        spoiler: false,
        sourceLabel: "User-submitted demo content",
      });
    persist(db);
    return db;
  },
  async saveContent(content: Content) {
    await sleep();
    const db = readDb();
    actor(db, true);
    const error = validateContent(content);
    if (error) throw new AppError(error);
    if (!db.categories.some((c) => c.id === content.categoryId))
      throw new AppError("Category does not exist.");
    const found = db.contents.some((c) => c.id === content.id);
    db.contents = found
      ? db.contents.map((c) => (c.id === content.id ? content : c))
      : [{ ...content, id: id("c") }, ...db.contents];
    persist(db);
    return db;
  },
  async deleteContent(contentId: string) {
    await sleep();
    const db = readDb();
    actor(db, true);
    db.contents = db.contents.filter((c) => c.id !== contentId);
    db.bookmarks = db.bookmarks.filter((b) => b.contentId !== contentId);
    db.ratings = db.ratings.filter((r) => r.contentId !== contentId);
    db.activity = db.activity.filter((a) => a.contentId !== contentId);
    persist(db);
    return db;
  },
  async saveCategory(category: Category) {
    await sleep();
    const db = readDb();
    actor(db, true);
    if (!category.name.trim()) throw new AppError("Category name is required.");
    if (
      db.categories.some(
        (c) =>
          c.id !== category.id &&
          c.name.toLowerCase() === category.name.toLowerCase(),
      )
    )
      throw new AppError("Category already exists.");
    db.categories = db.categories.some((c) => c.id === category.id)
      ? db.categories.map((c) => (c.id === category.id ? category : c))
      : [...db.categories, { ...category, id: id("cat") }];
    persist(db);
    return db;
  },
  async deleteCategory(categoryId: string) {
    await sleep();
    const db = readDb();
    actor(db, true);
    if (
      db.contents.some((c) => c.categoryId === categoryId) ||
      db.events.some((e) => e.categoryId === categoryId) ||
      db.submissions.some((s) => s.categoryId === categoryId)
    )
      throw new AppError(
        "Category is in use. Reassign its content, events and submissions first.",
      );
    db.categories = db.categories.filter((c) => c.id !== categoryId);
    db.users.forEach(
      (u) =>
        (u.favoriteCategories = u.favoriteCategories.filter(
          (c) => c !== categoryId,
        )),
    );
    persist(db);
    return db;
  },
  async saveEvent(event: FanEvent) {
    await sleep();
    const db = readDb();
    actor(db, true);
    if (event.ticketUrl && !safeExternalUrl(event.ticketUrl))
      throw new AppError("Organizer links must use HTTPS.");
    if (!db.categories.some((c) => c.id === event.categoryId))
      throw new AppError("Choose a valid category.");
    if (!event.title.trim() || !event.city || !event.venue)
      throw new AppError("Title, city and venue are required.");
    if (
      !Number.isFinite(Date.parse(event.startsAt)) ||
      !Number.isFinite(Date.parse(event.endsAt)) ||
      Date.parse(event.endsAt) <= Date.parse(event.startsAt)
    )
      throw new AppError("End time must be after start time.");
    if (
      !Number.isFinite(event.lat) ||
      !Number.isFinite(event.lng) ||
      Math.abs(event.lat) > 90 ||
      Math.abs(event.lng) > 180
    )
      throw new AppError("Coordinates are out of range.");
    db.events = db.events.some((e) => e.id === event.id)
      ? db.events.map((e) => (e.id === event.id ? event : e))
      : [...db.events, { ...event, id: id("e") }];
    persist(db);
    return db;
  },
  async deleteEvent(eventId: string) {
    await sleep();
    const db = readDb();
    actor(db, true);
    db.events = db.events.filter((e) => e.id !== eventId);
    persist(db);
    return db;
  },
  async setUserStatus(userId: string, suspended: boolean) {
    await sleep();
    const db = readDb(),
      u = actor(db, true);
    if (u.id === userId)
      throw new AppError("You cannot suspend your own admin account.");
    const target = db.users.find((x) => x.id === userId);
    if (target) target.suspended = suspended;
    persist(db);
    return db;
  },
  async resolveFeedback(feedbackId: string) {
    await sleep();
    const db = readDb();
    actor(db, true);
    const f = db.feedback.find((x) => x.id === feedbackId);
    if (f) f.status = "resolved";
    persist(db);
    return db;
  },
  async saveFaq(faq: FAQ) {
    await sleep();
    const db = readDb();
    actor(db, true);
    if (faq.question.trim().length < 5 || faq.answer.trim().length < 10)
      throw new AppError("Add a complete question and answer.");
    db.faqs = db.faqs.some((f) => f.id === faq.id)
      ? db.faqs.map((f) => (f.id === faq.id ? faq : f))
      : [...db.faqs, { ...faq, id: id("faq") }];
    persist(db);
    return db;
  },
  async deleteFaq(faqId: string) {
    await sleep();
    const db = readDb();
    actor(db, true);
    db.faqs = db.faqs.filter((f) => f.id !== faqId);
    persist(db);
    return db;
  },
  resetDemo() {
    localStorage.removeItem(DB_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(CREDENTIALS_KEY);
    sessionStorage.removeItem("fanhub.demo.reset");
    Object.keys(localStorage)
      .filter((k) => k.startsWith("fanhub.chat."))
      .forEach((k) => localStorage.removeItem(k));
    return initialDatabase();
  },
};
