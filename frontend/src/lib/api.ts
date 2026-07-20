const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

type ApiResponse<T> = {
  status: "success";
  message?: string;
  data: T;
};

type ApiErrorBody = {
  status?: "error";
  message?: string;
  errors?: unknown;
};

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  includeCredentials?: boolean;
};

export type User = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  isPrivate: boolean;
  isAdmin: boolean;
  isDisabled: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostAuthor = {
  id: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
};

export type PostType =
  | "QUESTION"
  | "HELP_NEEDED"
  | "MARKETPLACE"
  | "RESOURCE"
  | "UPDATE"
  | "WIN"
  | "PERSONAL";

export type FeedPost = {
  id: string;
  authorId: string;
  author: PostAuthor | null;
  type: PostType;
  content: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  savedByMe: boolean;
};

export type FeedPagination = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type FeedData = {
  posts: FeedPost[];
  pagination: FeedPagination;
};

export type SavedFeedPost = FeedPost & {
  savedAt: string;
};

export type SavedPostsData = {
  posts: SavedFeedPost[];
  pagination: FeedPagination;
};

export type CreatedPost = {
  id: string;
  authorId: string;
  author: PostAuthor | null;
  type: PostType;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePostData = {
  post: CreatedPost;
};

export type UpdatePostData = {
  post: FeedPost;
};

export type PostActionData = Record<string, never>;

export type CommentAuthor = {
  id: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  author: CommentAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PostCommentsPagination = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type PostCommentsData = {
  comments: PostComment[];
  pagination: PostCommentsPagination;
};

export type ListPostCommentsOptions = {
  limit?: number;
  cursor?: string;
  sort?: "oldest" | "latest";
};

export type CreateCommentData = {
  comment: PostComment;
};

export type DeleteCommentData = Record<string, never>;

type AuthData = {
  user: User;
  accessToken: string;
};

type RefreshData = {
  accessToken: string;
};

type CurrentUserData = {
  user: User;
};

type GetFeedParams = {
  cursor?: string;
  limit?: number;
  types?: PostType[];
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

export class ApiError extends Error {
  statusCode: number;
  errors?: unknown;

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: options.includeCredentials ? "include" : "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) as ApiResponse<T> | ApiErrorBody : null;

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody | null;
    throw new ApiError(
      errorBody?.message ?? "Request failed",
      response.status,
      errorBody?.errors
    );
  }

  return payload as ApiResponse<T>;
}

export async function loginApi(input: LoginInput) {
  return apiRequest<AuthData>("/auth/login", {
    method: "POST",
    body: input,
    includeCredentials: true
  });
}

export async function registerApi(input: RegisterInput) {
  return apiRequest<AuthData>("/auth/register", {
    method: "POST",
    body: input,
    includeCredentials: true
  });
}

export async function refreshApi() {
  return apiRequest<RefreshData>("/auth/refresh", {
    method: "POST",
    includeCredentials: true
  });
}

export async function logoutApi() {
  return apiRequest<Record<string, never>>("/auth/logout", {
    method: "POST",
    includeCredentials: true
  });
}

export async function getCurrentUserApi(token: string) {
  return apiRequest<CurrentUserData>("/auth/me", {
    token
  });
}

export async function getFeedApi(
  accessToken: string,
  params?: GetFeedParams
) {
  const searchParams = new URLSearchParams();

  if (params?.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params?.types?.length) {
    searchParams.set("types", params.types.join(","));
  }

  const queryString = searchParams.toString();

  return apiRequest<FeedData>(`/feed${queryString ? `?${queryString}` : ""}`, {
    token: accessToken
  });
}

export async function getSavedPostsApi(
  accessToken: string,
  params?: {
    limit?: number;
    cursor?: string | null;
  }
) {
  const searchParams = new URLSearchParams();

  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params?.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  const queryString = searchParams.toString();

  return apiRequest<SavedPostsData>(
    `/users/me/saved-posts${queryString ? `?${queryString}` : ""}`,
    {
      token: accessToken
    }
  );
}

export async function createPostApi(
  accessToken: string,
  payload: { content: string; type: PostType }
) {
  return apiRequest<CreatePostData>("/posts", {
    method: "POST",
    token: accessToken,
    body: payload
  });
}

export async function updatePostApi({
  accessToken,
  postId,
  content
}: {
  accessToken: string;
  postId: string;
  content: string;
}) {
  return apiRequest<UpdatePostData>(`/posts/${postId}`, {
    method: "PATCH",
    token: accessToken,
    body: {
      content
    }
  });
}

export async function likePostApi(accessToken: string, postId: string) {
  return apiRequest<PostActionData>(`/posts/${postId}/like`, {
    method: "POST",
    token: accessToken
  });
}

export async function unlikePostApi(accessToken: string, postId: string) {
  return apiRequest<PostActionData>(`/posts/${postId}/like`, {
    method: "DELETE",
    token: accessToken
  });
}

export async function savePostApi(accessToken: string, postId: string) {
  return apiRequest<PostActionData>(`/posts/${postId}/save`, {
    method: "POST",
    token: accessToken
  });
}

export async function unsavePostApi(accessToken: string, postId: string) {
  return apiRequest<PostActionData>(`/posts/${postId}/save`, {
    method: "DELETE",
    token: accessToken
  });
}

export async function clearSavedPostsApi(accessToken: string) {
  return apiRequest<{ message: string }>("/users/me/saved-posts", {
    method: "DELETE",
    token: accessToken
  });
}

export async function deletePostApi({
  accessToken,
  postId
}: {
  accessToken: string;
  postId: string;
}) {
  return apiRequest<PostActionData>(`/posts/${postId}`, {
    method: "DELETE",
    token: accessToken
  });
}

export async function createCommentApi(
  accessToken: string,
  postId: string,
  payload: { content: string }
) {
  return apiRequest<CreateCommentData>(`/posts/${postId}/comments`, {
    method: "POST",
    token: accessToken,
    body: payload
  });
}

export async function getPostCommentsApi(
  accessToken: string,
  postId: string,
  options?: ListPostCommentsOptions
) {
  const searchParams = new URLSearchParams();

  if (options?.limit !== undefined) {
    searchParams.set("limit", String(options.limit));
  }

  if (options?.cursor) {
    searchParams.set("cursor", options.cursor);
  }

  if (options?.sort) {
    searchParams.set("sort", options.sort);
  }

  const queryString = searchParams.toString();

  return apiRequest<PostCommentsData>(
    `/posts/${postId}/comments${queryString ? `?${queryString}` : ""}`,
    {
      token: accessToken
    }
  );
}

export async function deleteCommentApi(
  accessToken: string,
  postId: string,
  commentId: string
) {
  return apiRequest<DeleteCommentData>(`/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    token: accessToken
  });
}
