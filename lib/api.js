"use client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export function getToken() {
  if (typeof window === "undefined") return "";
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
  } catch (err) {
    throw new Error(`Unable to reach API server at ${API_BASE}. ${err.message || "Please check that the backend is running."}`);
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/";
      }
      throw new Error("Invalid or expired token. Please login again.");
    }
    const detail = data && typeof data === "object" ? data.detail : data;
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join(", ") : detail || "Request failed");
  }

  return data;
}

export function hasPermission(user, permission) {
  return Boolean(user?.roles?.includes("Super Admin") || user?.permissions?.includes(permission));
}

export function dashboardPath(user) {
  if (user?.roles?.includes("Super Admin")) return "/dashboard";
  if (user?.roles?.includes("Admin")) return "/dashboard";
  return "/dashboard";
}

export function imageUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}
