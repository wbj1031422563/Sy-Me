import { Link } from "react-router-dom";

const SCENES = [
  { title: "收获机视觉工作台", category: "装配 / 视觉", status: "编辑中", detail: "多模型 · 节点树 · 装配方案", to: "/tools/asset-workbench", tone: "green" },
  { title: "收获机展示场景", category: "产品展示", status: "可预览", detail: "主题 · 镜头 · 动作 · 性能", to: "/viewer/harvester", tone: "gold" },
  { title: "猴头多模型展厅", category: "场景展示", status: "可预览", detail: "多模型 · 热点 · 材质变体", to: "/viewer/houtou", tone: "purple" },
  { title: "田间收割演示", category: "作业模拟", status: "规划中", detail: "地块 · 路线 · 天气 · 遥测", to: "/studio/operations", tone: "blue" },
];

export default function SceneLibraryPage() {
  return (
    <div className="studio-library-page">
      <section className="studio-library-toolbar">
        <div>
          <span className="studio-section-kicker">SCENE LIBRARY</span>
          <h2>场景库</h2>
          <p>从一个模型，到一套可以被展示、装配和执行的场景配置。</p>
        </div>
        <div className="studio-library-actions">
          <button type="button" disabled>＋ 新建场景</button>
          <Link to="/tools/asset-workbench">打开工作台</Link>
        </div>
      </section>
      <div className="studio-filter-row" aria-label="场景筛选">
        <button type="button" className="is-active">全部 <b>04</b></button>
        <button type="button">展示 <b>02</b></button>
        <button type="button">装配 <b>01</b></button>
        <button type="button">作业 <b>01</b></button>
      </div>
      <section className="studio-library-grid">
        {SCENES.map((scene) => (
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
      </section>
    </div>
  );
}
