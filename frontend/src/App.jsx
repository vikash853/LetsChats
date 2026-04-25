import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import { ChatProvider }  from "./context/ChatContext";
import ProtectedRoute    from "./components/layout/ProtectedRoute";
import ChatPage          from "./pages/ChatPage";
import LoginPage         from "./pages/LoginPage";
import RegisterPage      from "./pages/RegisterPage";
import VerifyEmailPage   from "./pages/VerifyEmailPage";

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <ChatProvider>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login"        element={<LoginPage />}       />
          <Route path="/register"     element={<RegisterPage />}    />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </ChatProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
