export type Topic =
  | "soundtrack"
  | "anime"
  | "gaming"
  | "movies"
  | "tv"
  | "kpop"
  | "comic"
  | "manga"
  | "cosplay";
export type PostFormat = "post" | "video" | "soundtrack";
export interface Author {
  id: string;
  name: string;
  role: string;
  suspended?: boolean;
  verified?: boolean;
}
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  subject: string;
  body: string;
  topic: Topic;
  format: PostFormat;
  mediaUrl: string;
  spoiler: boolean;
  rating: number;
  status: "pending" | "published" | "rejected" | "hidden";
  reason: string;
  version: number;
  createdAt: string;
  sample?: boolean;
}
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId: string | null;
  createdAt: string;
  hidden: boolean;
}
export interface Reaction {
  postId: string;
  userId: string;
  kind: "like" | "heart";
}
export interface SocialData {
  posts: Post[];
  comments: Comment[];
  reactions: Reaction[];
  reports: {
    id: string;
    postId: string;
    commentId: string | null;
    userId: string;
    reason: string;
    resolved: boolean;
    createdAt: string;
    reporterName: string;
    postTitle: string;
    authorName: string;
    contentPreview: string;
  }[];
}
export interface Prize {
  id: string;
  rank: number;
  title: string;
  subtitle: string;
  kind: "seoul" | "dalat" | "cinema";
}
export interface Entry {
  ticket: string;
  userId: string;
  joinedAt: string;
  termsVersion: string;
}
export interface Winner {
  ticket: string;
  prizeId: string;
  rank: number;
}
export interface Campaign {
  id: string;
  title: string;
  opensAt: string;
  closesAt: string;
  drawAt: string;
  status: "open" | "locked" | "drawn";
  demo: boolean;
  termsVersion: string;
  seedCommitment: string;
  snapshotHash: string | null;
  seedReveal: string | null;
  prizes: Prize[];
  entryCount: number;
  myEntry: Entry | null;
  winners: Winner[];
  snapshot: string[];
  audit: { event: string; at: string }[];
}
export interface Knowledge {
  id: string;
  title: string;
  topic: string;
  aliases: string[];
  body: string;
  spoilerLevel: number;
  status: "published" | "draft";
  sourceLabel: string;
  sample: boolean;
  relatedPath?: string;
}
export interface Citation {
  spoilerLevel?: number;
  id: string;
  title: string;
  label: string;
  path: string;
  sample: boolean;
}
export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Citation[];
  mode?: string;
  createdAt?: string;
}
export interface ChatResult {
  text: string;
  sources: Citation[];
  mode: string;
  threadId?: string;
}
export interface PublicProfile {
  id: string;
  name: string;
  role: string;
  bio: string;
  favoriteCategories: string[];
  createdAt: string;
  publishedPosts: number;
}
export interface PostInput {
  title: string;
  subject: string;
  body: string;
  topic: Topic;
  format: PostFormat;
  mediaUrl: string;
  spoiler: boolean;
  rating: number;
}
