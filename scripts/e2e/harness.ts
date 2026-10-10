import { BASE_URL } from "./env.ts";

interface CheckResult {
  name: string;
  passed: boolean;
  detail: unknown;
}

export interface ApiResponse {
  status: number;
  headers: Headers;
  text: string;
  json: unknown;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  origin?: string;
}

export interface Client {
  label: string;
  request: (path: string, options?: RequestOptions) => Promise<ApiResponse>;
  get: (path: string) => Promise<ApiResponse>;
  post: (
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) => Promise<ApiResponse>;
  patch: (path: string, body: unknown) => Promise<ApiResponse>;
  del: (path: string) => Promise<ApiResponse>;
  readonly cookie: string;
  setCookie: (value: string) => void;
}

const results: CheckResult[] = [];

export const expectThat = (
  name: string,
  passed: unknown,
  detail: unknown = ""
): void => {
  results.push({ name, passed: Boolean(passed), detail });
  const mark = passed ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${passed || !detail ? "" : `  -> ${detail}`}`);
};

export const summarize = (): boolean => {
  const failed = results.filter((result) => !result.passed);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed`
  );
  return failed.length === 0;
};

export const createClient = (label: string): Client => {
  let sessionCookie = "";

  const request = async (
    path: string,
    { method = "GET", body, headers = {}, origin }: RequestOptions = {}
  ): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      redirect: "manual",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
        ...(origin ? { Origin: origin } : { Origin: BASE_URL }),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie?.startsWith("__session=")) {
      const value = setCookie.split(";")[0] ?? "";
      sessionCookie = value === "__session=" ? "" : value;
    }

    const text = await response.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: response.status, headers: response.headers, text, json };
  };

  return {
    label,
    request,
    get: (path) => request(path),
    post: (path, body, options) =>
      request(path, { method: "POST", body, ...options }),
    patch: (path, body) => request(path, { method: "PATCH", body }),
    del: (path) => request(path, { method: "DELETE" }),
    get cookie() {
      return sessionCookie;
    },
    setCookie(value) {
      sessionCookie = value;
    },
  };
};

export const login = async (
  client: Client,
  email: string,
  password: string,
  role: string
): Promise<ApiResponse> =>
  client.post("/api/auth/login", { email, password, role });
