export default function VisualPresetPanel({ presets, activePresetId, onApply }) {
  return (
    <section className="asset-visual-presets" aria-label="视觉方案中心">
      <div className="asset-capability-heading">
        <div>
          <h3>视觉方案中心</h3>
          <p>一键组合灯光、背景、粒子、后期、色彩、镜头和材质。</p>
        </div>
        <span className={activePresetId === "custom" ? "asset-capability-state" : "asset-capability-state is-ready"}>
          {activePresetId === "custom" ? "自定义" : "已应用"}
        </span>
      </div>
      <div className="asset-visual-preset-list">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activePresetId === preset.id ? "is-active" : ""}
            onClick={() => onApply(preset)}
          >
            <strong>{preset.label}</strong>
            <small>{preset.description}</small>
          </button>
        ))}
      </div>
      <p className="asset-workbench-hint">手动修改任意参数后会标记为“自定义”，仍可通过本地方案保存和导出。</p>
    </section>
  );
}
