import { Link } from "react-router-dom";

const MODES = [
  {
    id: "showcase",
    index: "01",
    title: "展示模式",
    description: "镜头、灯光、材质和视觉方案，快速生成可交付的产品展示场景。",
    state: "已可用",
    tone: "gold",
    to: "/studio/scenes",
  },
  {
    id: "assembly",
    index: "02",
    title: "装配模式",
    description: "多模型组合、父子关系、挂载点和节点显隐，适合整机与附件配置。",
    state: "已可用",
    tone: "green",
    to: "/tools/asset-workbench",
  },
  {
    id: "diagnostics",
    index: "03",
    title: "诊断中心",
    description: "资产体检、动画、材质、性能和资源加载状态集中查看。",
    state: "部分可用",
    tone: "purple",
    to: "/studio/diagnostics",
  },
];

const RECENT_SCENES = [
  {
    title: "收获机视觉工作台",
    type: "多模型装配 · 视觉配置",
    status: "编辑中",
    className: "scene-card-harvester",
    to: "/tools/asset-workbench",
  },
  {
    title: "收获机展示场景",
    type: "产品展示 · 镜头预设",
    status: "可预览",
    className: "scene-card-showcase",
    to: "/viewer/harvester",
  },
];

export default function StudioHome() {
  return (
    <div className="studio-home">
      <section className="studio-hero-panel">
        <div className="studio-hero-copy">
          <span className="studio-section-kicker">DIGITAL TWIN WORKSPACE / 2026</span>
          <h2>从模型资产，<br /><em>走向展示场景。</em></h2>
          <p>统一管理农机模型、装配关系、视觉方案和模型展厅场景。</p>
          <div className="studio-hero-actions">
            <Link className="studio-primary-action" to="/studio/scenes">浏览场景库 <span>→</span></Link>
            <Link className="studio-secondary-action" to="/tools/asset-workbench">打开资产工作台</Link>
          </div>
        </div>
        <div className="studio-hero-visual" aria-hidden="true">
          <div className="studio-radar-ring ring-one" />
          <div className="studio-radar-ring ring-two" />
          <div className="studio-radar-line line-horizontal" />
          <div className="studio-radar-line line-vertical" />
          <div className="studio-radar-core"><span>SY</span></div>
          <small>SCENE<br />GRAPH</small>
        </div>
      </section>

      <section className="studio-stat-row" aria-label="工作区概览">
        <div><span>场景配置</span><strong>03</strong><small>本地可用</small></div>
        <div><span>模型资产</span><strong>06</strong><small>已接入工作区</small></div>
        <div><span>视觉预设</span><strong>05</strong><small>可直接应用</small></div>
        <div><span>Schema</span><strong>v2</strong><small>迁移已启用</small></div>
      </section>

      <section className="studio-section-block">
        <div className="studio-section-heading">
          <div><span className="studio-section-kicker">WORK MODES</span><h3>选择工作模式</h3></div>
          <p>同一套场景数据，在展示、装配和诊断之间切换。</p>
        </div>
        <div className="studio-mode-grid">
          {MODES.map((mode) => (
            <Link key={mode.id} to={mode.to} className={`studio-mode-card tone-${mode.tone}`}>
              <div className="studio-mode-card-top"><span>{mode.index}</span><b>{mode.state}</b></div>
              <h4>{mode.title}</h4>
              <p>{mode.description}</p>
              <span className="studio-card-arrow">进入模式 →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="studio-section-block studio-recent-block">
        <div className="studio-section-heading">
          <div><span className="studio-section-kicker">RECENT SCENES</span><h3>最近场景</h3></div>
          <Link to="/studio/scenes">查看全部 →</Link>
        </div>
        <div className="studio-scene-grid">
          {RECENT_SCENES.map((scene) => (
            <Link key={scene.title} to={scene.to} className={`studio-scene-card ${scene.className}`}>
              <div className="studio-scene-card-visual"><span>{scene.status}</span><i /></div>
              <div className="studio-scene-card-copy"><h4>{scene.title}</h4><p>{scene.type}</p></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
