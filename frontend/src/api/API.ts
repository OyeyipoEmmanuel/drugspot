export type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions<TBody = unknown>
  extends Omit<RequestInit, "body" | "method"> {
  body?: TBody;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue | QueryValue[]>;
  timeoutMs?: number;
}

export interface ApiErrorPayload {
  detail?: string;
  message?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorPayload,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type AccessTokenProvider = () => string | null | Promise<string | null>;

const DEFAULT_BASE_URL = "http://localhost:8000/api/v1";
const DEFAULT_TIMEOUT_MS = 15_000;

function buildUrl(
  baseUrl: string,
  path: string,
  query?: ApiRequestOptions["query"],
) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  Object.entries(query ?? {}).forEach(([key, rawValue]) => {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((value) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  });

  return url.toString();
}

export class ApiClient {
  private tokenProvider?: AccessTokenProvider;

  constructor(
    private readonly baseUrl: string,
    private readonly defaultTimeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  setAccessTokenProvider(provider: AccessTokenProvider) {
    this.tokenProvider = provider;
  }

  async request<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
  ): Promise<TResponse> {
    const {
      body,
      headers: requestHeaders,
      method = "GET",
      query,
      signal: externalSignal,
      timeoutMs,
      ...fetchOptions
    } = options;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      timeoutMs ?? this.defaultTimeoutMs,
    );
    const abortFromExternalSignal = () => controller.abort();
    externalSignal?.addEventListener("abort", abortFromExternalSignal, { once: true });
    if (externalSignal?.aborted) controller.abort();

    const token = await this.tokenProvider?.();
    const headers = new Headers(requestHeaders);
    const isFormData = body instanceof FormData;
    const requestBody: BodyInit | undefined =
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body);

    headers.set("Accept", "application/json");
    if (body !== undefined && !isFormData) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);

    try {
      const response = await fetch(buildUrl(this.baseUrl, path, query), {
        ...fetchOptions,
        method,
        body: requestBody,
        headers,
        credentials: "include",
        signal: controller.signal,
      });

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const payload = isJson ? await response.json() : undefined;

      if (!response.ok) {
        const errorPayload = payload as ApiErrorPayload | undefined;
        throw new ApiError(
          errorPayload?.detail ?? errorPayload?.message ?? "The request could not be completed.",
          response.status,
          errorPayload,
        );
      }

      return payload as TResponse;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("The request timed out or was cancelled.", 408);
      }
      throw new ApiError("Unable to connect to the service.", 0);
    } finally {
      window.clearTimeout(timeout);
      externalSignal?.removeEventListener("abort", abortFromExternalSignal);
    }
  }

  get<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: "GET" });
  }

  post<TResponse, TBody>(path: string, body: TBody, options?: ApiRequestOptions<TBody>) {
    return this.request<TResponse, TBody>(path, { ...options, method: "POST", body });
  }

  patch<TResponse, TBody>(path: string, body: TBody, options?: ApiRequestOptions<TBody>) {
    return this.request<TResponse, TBody>(path, { ...options, method: "PATCH", body });
  }

  put<TResponse, TBody>(path: string, body: TBody, options?: ApiRequestOptions<TBody>) {
    return this.request<TResponse, TBody>(path, { ...options, method: "PUT", body });
  }

  delete<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL,
  Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
);
