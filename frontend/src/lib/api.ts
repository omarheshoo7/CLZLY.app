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
