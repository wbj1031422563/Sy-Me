import { useState } from "react";
import { usePageTheme } from "../../theme/page-themes.js";
import PageThemeCenter from "./PageThemeCenter.jsx";

export default function PageThemeControl({ className = "", label = "页面主题" }) {
  const { theme } = usePageTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className={`page-theme-control ${className}`.trim()}>
      <button
        type="button"
        className="page-theme-control-trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <i style={{ backgroundColor: theme.accent }} />
        {label}
      </button>
      {open && <PageThemeCenter onClose={() => setOpen(false)} />}
    </div>
  );
}
