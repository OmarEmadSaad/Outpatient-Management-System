import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: object;
}

const errorMessage = (data: unknown): string => {
  const message = (data as Partial<ApiErrorBody> | null)?.error;
  return typeof message === "string" && message ? message : "Request failed";
};

export const apiRequest = async <T>(
  path: string,
  { method = "GET", body }: ApiRequestOptions = {}
): Promise<T> => {
  const response = await fetch(path, {
    method,
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
    credentials: "same-origin",
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(errorMessage(data), response.status);
  return data as T;
};

export const errorText = (error: unknown, fallback = "Something went wrong"): string =>
  error instanceof Error && error.message ? error.message : fallback;

export const errorStatus = (error: unknown): number | null =>
  error instanceof ApiError ? error.status : null;
