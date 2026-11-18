import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./scene-library.less";

const SCENES = [
  { title: "收获机视觉工作台", category: "装配 / 视觉", kind: "assembly", status: "编辑中", detail: "多模型 · 节点树 · 装配方案", to: "/tools/asset-workbench", tone: "green" },
  { title: "收获机展示场景", category: "产品展示", kind: "showcase", status: "可预览", detail: "主题 · 镜头 · 动作 · 性能", to: "/viewer/harvester", tone: "gold" },
];

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "showcase", label: "展示" },
  { id: "assembly", label: "装配" },
];

export default function SceneLibraryPage() {
  const [filter, setFilter] = useState("all");
  const filteredScenes = useMemo(
    () => SCENES.filter((scene) => filter === "all" || scene.kind === filter),
    [filter]
  );

  return (
    <div className="studio-library-page">
      <section className="studio-library-toolbar">
        <div>
          <span className="studio-section-kicker">SCENE LIBRARY</span>
          <h2>场景库</h2>
          <p>从一个模型，到一套可以被展示、装配和对比的场景配置。</p>
        </div>
        <div className="studio-library-actions">
          <Link to="/tools/asset-workbench">＋ 新建场景</Link>
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
            {item.label} <b>{SCENES.filter((scene) => item.id === "all" || scene.kind === item.id).length.toString().padStart(2, "0")}</b>
          </button>
        ))}
      </div>
      <section className="studio-library-grid">
        {filteredScenes.map((scene) => (
          <Link key={scene.title} to={scene.to} className={`studio-library-card tone-${scene.tone}`}>
            <div className="studio-library-card-visual"><span>{scene.status}</span><i /></div>
            <div className="studio-library-card-body">
              <div><span>{scene.category}</span><small>SCENE v2</small></div>
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
