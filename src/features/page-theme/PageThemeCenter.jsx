import { PAGE_THEME_COLOR_FIELDS, usePageTheme } from "../../theme/page-themes.js";
import "./page-theme-center.less";

export default function PageThemeCenter({ onClose }) {
  const {
    theme,
    themeId,
    density,
    themes,
    customPalette,
    hasCustomColors,
    setThemeId,
    setCustomColor,
    setDensity,
    resetColors,
  } = usePageTheme();

  return (
    <section className="page-theme-center" aria-label="页面主题中心">
      <div className="page-theme-center-heading">
        <div>
          <span className="page-theme-kicker">UI APPEARANCE</span>
          <h2>页面主题</h2>
          <p>只调整页面工作区，不会改动模型的灯光、背景和视觉方案。</p>
        </div>
        <button type="button" className="page-theme-close" onClick={onClose} aria-label="关闭主题中心">×</button>
      </div>

      <div className="page-theme-grid">
        {themes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`page-theme-option ${themeId === item.id ? "is-active" : ""}`}
            onClick={() => setThemeId(item.id)}
            aria-pressed={themeId === item.id}
          >
            <span
              className="page-theme-preview"
              style={{ background: `linear-gradient(135deg, ${item.surfaceStrong}, ${item.pageBackground})` }}
            >
              <i style={{ backgroundColor: item.accent }} />
              <i style={{ backgroundColor: item.accentStrong }} />
              <b style={{ borderColor: item.accent }} />
            </span>
            <span className="page-theme-option-copy">
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
            <span className="page-theme-check" aria-hidden="true">{themeId === item.id ? "✓" : ""}</span>
          </button>
        ))}
      </div>

      <div className="page-theme-customize">
        <div className="page-theme-customize-heading">
          <span>
            <strong>自定义页面色调</strong>
            <small>只影响页面 UI，不会改变模型的灯光、材质与背景。</small>
          </span>
          <button type="button" className="page-theme-reset" onClick={resetColors} disabled={!hasCustomColors}>
            重置
          </button>
        </div>
        <div className="page-theme-color-grid">
          {PAGE_THEME_COLOR_FIELDS.map((field) => {
            const color = customPalette[field.key] || theme[field.key];
            return (
              <label key={field.key} htmlFor={`page-theme-${field.key}`} className="page-theme-color-field">
                <span>
                  <strong>{field.label}</strong>
                  <small>{field.description}</small>
                </span>
                <span className="page-theme-color-input">
                  <code>{color.toUpperCase()}</code>
                  <input
                    id={`page-theme-${field.key}`}
                    type="color"
                    value={color}
                    aria-label={field.label}
                    onChange={(event) => setCustomColor(field.key, event.target.value)}
                  />
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="page-theme-density" aria-label="界面密度">
        <span>
          <strong>界面密度</strong>
          <small>控制工作区留白和信息排列密度</small>
        </span>
        <div>
          <button type="button" className={density === "standard" ? "is-active" : ""} onClick={() => setDensity("standard")}>标准</button>
          <button type="button" className={density === "compact" ? "is-active" : ""} onClick={() => setDensity("compact")}>紧凑</button>
        </div>
      </div>
    </section>
  );
}
