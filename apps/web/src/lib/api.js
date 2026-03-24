const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "macro_indicadores_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();

    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed?.message || text || `Request failed (${response.status})`);
    } catch {
      throw new Error(text || `Request failed (${response.status})`);
    }
  }

  return response.json();
}

export function login(input) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchMe() {
  return apiRequest("/auth/me");
}

export async function fetchLatestDashboard() {
  return apiRequest("/dashboard/latest", {
    method: "GET",
  });
}

export function fetchUsers() {
  return apiRequest("/users", {
    method: "GET",
  });
}

export function fetchConfigEntries() {
  return apiRequest("/config/entries", {
    method: "GET",
  });
}

export function createUser(input) {
  return apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createConfigEntry(input) {
  return apiRequest("/config/entries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(userId, input) {
  return apiRequest(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function updateConfigEntry(entryId, input) {
  return apiRequest(`/config/entries/${entryId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteUser(userId) {
  return apiRequest(`/users/${userId}`, {
    method: "DELETE",
  });
}

export function deleteConfigEntry(entryId) {
  return apiRequest(`/config/entries/${entryId}`, {
    method: "DELETE",
  });
}
