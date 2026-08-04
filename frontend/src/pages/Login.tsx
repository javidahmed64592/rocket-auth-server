import { Box } from "@mui/material";
import { type SubmitEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { NotificationType } from "@/types/types";

import { login } from "@/lib/api";
import LoginForm from "@/components/LoginForm";
import PopupNotification from "@/components/PopupNotification";

function isSafeRedirect(url: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.hostname.endsWith(".lab.home.arpa");
  } catch {
    return false;
  }
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationType>({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchParams] = useSearchParams();

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
        const redirect = searchParams.get("redirect");
        window.location.href = isSafeRedirect(redirect) ? redirect! : "/";
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
  );
}
