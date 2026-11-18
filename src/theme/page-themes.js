import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";

export const PAGE_THEME_STORAGE_KEY = "sy-me.page-theme.v1";
export const DEFAULT_PAGE_THEME_ID = "forest";
export const DEFAULT_PAGE_DENSITY = "standard";

export const PAGE_THEME_COLOR_FIELDS = [
  { key: "accent", label: "强调色", description: "按钮、导航、选中状态" },
  { key: "accentStrong", label: "强调深色", description: "高亮背景与悬停状态" },
  { key: "pageBackground", label: "页面背景", description: "全局工作区底色" },
  { key: "surface", label: "面板底色", description: "卡片、侧栏和内容区域" },
  { key: "surfaceStrong", label: "面板高亮", description: "输入框和重点面板" },
  { key: "text", label: "主要文字", description: "标题与核心信息" },
  { key: "muted", label: "辅助文字", description: "说明、标签与次要信息" },
];

export const PAGE_THEMES = [
  {
    id: "forest",
    label: "森林作业",
    description: "当前默认主题，适合整机装配与日常工作流。",
    accent: "#9ee4b8",
    accentStrong: "#4fc483",
    pageBackground: "#08100f",
    surface: "#0d1a18",
    surfaceStrong: "#12231f",
    text: "#edf7f1",
    muted: "#86a999",
    border: "rgba(152, 211, 178, 0.16)",
    glow: "rgba(53, 118, 92, 0.18)",
    panel: "rgba(8, 17, 20, 0.9)",
  },
  {
    id: "amber",
    label: "麦田金",
    description: "暖金与深棕的展示主题，适合产品主视觉。",
    accent: "#f2c26b",
    accentStrong: "#d89436",
    pageBackground: "#15100b",
    surface: "#211910",
    surfaceStrong: "#2b2013",
    text: "#fff4df",
    muted: "#bda281",
    border: "rgba(244, 194, 107, 0.2)",
    glow: "rgba(174, 116, 43, 0.2)",
    panel: "rgba(25, 17, 12, 0.92)",
  },
  {
    id: "ocean",
    label: "工业蓝",
    description: "冷静的蓝青配色，适合结构检查与技术演示。",
    accent: "#9bd8ff",
    accentStrong: "#4b9ed6",
    pageBackground: "#08121b",
    surface: "#0d1c29",
    surfaceStrong: "#12283a",
    text: "#edf8ff",
    muted: "#86aabd",
    border: "rgba(125, 196, 237, 0.2)",
    glow: "rgba(44, 115, 162, 0.2)",
    panel: "rgba(8, 18, 28, 0.92)",
  },
  {
    id: "violet",
    label: "夜航紫",
    description: "紫蓝夜景主题，适合灯光与夜间模型展示。",
    accent: "#d4b6ff",
    accentStrong: "#8f67cf",
    pageBackground: "#100d1a",
    surface: "#1a1427",
    surfaceStrong: "#241a36",
    text: "#f8f2ff",
    muted: "#a89abd",
    border: "rgba(193, 158, 255, 0.2)",
    glow: "rgba(111, 73, 170, 0.22)",
    panel: "rgba(16, 12, 25, 0.93)",
  },
  {
    id: "ivory",
    label: "浅色图纸",
    description: "高对比浅色主题，适合长时间阅读和方案评审。",
    accent: "#176b4d",
    accentStrong: "#0b8a5a",
    pageBackground: "#eef3ef",
    surface: "#ffffff",
    surfaceStrong: "#e4eee8",
    text: "#173127",
    muted: "#60786d",
    border: "rgba(36, 93, 67, 0.18)",
    glow: "rgba(76, 156, 111, 0.18)",
    panel: "rgba(248, 252, 249, 0.96)",
  },
];

const PageThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(PAGE_THEME_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return {};
    return saved;
  } catch {
    return {};
  }
}

function isValidColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function hexToRgba(value, alpha) {
  if (!isValidColor(value)) return `rgba(152, 211, 178, ${alpha})`;
  const number = Number.parseInt(value.slice(1), 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function isLightColor(value) {
  if (!isValidColor(value)) return false;
  const number = Number.parseInt(value.slice(1), 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return ((red * 299) + (green * 587) + (blue * 114)) / 1000 > 165;
}

function readCustomPalette(stored) {
  const palette = stored?.customPalette;
  if (!palette || typeof palette !== "object") {
    return isValidColor(stored?.customAccent) ? { accent: stored.customAccent } : {};
  }
  return PAGE_THEME_COLOR_FIELDS.reduce((result, field) => {
    if (isValidColor(palette[field.key])) result[field.key] = palette[field.key];
    return result;
  }, {});
}

export function PageThemeProvider({ children }) {
  const [stored] = useState(readStoredTheme);
  const [themeId, setThemeId] = useState(() => (
    PAGE_THEMES.some((theme) => theme.id === stored.themeId)
      ? stored.themeId
      : DEFAULT_PAGE_THEME_ID
  ));
  const [customAccent, setCustomAccent] = useState(() => (
    isValidColor(stored.customAccent) ? stored.customAccent : null
  ));
  const [customPalette, setCustomPalette] = useState(() => readCustomPalette(stored));
  const [density, setDensity] = useState(() => (
    stored.density === "compact" ? "compact" : DEFAULT_PAGE_DENSITY
  ));

  const baseTheme = PAGE_THEMES.find((item) => item.id === themeId) || PAGE_THEMES[0];
  const theme = useMemo(() => {
    const palette = { ...customPalette };
    if (customAccent && !palette.accent) palette.accent = customAccent;
    const resolved = { ...baseTheme, ...palette };
    return {
      ...resolved,
      border: palette.accent ? hexToRgba(resolved.accent, 0.2) : baseTheme.border,
      glow: palette.accentStrong
        ? hexToRgba(resolved.accentStrong, 0.2)
        : baseTheme.glow,
      panel: palette.pageBackground
        ? hexToRgba(resolved.pageBackground, isLightColor(resolved.pageBackground) ? 0.96 : 0.92)
        : baseTheme.panel,
    };
  }, [baseTheme, customAccent, customPalette]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.pageTheme = theme.id;
    root.dataset.pageDensity = density;
    root.style.setProperty("--page-bg", theme.pageBackground);
    root.style.setProperty("--page-surface", theme.surface);
    root.style.setProperty("--page-surface-strong", theme.surfaceStrong);
    root.style.setProperty("--page-text", theme.text);
    root.style.setProperty("--page-muted", theme.muted);
    root.style.setProperty("--page-accent", theme.accent);
    root.style.setProperty("--page-accent-strong", theme.accentStrong);
    root.style.setProperty("--page-border", theme.border);
    root.style.setProperty("--page-glow", theme.glow);
    root.style.setProperty("--page-panel", theme.panel);
    root.dataset.pageCustom = Object.keys(customPalette).length > 0 ? "true" : "false";
    root.style.colorScheme = isLightColor(theme.pageBackground) ? "light" : "dark";

    localStorage.setItem(PAGE_THEME_STORAGE_KEY, JSON.stringify({
      themeId: theme.id,
      customAccent: customPalette.accent || customAccent,
      customPalette,
      density,
    }));
  }, [customAccent, customPalette, density, theme]);

  const value = useMemo(() => ({
    theme,
    themeId,
    customAccent: customPalette.accent || customAccent,
    customPalette,
    hasCustomColors: Object.keys(customPalette).length > 0,
    density,
    themes: PAGE_THEMES,
    setThemeId: (nextId) => {
      if (PAGE_THEMES.some((item) => item.id === nextId)) setThemeId(nextId);
    },
    setCustomAccent: (nextAccent) => {
      setCustomAccent(isValidColor(nextAccent) ? nextAccent : null);
      setCustomPalette((current) => {
        if (!isValidColor(nextAccent)) {
          const nextPalette = { ...current };
          delete nextPalette.accent;
          return nextPalette;
        }
        return { ...current, accent: nextAccent };
      });
    },
    setCustomColor: (key, nextColor) => {
      if (!PAGE_THEME_COLOR_FIELDS.some((field) => field.key === key)) return;
      if (!isValidColor(nextColor)) return;
      setCustomPalette((current) => ({ ...current, [key]: nextColor }));
    },
    setDensity: (nextDensity) => {
      if (nextDensity === "compact" || nextDensity === DEFAULT_PAGE_DENSITY) {
        setDensity(nextDensity);
      }
    },
    resetTheme: () => {
      setCustomAccent(null);
      setCustomPalette({});
    },
    resetColors: () => {
      setCustomAccent(null);
      setCustomPalette({});
    },
  }), [customAccent, customPalette, density, theme, themeId]);

  return createElement(PageThemeContext.Provider, { value }, children);
}

export function usePageTheme() {
  const context = useContext(PageThemeContext);
  if (!context) throw new Error("usePageTheme must be used inside PageThemeProvider");
  return context;
}
