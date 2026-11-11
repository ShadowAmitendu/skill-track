/**
 * SkillTrack API Client
 *
 * Communicates with the Spring Boot backend on /api/v1 (proxied via Vite).
 * Automatically unwraps Spring Boot's ApiResponse<T> envelope:
 * { success: boolean, message: string, data: T, timestamp: string }
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const DEFAULT_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient(
  endpoint,
  { method = "GET", body, headers = {}, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    clearTimeout(timeoutId);

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const json = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMsg =
        json?.message ||
        json?.error ||
        `Backend request failed with status ${response.status} (${response.statusText})`;
      throw new ApiError(errorMsg, response.status, json?.data);
    }

    // Spring Boot ApiResponse<T> envelope handling
    if (json && typeof json === "object" && "success" in json) {
      if (!json.success) {
        throw new ApiError(json.message || "Operation failed", response.status, json.data);
      }
      return json.data;
    }

    return json;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new ApiError(
        `Request to ${cleanEndpoint} timed out after ${timeoutMs}ms. Is the Spring Boot backend running on port 8080?`,
        408
      );
    }

    if (err instanceof ApiError) {
      throw err;
    }

    // Network / connection refused error
    throw new ApiError(
      `Cannot reach the backend server at ${url}. Please verify Spring Boot is started on port 8080, or toggle Demo Mode in the header.`,
      0
    );
  }
}
