import "server-only";
import { NextResponse } from "next/server";
import { assertAdminConfigured } from "./firebaseAdmin";

const MAX_BODY_BYTES = 64 * 1024;

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type JsonBody = Record<string, unknown>;

export const assertSameOrigin = (request: Request): void => {
  const origin = request.headers.get("origin");
  if (!origin) {
    const site = request.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") {
      throw new HttpError(403, "Cross-site requests are not allowed.");
    }
    return;
  }
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Invalid request origin.");
  }
  if (originHost !== host) {
    throw new HttpError(403, "Cross-site requests are not allowed.");
  }
};

export const readJsonBody = async (request: Request): Promise<JsonBody> => {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.");
  }
  const text = await request.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.");
  }
  if (!text) return {};
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "Request body must be JSON.");
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body must be a JSON object.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }
  return body as JsonBody;
};

export const clientIp = (request: Request): string =>
  request.headers.get("x-real-ip")?.trim() ||
  request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
  "unknown";

export const jsonError = (error: unknown): NextResponse => {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
};

export interface RouteContext<TParams extends Record<string, string>> {
  params: Promise<TParams>;
}

export const handleApi =
  <TResult, TParams extends Record<string, string> = Record<string, never>>(
    handler: (request: Request, context: RouteContext<TParams>) => Promise<TResult>,
    { mutates = true }: { mutates?: boolean } = {}
  ) =>
  async (request: Request, context: RouteContext<TParams>): Promise<Response> => {
    try {
      if (mutates) {
        assertSameOrigin(request);
        assertAdminConfigured();
      }
      const result = await handler(request, context);
      return result instanceof Response ? result : NextResponse.json(result);
    } catch (error) {
      return jsonError(error);
    }
  };
