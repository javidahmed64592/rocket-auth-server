import { Alert, Snackbar } from "@mui/material";
import type { NotificationType } from "@/types/types";

export default function PopupNotification({ notification, onClose }: { notification: NotificationType; onClose: () => void }) {
  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={notification.severity} variant="filled" sx={{ width: "100%" }}>
        {notification.message}
      </Alert>
    </Snackbar>
  );
}
