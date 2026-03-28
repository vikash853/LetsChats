import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // ── Verify token on app startup ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    authAPI.getMe()
      .then(({ data }) => {
        setUser(data.user);
        connectSocket(token);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login — accepts (token, user) from LoginPage/RegisterPage ─
  // Also supports old usage login(email, password) for compatibility
  const login = useCallback(async (tokenOrEmail, userOrPassword) => {
    // New usage: login(token, userObject)
    if (typeof userOrPassword === "object" && userOrPassword !== null) {
      const token = tokenOrEmail;
      const userData = userOrPassword;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      connectSocket(token);
      return { token, user: userData };
    }
    // Old usage: login(email, password) — still works
    const email    = tokenOrEmail;
    const password = userOrPassword;
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return data;
  }, []);

  // ── Register ─────────────────────────────────────────────────
  const register = useCallback(async (username, email, password) => {
    const { data } = await authAPI.register({ username, email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return data;
  }, []);

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch (_) {}
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // ── Update local user ─────────────────────────────────────────
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
