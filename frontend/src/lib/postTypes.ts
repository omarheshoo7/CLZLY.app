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
  defaultPostType: PostType;
  types?: PostType[];
};

export type PostTypePrompt = {
  placeholder: string;
  helperText: string;
  example: string;
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

export const postTypePrompts: Record<PostType, PostTypePrompt> = {
  PERSONAL: {
    placeholder: "What would you like to share?",
    helperText: "Share a personal update with your followers.",
    example: "Just finished a long coding session and went for coffee."
  },
  QUESTION: {
    placeholder: "What question do you want to ask?",
    helperText: "Ask clearly so others can understand and answer.",
    example: "How should I organize my Prisma services?"
  },
  HELP_NEEDED: {
    placeholder: "What are you stuck on?",
    helperText: "Explain the problem and what kind of help you need.",
    example: "I need help debugging my React state update."
  },
  MARKETPLACE: {
    placeholder: "What are you looking for or offering?",
    helperText: "Use this for needs, offers, opportunities, collaborations, or recommendations.",
    example: "Looking for someone to review my portfolio project."
  },
  RESOURCE: {
    placeholder: "What useful resource do you want to share?",
    helperText: "Share links, tools, articles, tutorials, courses, or recommendations.",
    example: "This JWT article helped me understand refresh tokens."
  },
  UPDATE: {
    placeholder: "What progress did you make?",
    helperText: "Share what you worked on, learned, or improved.",
    example: "Today I finished the F10 feed structure feature."
  },
  WIN: {
    placeholder: "What did you achieve?",
    helperText: "Celebrate a milestone, achievement, or good news.",
    example: "I successfully pushed F10 to staging."
  }
};

export const feedSections: FeedSection[] = [
  {
    key: "all",
    label: "All",
    path: "/app/feed",
    title: "Feed",
    description: "Posts from you and people you follow will appear here.",
    emptyTitle: "No posts yet.",
    emptyMessage: "Posts from people you follow will appear here.",
    defaultPostType: "PERSONAL"
  },
  {
    key: "questions",
    label: "Questions",
    path: "/app/feed/questions",
    title: "Questions",
    description: "Questions from you and people you follow.",
    emptyTitle: "No questions yet.",
    emptyMessage: "Question posts from people you follow will appear here.",
    defaultPostType: "QUESTION",
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
    defaultPostType: "HELP_NEEDED",
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
    defaultPostType: "MARKETPLACE",
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
    defaultPostType: "RESOURCE",
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
    defaultPostType: "UPDATE",
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
    defaultPostType: "PERSONAL",
    types: ["PERSONAL"]
  }
];

export const feedSectionByKey = Object.fromEntries(
  feedSections.map((section) => [section.key, section])
) as Record<FeedSectionKey, FeedSection>;
