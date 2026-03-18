import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://letschats-shw9.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = "Bearer " + token;
    return config;
  },
  (error) => Promise.reject(error)
);

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

export const authAPI = {
  register:      (data) => api.post("/auth/register", data),
  login:         (data) => api.post("/auth/login", data),
  firebaseLogin: (data) => api.post("/auth/firebase-login", data), // NEW
  getMe:         ()     => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  logout:        ()     => api.post("/auth/logout"),
};

export const usersAPI = {
  getAll:    (search = "") => api.get("/users?search=" + search),
  getOnline: ()            => api.get("/users/online"),
  getById:   (id)          => api.get("/users/" + id),
};

export const conversationsAPI = {
  getAll:         ()         => api.get("/conversations"),
  accessOrCreate: (userId)   => api.post("/conversations", { userId }),
  createGroup:    (data)     => api.post("/conversations/group", data),
  updateGroup:    (id, data) => api.put("/conversations/group/" + id, data),
};

export const messagesAPI = {
  getByConversation: (conversationId, page = 1) =>
    api.get("/messages/" + conversationId + "?page=" + page),
  send:     (data) => api.post("/messages", data),
  markRead: (cid)  => api.put("/messages/read/" + cid),
  delete:   (id)   => api.delete("/messages/" + id),
};

export const uploadAPI = {
  avatar:     (fd) => api.post("/upload/avatar",     fd, { headers: { "Content-Type": "multipart/form-data" } }),
  attachment: (fd) => api.post("/upload/attachment", fd, { headers: { "Content-Type": "multipart/form-data" } }),
};

export default api;