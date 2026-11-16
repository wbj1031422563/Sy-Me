import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import PageThemeControl from "../../features/page-theme/PageThemeControl.jsx";
import "./studio-layout.less";

const NAV_ITEMS = [
  { to: "/studio", label: "工作区总览", icon: "⌂", end: true },
  { to: "/studio/scenes", label: "场景库", icon: "▦" },
  { to: "/studio/assets", label: "资产目录", icon: "◇" },
  { to: "/studio/operations", label: "作业模拟", icon: "▶" },
  { to: "/studio/diagnostics", label: "诊断中心", icon: "⌁" },
];

const PAGE_META = {
  "/studio": { eyebrow: "SCENE OPERATIONS", title: "工作区总览" },
  "/studio/scenes": { eyebrow: "SCENE LIBRARY", title: "场景库" },
  "/studio/assets": { eyebrow: "ASSET CATALOG", title: "资产目录" },
  "/studio/operations": { eyebrow: "FIELD OPERATIONS", title: "作业模拟" },
  "/studio/diagnostics": { eyebrow: "DIAGNOSTICS", title: "诊断中心" },
};

export default function StudioLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = PAGE_META[location.pathname] || PAGE_META["/studio"];

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <div className="studio-brand">
          <span className="studio-brand-mark">SY</span>
          <div>
            <strong>SY·ME</strong>
            <small>SCENE OPERATIONS</small>
          </div>
        </div>

        <div className="studio-workspace-card">
          <span>当前工作区</span>
          <strong>农机数字孪生</strong>
          <small>Scene Schema v2 · 本地工作区</small>
        </div>

        <nav className="studio-nav" aria-label="场景工作区导航">
          <span className="studio-nav-label">工作区</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              <span className="studio-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="studio-sidebar-footer">
          <span className="studio-sync-dot" aria-hidden="true" />
          <span>本地配置已就绪</span>
          <button type="button" onClick={() => navigate("/")}>返回首页</button>
        </div>
      </aside>

      <main className="studio-main">
        <header className="studio-topbar">
          <div>
            <span className="studio-topbar-eyebrow">{meta.eyebrow}</span>
            <h1>{meta.title}</h1>
          </div>
          <div className="studio-topbar-actions">
            <PageThemeControl className="studio-theme-action" />
            <span className="studio-status-pill"><i /> 本地工作区</span>
            <button type="button" onClick={() => navigate("/tools/asset-workbench")}>打开资产工作台</button>
          </div>
        </header>
        <div className="studio-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
