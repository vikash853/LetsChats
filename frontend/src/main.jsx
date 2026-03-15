import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Migrate old vanished key to new key (one-time cleanup)
try {
  const old = localStorage.getItem("chatapp_vanished");
  if (old) {
    const oldIds = JSON.parse(old);
    const newIds = JSON.parse(localStorage.getItem("chatapp_vanished_v2") || "[]");
    const merged = [...new Set([...oldIds, ...newIds])];
    localStorage.setItem("chatapp_vanished_v2", JSON.stringify(merged));
    localStorage.removeItem("chatapp_vanished");
  }
} catch {}