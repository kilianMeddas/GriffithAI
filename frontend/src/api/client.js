// Same-origin API client — no CORS, no base URL juggling.
// Token is read from localStorage on every call so it always reflects the
// current authenticated state.

const TOKEN_KEY = "vox.token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function request(
  path,
  { method = "GET", body, headers = {}, raw = false } = {},
) {
  const token = getToken();
  const finalHeaders = {
    Accept: "application/json",
    ...headers,
  };
  if (!raw && body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers: finalHeaders,
    body: raw ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && data.detail) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    const err = new Error(
      Array.isArray(message) ? message[0]?.msg || "Validation error" : message,
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  signup: (payload) =>
    request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  updateProfile: (payload) =>
    request("/auth/profile", {
      method: "PUT",
      body: payload,
    }),

  changePassword: (payload) =>
    request("/auth/change-password", {
      method: "PUT",
      body: payload,
    }),
  // Posts to the Qwen-style /generation/ask endpoint. We keep
  // /queries for backwards compatibility, but the chat uses this one.
  ask: (question, conversation_id, speak_audio = true) =>
    request("/generation/ask", {
      method: "POST",
      body: {
        query: question,
        conversation_id: conversation_id || null,
        speak_audio,
      },
    }),
  getStatus: () => request("/generation/status"),
  history: () => request("/queries"),
  removeConversation: (id) => request(`/queries/${id}`, { method: "DELETE" }),
  removeMessage: (conversationId, index) =>
    request(`/queries/${conversationId}/messages/${index}`, {
      method: "DELETE",
    }),
  togglePin: (conversationId) =>
    request(`/queries/${conversationId}/pin`, { method: "POST" }),

  listUsers: () => request("/admin/users"),
  removeUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),

  listDocuments: () => request("/admin/documents"),
  removeDocument: (id) =>
    request(`/admin/documents/${id}`, { method: "DELETE" }),
  uploadDocument: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/admin/upload", {
      method: "POST",
      body: form,
      raw: true,
    });
  },
};
