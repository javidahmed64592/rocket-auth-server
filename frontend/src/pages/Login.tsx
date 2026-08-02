import { Box } from "@mui/material";
import { type SubmitEvent, useState } from "react";

import { login } from "@/lib/api";
import LoginForm from "@/components/LoginForm";
import PopupNotification from "@/components/PopupNotification";

type Notification = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<Notification>({
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
        setNotification({ open: true, message: "Login successful!", severity: "success" });
      } else {
        setNotification({ open: true, message: "Invalid username or password!", severity: "error" });
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
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={closeNotification}
      />
    </Box>
  );
}
