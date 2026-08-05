import { Button, Paper, TextField, Typography } from "@mui/material";

interface Props {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  submitting: boolean;
  handleSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}

export default function LoginForm({
  username,
  setUsername,
  password,
  setPassword,
  submitting,
  handleSubmit,
}: Props) {
  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={3}
      sx={{
        width: 320,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 3,
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontWeight: 600, textAlign: "center", mb: 1 }}
      >
        Rocket Authentication
      </Typography>
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoFocus
        fullWidth
        size="small"
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        size="small"
      />
      <Button
        type="submit"
        variant="contained"
        disabled={submitting}
        fullWidth
        sx={{ mt: 1 }}
      >
        {submitting ? "Logging in…" : "Log in"}
      </Button>
    </Paper>
  );
}
