function NumberField({ label, value, step = 0.1, onChange }) {
  return (
    <label className="asset-camera-number">
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

function VectorFields({ label, value = [], onChange }) {
  return (
    <div className="asset-camera-vector">
      <span className="asset-tuning-label">{label}</span>
      <div className="asset-camera-number-grid">
        {[["X", 0], ["Y", 1], ["Z", 2]].map(([axis, index]) => (
          <NumberField
            key={axis}
            label={axis}
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

export default function CameraPresetPanel({
  shots,
  selectedShotId,
  onSelect,
  onUpdate,
  onAdd,
  onRemove,
}) {
  const selectedShot = shots.find((shot) => shot.id === selectedShotId) || shots[0];
  if (!selectedShot) return null;

  return (
    <section className="asset-camera-presets" aria-label="镜头预设编辑器">
      <div className="asset-capability-heading">
        <div>
          <h3>镜头预设编辑器</h3>
          <p>编辑镜头位置、观察目标和过渡时长，保存到当前场景。</p>
        </div>
        <span className="asset-capability-state is-ready">{shots.length} 个</span>
      </div>
      <div className="asset-camera-toolbar">
        <select value={selectedShot.id} onChange={(event) => onSelect(event.target.value)} aria-label="选择镜头">
          {shots.map((shot) => <option key={shot.id} value={shot.id}>{shot.label}</option>)}
        </select>
        <button type="button" onClick={() => onAdd(selectedShot)}>＋新增</button>
        <button type="button" onClick={() => onRemove(selectedShot.id)} disabled={shots.length <= 1}>删除</button>
      </div>
      <label className="asset-camera-name">
        <span>镜头名称</span>
        <input
          value={selectedShot.label || "未命名镜头"}
          onChange={(event) => onUpdate(selectedShot.id, { label: event.target.value })}
        />
      </label>
      <VectorFields label="相机位置" value={selectedShot.position} onChange={(position) => onUpdate(selectedShot.id, { position })} />
      <VectorFields label="观察目标" value={selectedShot.target} onChange={(target) => onUpdate(selectedShot.id, { target })} />
      <NumberField
        label="过渡时长（毫秒）"
        step={100}
        value={selectedShot.durationMs ?? 1200}
        onChange={(durationMs) => onUpdate(selectedShot.id, { durationMs: Math.max(0, durationMs) })}
      />
      <button type="button" className="asset-primary-button" onClick={() => onSelect(selectedShot.id)}>
        应用当前镜头
      </button>
    </section>
  );
}
