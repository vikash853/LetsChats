/**
 * API Service (Axios)
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for all HTTP requests.
 * - Automatically attaches the JWT from localStorage to every request
 * - On 401 response: clears auth data and redirects to /login
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api","https://letschats-1.onrender.com",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach token ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = "Bearer " + token;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth endpoints ─────────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post("/auth/register", data),
  login:         (data) => api.post("/auth/login", data),
  getMe:         ()     => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  logout:        ()     => api.post("/auth/logout"),
};

// ── User endpoints ─────────────────────────────────────────────
export const usersAPI = {
  getAll:    (search = "") => api.get("/users?search=" + search),
  getOnline: ()            => api.get("/users/online"),
  getById:   (id)          => api.get("/users/" + id),
};

// ── Conversation endpoints ─────────────────────────────────────
export const conversationsAPI = {
  getAll:        ()           => api.get("/conversations"),
  accessOrCreate:(userId)     => api.post("/conversations", { userId }),
  createGroup:   (data)       => api.post("/conversations/group", data),
  updateGroup:   (id, data)   => api.put("/conversations/group/" + id, data),
};

// ── Message endpoints ──────────────────────────────────────────
export const messagesAPI = {
  getByConversation: (conversationId, page = 1) =>
    api.get("/messages/" + conversationId + "?page=" + page),
  send:     (data) => api.post("/messages", data),
  markRead: (cid)  => api.put("/messages/read/" + cid),
  delete:   (id)   => api.delete("/messages/" + id),
};

// ── Upload endpoints ───────────────────────────────────────────
export const uploadAPI = {
  avatar:     (formData) => api.post("/upload/avatar",     formData, { headers: { "Content-Type": "multipart/form-data" } }),
  attachment: (formData) => api.post("/upload/attachment", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

export default api;
