"use client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

function isBrowser() {
  return globalThis.window !== undefined;
}

function getResponseDetail(data) {
  if (data && typeof data === "object") {
    return data.detail;
  }
  return data;
}

function buildErrorMessage(detail) {
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }
  return detail || "Request failed";
}

function redirectToLogin() {
  if (isBrowser() && globalThis.window.location.pathname !== "/") {
    globalThis.window.location.href = "/";
  }
}

export function getToken() {
  if (!isBrowser()) return "";
  return localStorage.getItem("access_token") || "";
}

export function setToken(token) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

export async function api(path, options = {}) {
  const { auth = true, ...fetchOptions } = options;
  const token = auth ? getToken() : "";
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch (error) {
    const message = error.message || "Please check that the backend is running.";
    throw new Error(`Unable to reach API server at ${API_BASE}. ${message}`);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.ok) {
    return data;
  }

  if (response.status === 401) {
    clearToken();
    redirectToLogin();
    throw new Error("Invalid or expired token. Please login again.");
  }

  throw new Error(buildErrorMessage(getResponseDetail(data)));
}

export function hasPermission(user, permission) {
  return Boolean(user?.roles?.includes("Super Admin") || user?.permissions?.includes(permission));
}

export function imageUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}
