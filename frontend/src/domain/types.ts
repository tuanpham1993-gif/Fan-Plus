export type CategoryId = string;

export type ContentType =
  | "news"
  | "article"
  | "event"
  | "post";

export type Role = "user" | "admin";

export type ContentStatus =
  | "published"
  | "pending"
  | "rejected";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  color: string;
  accentColor?: string;
  contentCount?: number;
}

export type MediaType = "IMAGE" | "VIDEO" | "AUDIO";

export interface ContentMedia {
  id: number | string;
  media_url: string;
  media_type: MediaType;
}

export interface Content {
  id: string;
  title: string;
  categoryId: string;
  type: ContentType;
  description: string;
  body: string;
  image: string;
  publishedAt: string;
  rating: number;
  author: string;
  status: ContentStatus;
  mediaUrl?: string;
  media?: ContentMedia[];
}


export interface BackendEvent {
  id: number;
  content_id: number;
  location_name: string;
  city: string;
  latitude: number | string;
  longitude: number | string;

  start_time: string;

  end_time?: string | null;
  register_url?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;

  content?: {
    id: number;
    title: string;
    body: string;
    category_id: number;
    category_name?: string | null;
    author_id: number;
    author_name?: string | null;
    content_type: string;
    status: "PENDING" | "DONE" | "REJECTED";
  };
}


export interface FanEvent {
  id: string;
  title: string;
  city: string;
  venue: string;
  lat: number;
  lng: number;
  startsAt: string;
  endsAt: string;
  categoryId: string;
  description: string;
  image: string;
  ticketUrl?: string;
}


export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  city?: string | null;
  bio?: string | null;
  role: Role;
  status: string;
  favorite_fandoms: string[];
  display_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}


export interface Bookmark {
  id: string;
  userId: string;
  contentId: string;
  note: string;
  createdAt: string;
}


export interface Rating {
  userId: string;
  contentId: string;
  value: number;
}


export interface Activity {
  userId: string;
  contentId: string;
  at: string;
}


export interface Feedback {
  id: string;
  userId: string | null;
  type: "bug" | "suggestion" | "query";
  message: string;
  status: "open" | "resolved";
  createdAt: string;
}


export interface Submission {
  id: string;
  userId: string;
  title: string;
  categoryId: string;
  fandom: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  createdAt: string;
}


export interface FAQ {
  id: string;
  question: string;
  answer: string;
}


export interface Database {
  schemaVersion: 1;
  categories: Category[];
  contents: Content[];
  events: FanEvent[];
  users: User[];
  bookmarks: Bookmark[];
  ratings: Rating[];
  activity: Activity[];
  feedback: Feedback[];
  submissions: Submission[];
  faqs: FAQ[];
}


export interface Filter {
  q?: string;
  category?: string;
  fandom?: string;
  type?: string;
  genre?: string;
  year?: string;
  popular?: string;
  sort?: string;
  page?: string;
}


export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}


export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sourceIds?: string[];
}