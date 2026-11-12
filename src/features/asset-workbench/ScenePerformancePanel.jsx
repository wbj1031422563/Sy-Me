function formatValue(value) {
  return Number.isFinite(value) ? value.toLocaleString("zh-CN") : "—";
}

export default function ScenePerformancePanel({ stats, onOptimize, onRestoreQuality }) {
  const items = [
    ["FPS", stats?.fps, "帧/秒"],
    ["Draw Call", stats?.calls, "次/帧"],
    ["三角面", stats?.triangles, "面/帧"],
    ["几何体", stats?.geometries, "个"],
    ["纹理", stats?.textures, "张"],
  ];

  return (
    <section className="asset-performance-panel" aria-label="实时性能监控">
      <div className="asset-capability-heading">
        <div>
          <h3>实时性能监控</h3>
          <p>用于判断模型面数、后期和粒子是否需要降级。</p>
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
      <p className="asset-workbench-hint">
        建议：FPS 低于 45 时，优先使用“性能优先”并关闭阴影、后期或粒子。
      </p>
      <div className="asset-performance-actions">
        <button type="button" className="asset-secondary-button" onClick={onOptimize}>
          一键性能优化
        </button>
        <button type="button" className="asset-secondary-button" onClick={onRestoreQuality}>
          恢复高质量
        </button>
      </div>
    </section>
  );
}
