import type {
  Category,
  Content,
  Database,
  FanEvent,
  FAQ,
  Feedback,
  Submission,
  User,
} from "../../domain/types";

export type AdminWorkspace = Pick<
  Database,
  | "categories"
  | "contents"
  | "events"
  | "users"
  | "feedback"
  | "submissions"
  | "faqs"
>;

export type AdminEditableResource = Content | Category | FanEvent | FAQ;

export interface AdminSubmissionDecision {
  submission: Submission;
  publishedContent?: Content | null;
}

export interface AdminWorkspaceEnvelope {
  workspace: AdminWorkspace;
}

export interface AdminContentEnvelope {
  content: Content;
}

export interface AdminCategoryEnvelope {
  category: Category;
}

export interface AdminEventEnvelope {
  event: FanEvent;
}

export interface AdminKnowledgeEnvelope {
  faq: FAQ;
}

export interface AdminUserEnvelope {
  user: User;
}

export interface AdminFeedbackEnvelope {
  feedback: Feedback;
}
