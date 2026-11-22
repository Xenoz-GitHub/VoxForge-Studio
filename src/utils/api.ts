import { keyValues, loadKeys, type StoredKey } from "./keyVault";

export const KEYS_HEADER = "x-gemini-keys";

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface RequestOptions {
  keys?: StoredKey[];
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  body: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const keys = keyValues(options.keys ?? loadKeys());
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Keys travel in a header so they never appear in URLs, logs, or referrers.
  if (keys.length > 0) {
    headers[KEYS_HEADER] = keys.join(",");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Request cancelled.", 0);
    }
    throw new ApiError(
      "Network error. Check your connection and try again.",
      0
    );
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const record = (payload ?? {}) as { error?: string; retryAfterSeconds?: number };
    throw new ApiError(
      record.error || `Request failed with status ${response.status}.`,
      response.status,
      typeof record.retryAfterSeconds === "number"
        ? record.retryAfterSeconds
        : undefined
    );
  }

  return payload as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}.`, response.status);
  }
  return (await response.json()) as T;
}
