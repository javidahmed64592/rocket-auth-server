import { createTheme } from "@mui/material/styles";

// Colours mirror the CSS custom properties in index.css
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#1a1a1a",  // --dash-bg
      paper: "#282a28",    // --dash-surface
    },
    primary: {
      main: "#00a80e",    // --dash-primary
      light: "#57BB53",   // --dash-primary-hover
    },
    error: {
      main: "#ff0040",    // --dash-danger
    },
    text: {
      primary: "#d7efd5",  // --dash-text
      secondary: "#8aaa88",
    },
    divider: "#1d1e1d",    // --dash-border
  },
  shape: {
    borderRadius: 10,      // --dash-radius
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
