const DEFAULT_DEV_API_ROOT = "https://localhost:7076/api";
const API_ROOT = String(
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "/api" : DEFAULT_DEV_API_ROOT)
).replace(/\/+$/, "");

function resolveUserId(explicitUserId) {
  if (explicitUserId != null) return explicitUserId;
  try {
    const raw = localStorage.getItem("taskSenpai.user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

function buildUrl(path) {
  const raw = String(path || "");
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return `${API_ROOT}${normalized}`;
}

function parseMaybeJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFromPayload(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload || fallback;
  return (
    payload.message ||
    payload.error ||
    payload.title ||
    payload.detail ||
    fallback
  );
}

export async function apiRequest({ path, method = "GET", body, headers, userId } = {}) {
  const resolvedUserId = resolveUserId(userId);
  const requestHeaders = { ...(headers || {}) };

  const hasBody = body !== undefined;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (hasBody && !isFormData && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }
  if (resolvedUserId != null && !requestHeaders["X-User-Id"]) {
    requestHeaders["X-User-Id"] = String(resolvedUserId);
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: !hasBody ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = parseMaybeJson(text);

  if (!response.ok) {
    const error = new Error(messageFromPayload(payload, `Request failed (${response.status})`));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function apiGet(path, options) {
  return apiRequest({ ...(options || {}), path, method: "GET" });
}

export function apiPost(path, body, options) {
  return apiRequest({ ...(options || {}), path, method: "POST", body });
}

export function apiPut(path, body, options) {
  return apiRequest({ ...(options || {}), path, method: "PUT", body });
}

export function apiDelete(path, options) {
  return apiRequest({ ...(options || {}), path, method: "DELETE" });
}
