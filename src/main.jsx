import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./EctraServiceCenter.jsx";
import Landing from "./Landing.jsx";
import SupportCenter from "./SupportCenter.jsx";
import ResetPassword from "./ResetPassword.jsx";

function Root() {
  // لو الرابط فيه ?reset=TOKEN نفتح شاشة إعادة تعيين كلمة السر فورًا
  const resetToken = new URLSearchParams(window.location.search).get("reset");
  if (resetToken !== null) return <ResetPassword token={resetToken} />;

  // "landing" | "support" | "admin"
  const [view, setView] = useState("landing");

  if (view === "admin") return <App />;
  if (view === "support") return <SupportCenter onBack={() => setView("landing")} />;
  return (
    <Landing
      onEnter={() => setView("support")}
      onEnterAdmin={() => setView("admin")}
    />
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
