import type { PostType } from "./api";

export type FeedSectionKey =
  | "all"
  | "questions"
  | "help-needed"
  | "marketplace"
  | "resources"
  | "updates"
  | "personal";

export type FeedSection = {
  key: FeedSectionKey;
  label: string;
  path: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyMessage: string;
  types?: PostType[];
};

export const postTypeOptions: Array<{ value: PostType; label: string }> = [
  { value: "PERSONAL", label: "Personal" },
  { value: "QUESTION", label: "Question" },
  { value: "HELP_NEEDED", label: "Help Needed" },
  { value: "MARKETPLACE", label: "Marketplace" },
  { value: "RESOURCE", label: "Resource" },
  { value: "UPDATE", label: "Update" },
  { value: "WIN", label: "Win" }
];

export const postTypeLabels: Record<PostType, string> = {
  QUESTION: "Question",
  HELP_NEEDED: "Help Needed",
  MARKETPLACE: "Marketplace",
  RESOURCE: "Resource",
  UPDATE: "Update",
  WIN: "Win",
  PERSONAL: "Personal"
};

export const feedSections: FeedSection[] = [
  {
    key: "all",
    label: "All",
    path: "/app/feed",
    title: "Feed",
    description: "Posts from you and people you follow will appear here.",
    emptyTitle: "No posts yet.",
    emptyMessage: "Posts from people you follow will appear here."
  },
  {
    key: "questions",
    label: "Questions",
    path: "/app/feed/questions",
    title: "Questions",
    description: "Questions from you and people you follow.",
    emptyTitle: "No questions yet.",
    emptyMessage: "Question posts from people you follow will appear here.",
    types: ["QUESTION"]
  },
  {
    key: "help-needed",
    label: "Help Needed",
    path: "/app/feed/help-needed",
    title: "Help Needed",
    description: "Help requests from you and people you follow.",
    emptyTitle: "No help requests yet.",
    emptyMessage: "Help Needed posts from people you follow will appear here.",
    types: ["HELP_NEEDED"]
  },
  {
    key: "marketplace",
    label: "Marketplace",
    path: "/app/feed/marketplace",
    title: "Marketplace",
    description: "Needs and offers from you and people you follow.",
    emptyTitle: "No marketplace posts yet.",
    emptyMessage: "Marketplace posts from people you follow will appear here.",
    types: ["MARKETPLACE"]
  },
  {
    key: "resources",
    label: "Resources",
    path: "/app/feed/resources",
    title: "Resources",
    description: "Useful resources from you and people you follow.",
    emptyTitle: "No resources yet.",
    emptyMessage: "Resource posts from people you follow will appear here.",
    types: ["RESOURCE"]
  },
  {
    key: "updates",
    label: "Updates / Wins",
    path: "/app/feed/updates",
    title: "Updates / Wins",
    description: "Progress updates and wins from you and people you follow.",
    emptyTitle: "No updates or wins yet.",
    emptyMessage: "Update and Win posts from people you follow will appear here.",
    types: ["UPDATE", "WIN"]
  },
  {
    key: "personal",
    label: "Personal",
    path: "/app/feed/personal",
    title: "Personal",
    description: "Personal posts from you and people you follow.",
    emptyTitle: "No personal posts yet.",
    emptyMessage: "Personal posts from people you follow will appear here.",
    types: ["PERSONAL"]
  }
];

export const feedSectionByKey = Object.fromEntries(
  feedSections.map((section) => [section.key, section])
) as Record<FeedSectionKey, FeedSection>;
