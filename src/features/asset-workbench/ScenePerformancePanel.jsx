import { getOptimizationAdvice, getOptimizationPlan } from "./scene-optimization.js";

function formatValue(value) {
  return Number.isFinite(value) ? value.toLocaleString("zh-CN") : "—";
}

export default function ScenePerformancePanel({ stats, scene, onOptimize, onAutoOptimize, onRestoreQuality }) {
  const items = [
    ["FPS", stats?.fps, "帧/秒"],
    ["Draw Call", stats?.calls, "次/帧"],
    ["三角面", stats?.triangles, "面/帧"],
    ["几何体", stats?.geometries, "个"],
    ["纹理", stats?.textures, "张"],
  ];
  const plan = getOptimizationPlan(stats, scene);
  const advice = getOptimizationAdvice(stats, scene);

  return (
    <section className="asset-performance-panel" aria-label="场景优化与实时性能监控">
      <div className="asset-capability-heading">
        <div>
          <h3>场景优化 / 实时性能</h3>
          <p>根据当前模型、渲染开关和实时负载给出可执行建议。</p>
        </div>
        <span className={stats?.fps >= 45 ? "asset-capability-state is-ready" : "asset-capability-state"}>
          {stats ? "实时" : "采集中"}
        </span>
      </div>
      <div className="asset-performance-grid">
        {items.map(([label, value, unit]) => (
          <span key={label}>
            {label}
            <strong>{formatValue(value)}</strong>
            <small>{unit}</small>
          </span>
        ))}
      </div>
      <div className={`asset-optimization-plan is-${plan.id}`}>
        <strong>{plan.label}</strong>
        <span>{plan.description}</span>
      </div>
      <ul className="asset-performance-advice-list">
        {advice.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className="asset-performance-actions">
        <button type="button" className="asset-primary-button" onClick={onAutoOptimize} disabled={plan.id === "none"}>
          应用推荐
        </button>
        <button type="button" className="asset-secondary-button" onClick={onOptimize}>
          激进优化
        </button>
        <button type="button" className="asset-secondary-button" onClick={onRestoreQuality}>
          恢复高质量
        </button>
      </div>
    </section>
  );
}
