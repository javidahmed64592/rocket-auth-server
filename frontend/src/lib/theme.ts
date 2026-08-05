import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#1a1a1a",
      paper: "#282a28",
    },
    primary: {
      main: "#00a80e",
      light: "#57BB53",
    },
    error: {
      main: "#ff0040",
    },
    text: {
      primary: "#d7efd5",
      secondary: "#8aaa88",
    },
    divider: "#1d1e1d",
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #1d1e1d",
        },
      },
    },
  },
});

export default theme;
