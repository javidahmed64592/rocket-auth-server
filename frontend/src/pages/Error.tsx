import { Box, Stack, Typography } from "@mui/material";

import logo from "@/assets/logo.svg";

export default function Error() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 5,
      }}
    >
      <Stack
        sx={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{ width: "40%", maxWidth: "180px", marginBottom: "5%" }}
        />
        <Typography variant="h4" gutterBottom>
          Woops!
        </Typography>
        <Typography variant="body1" gutterBottom>
          Either you do not have permission to access this page, or the page
          does not exist.
        </Typography>
      </Stack>
    </Box>
  );
}
