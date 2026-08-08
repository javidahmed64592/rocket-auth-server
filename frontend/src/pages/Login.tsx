import { Box } from "@mui/material";
import { type SubmitEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import LoginForm from "@/components/LoginForm";
import PopupNotification from "@/components/PopupNotification";
import { login } from "@/lib/api";
import type { NotificationType } from "@/types/types";

const AUTH_COOKIE_DOMAIN = import.meta.env.VITE_AUTH_COOKIE_DOMAIN;
if (!AUTH_COOKIE_DOMAIN) {
  throw new Error("VITE_AUTH_COOKIE_DOMAIN must be set at build time");
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  function isSafeRedirect(url: string | null) {
    if (!url) {
      return false;
    }

    try {
      const parsed = new URL(url!, window.location.origin);
      return parsed.hostname.endsWith(AUTH_COOKIE_DOMAIN);
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (!isSafeRedirect(redirect)) {
      navigate("/error");
    }
  }, [redirect, navigate]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationType>({
    open: false,
    message: "",
    severity: "success",
  });

  function closeNotification() {
    setNotification((n) => ({ ...n, open: false }));
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await login(username, password);
      if (ok) {
        setNotification({
          open: true,
          message: "Login successful!",
          severity: "success",
        });
        window.location.href = redirect!;
      } else {
        setNotification({
          open: true,
          message: "Invalid username or password!",
          severity: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    isSafeRedirect(redirect) && (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <LoginForm
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          submitting={submitting}
          handleSubmit={handleSubmit}
        />
        <PopupNotification
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    )
  );
}
