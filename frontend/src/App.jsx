/**
 * App.jsx — Root component
 * ─────────────────────────────────────────────────────────────────
 * Sets up:
 *  1. AuthProvider    — user state, login/logout, token validation
 *  2. ChatProvider    — conversations, messages, socket events
 *  3. React Router    — page routing with protected routes
 *
 * Route map:
 *  /           → ChatPage       (protected — must be logged in)
 *  /login      → LoginPage      (public)
 *  /register   → RegisterPage   (public)
 *  *           → redirect to /
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import ProtectedRoute   from "./components/layout/ProtectedRoute";
import ChatPage         from "./pages/ChatPage";
import LoginPage        from "./pages/LoginPage";
import RegisterPage     from "./pages/RegisterPage";

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <ChatProvider>
        <Routes>
          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* Public */}
          <Route path="/login"    element={<LoginPage />}    />
          <Route path="/register" element={<RegisterPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ChatProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;