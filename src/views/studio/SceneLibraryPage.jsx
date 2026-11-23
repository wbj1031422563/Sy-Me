import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listShowroomEntries } from "../../scenes/showroom-catalog.js";
import { listShowcaseLibrary } from "../../features/asset-workbench/showcase-library.js";
import "./scene-library.less";

const BUILTIN_SCENES = [
  {
    id: "harvester-showcase",
    title: "收获机展厅",
    category: "主推展厅",
    kind: "showcase",
    status: "主推",
    detail: "主题 · 镜头 · 热点 · 巡演",
    to: "/viewer/harvester",
    tone: "gold",
    featured: true,
  },
  {
    id: "harvester-workbench",
    title: "收获机视觉工作台",
    category: "装配 / 视觉",
    kind: "assembly",
    status: "编辑中",
    detail: "多模型 · 节点树 · 装配方案",
    to: "/tools/asset-workbench",
    tone: "green",
  },
];

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "showcase", label: "展示" },
  { id: "assembly", label: "装配" },
  { id: "local", label: "本地方案" },
];

function buildLibraryScenes() {
  const catalogExtras = listShowroomEntries()
    .filter((entry) => entry.id !== "harvester")
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      category: entry.category || "精品 Demo",
      kind: "showcase",
      status: "Demo",
      detail: entry.subtitle,
      to: entry.route,
      tone: "gold",
    }));

  const localScenes = listShowcaseLibrary().map((entry) => ({
    id: entry.id,
    title: entry.title,
    category: "本地方案",
    kind: "local",
    status: entry.status || "已保存",
    detail: entry.detail || "工作台导出",
    to: entry.to || `/viewer/${entry.id}`,
    tone: "gold",
  }));

  return [...BUILTIN_SCENES, ...catalogExtras, ...localScenes];
}

export default function SceneLibraryPage() {
  const [filter, setFilter] = useState("all");
  const scenes = useMemo(() => buildLibraryScenes(), []);
  const filteredScenes = useMemo(
    () => scenes.filter((scene) => filter === "all" || scene.kind === filter),
    [filter, scenes]
  );

  return (
    <div className="studio-library-page">
      <section className="studio-library-toolbar">
        <div>
          <span className="studio-section-kicker">SCENE LIBRARY</span>
          <h2>场景库</h2>
          <p>收获机展厅为主推入口；工作台导出的本地方案会出现在这里。</p>
        </div>
        <div className="studio-library-actions">
          <Link to="/viewer/harvester">进入主推展厅</Link>
          <Link to="/tools/asset-workbench">打开工作台</Link>
        </div>
      </section>
      <div className="studio-filter-row" aria-label="场景筛选">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? "is-active" : ""}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}{" "}
            <b>
              {scenes
                .filter((scene) => item.id === "all" || scene.kind === item.id)
                .length
                .toString()
                .padStart(2, "0")}
            </b>
          </button>
        ))}
      </div>
      <section className="studio-library-grid">
        {filteredScenes.map((scene) => (
          <Link
            key={scene.id}
            to={scene.to}
            className={`studio-library-card tone-${scene.tone}${scene.featured ? " is-featured" : ""}`}
          >
            <div className="studio-library-card-visual">
              <span>{scene.status}</span>
              <i />
            </div>
            <div className="studio-library-card-body">
              <div>
                <span>{scene.category}</span>
                <small>SCENE v2</small>
              </div>
              <h3>{scene.title}</h3>
              <p>{scene.detail}</p>
              <strong>打开场景 <em>→</em></strong>
            </div>
          </Link>
        ))}
        {filteredScenes.length === 0 && <p className="studio-library-empty">当前筛选条件下没有场景。</p>}
      </section>
    </div>
  );
}
