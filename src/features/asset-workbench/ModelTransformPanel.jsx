function NumberField({ label, value, step = 0.1, onChange }) {
  return (
    <label className="asset-transform-number">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function VectorFields({ label, value = [], step = 0.1, suffix = "", onChange }) {
  return (
    <div className="asset-transform-vector">
      <span className="asset-tuning-label">{label}{suffix}</span>
      <div className="asset-transform-number-grid">
        {[["X", 0], ["Y", 1], ["Z", 2]].map(([axis, index]) => (
          <NumberField
            key={axis}
            label={axis}
            step={step}
            value={value[index]}
            onChange={(next) => {
              const vector = [...value];
              vector[index] = next;
              onChange(vector);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ModelTransformPanel({ model, onUpdate, onReset }) {
  if (!model) return null;
  const rotationDegrees = (model.rotation || [0, 0, 0]).map((value) => (value * 180) / Math.PI);

  return (
    <section className="asset-model-transform" aria-label="模型变换">
      <div className="asset-capability-heading">
        <div>
          <h3>模型变换与落地</h3>
          <p>调整当前模型的位置、旋转、缩放和自动落地方式。</p>
        </div>
      </div>
      <p className="asset-workbench-hint">当前模型：{model.label || model.id}</p>
      <VectorFields label="位置" value={model.position} onChange={(position) => onUpdate({ position, autoFrame: false })} />
      <VectorFields
        label="旋转"
        suffix="（度）"
        value={rotationDegrees}
        onChange={(degrees) => onUpdate({ rotation: degrees.map((value) => (value * Math.PI) / 180), autoFrame: false })}
      />
      <NumberField label="统一缩放" step={0.01} value={model.scale ?? 1} onChange={(scale) => onUpdate({ scale: Math.max(0.01, scale), autoFrame: false })} />
      <label className="asset-tuning-checkbox">
        <input type="checkbox" checked={model.autoFrame === true} onChange={(event) => onUpdate({ autoFrame: event.target.checked })} />
        <span>加载后自动居中并落地</span>
      </label>
      <div className="asset-transform-actions">
        <button type="button" className="asset-secondary-button" onClick={() => onUpdate({ autoFrame: true })}>自动落地</button>
        <button type="button" className="asset-secondary-button" onClick={onReset}>重置变换</button>
      </div>
    </section>
  );
}
