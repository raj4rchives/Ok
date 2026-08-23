const THEMES = {
  blackGold: {
    bg: "#0b0b0b",
    surface: "#151515",
    primary: "#d4af37",
    secondary: "#f0d878",
    text: "#ffffff",
    muted: "#999999",
    border: "#d4af37",
    shadow: "#000000"
  },

  studyPink: {
    bg: "#f4f3ff",
    surface: "#ffffff",
    primary: "#ff8fae",
    secondary: "#ffd2dd",
    text: "#304267",
    muted: "#7c88a5",
    border: "#53668f",
    shadow: "#53668f"
  },

  blueWhite: {
    bg: "#eef6ff",
    surface: "#ffffff",
    primary: "#5b8def",
    secondary: "#dce9ff",
    text: "#263858",
    muted: "#71809c",
    border: "#5272a5",
    shadow: "#5272a5"
  },

  purple: {
    bg: "#f5efff",
    surface: "#ffffff",
    primary: "#9b6cff",
    secondary: "#e5d8ff",
    text: "#392858",
    muted: "#81749a",
    border: "#7653ad",
    shadow: "#7653ad"
  }
};

const DEFAULT_THEME = "blackGold";

function setTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return;

  const root = document.documentElement;

  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--shadow", theme.shadow);

  localStorage.setItem("jee-theme", themeName);
}

const savedTheme = localStorage.getItem("jee-theme") || DEFAULT_THEME;
setTheme(savedTheme);
