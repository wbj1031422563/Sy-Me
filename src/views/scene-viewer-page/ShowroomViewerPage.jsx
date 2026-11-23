import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import SceneViewer from "../../viewer/SceneViewer.jsx";
import { getShowroomEntry } from "../../scenes/showroom-catalog.js";
import { getShowcaseLibraryEntry } from "../../features/asset-workbench/showcase-library.js";
import HarvesterPage from "./harvester-page.jsx";
import "./harvester-page.less";

/**
 * 通用展厅路由：/viewer/:sceneId
 * - harvester → 沉浸式收获机展台
 * - 本地方案 → SceneViewer showcase
 * - legacy Demo → 重定向到既有路由
 */
export default function ShowroomViewerPage() {
  const { sceneId } = useParams();
  const navigate = useNavigate();
  const [localScene, setLocalScene] = useState(null);
  const [status, setStatus] = useState("loading");

  const catalogEntry = useMemo(
    () => (sceneId ? getShowroomEntry(sceneId) : null),
    [sceneId]
  );

  useEffect(() => {
    if (!sceneId) {
      setStatus("missing");
      return;
    }
    if (sceneId === "harvester") {
      setStatus("harvester");
      return;
    }
    if (catalogEntry?.viewer === "legacy" && catalogEntry.route) {
      setStatus("legacy");
      return;
    }
    if (catalogEntry?.viewer === "scene" && catalogEntry.createScene) {
      setLocalScene(catalogEntry.createScene());
      setStatus("ready");
      return;
    }
    const saved = getShowcaseLibraryEntry(sceneId);
    if (saved?.scene) {
      setLocalScene(saved.scene);
      setStatus("ready");
      return;
    }
    setStatus("missing");
  }, [catalogEntry, sceneId]);

  if (status === "harvester") {
    return <HarvesterPage />;
  }

  if (status === "legacy" && catalogEntry?.route) {
    return <Navigate to={catalogEntry.route} replace />;
  }

  if (status === "loading") {
    return (
      <main className="harvester-showcase-landing">
        <div className="harvester-showcase-message">正在载入展厅场景…</div>
      </main>
    );
  }

  if (status === "missing" || !localScene) {
    return (
      <main className="harvester-showcase-landing">
        <div className="harvester-showcase-landing-mark">SY·ME</div>
        <h1>未找到展厅场景</h1>
        <p>场景标识「{sceneId}」不在注册表，也没有对应的本地方案。</p>
        <div className="harvester-showcase-landing-actions">
          <button type="button" className="harvester-showcase-primary" onClick={() => navigate("/viewer/harvester")}>
            进入收获机展厅
          </button>
          <Link className="harvester-showcase-secondary" to="/studio/scenes" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}>
            返回场景库
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="harvester-showcase-page">
      <SceneViewer scene={localScene} mode="showcase" />
      <div className="harvester-showroom-chrome">
        <header className="harvester-showroom-brand">
          <div>
            <span className="harvester-showroom-brand-mark">SY·ME</span>
            <strong>{localScene.title || sceneId}</strong>
            <small>展厅方案 · {sceneId}</small>
          </div>
          <div className="harvester-showroom-brand-actions">
            <Link to="/studio/scenes">场景库</Link>
            <Link to="/">门户</Link>
          </div>
        </header>
      </div>
    </div>
  );
}
