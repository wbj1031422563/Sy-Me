import { useEffect, useMemo, useState } from "react";

const DEFAULT_DRAFT = {
  color: "#d9a52a",
  metalness: 0.65,
  roughness: 0.3,
};

export default function MaterialOverridePanel({ materials = [], overrides = [], onChange }) {
  const materialNames = useMemo(
    () => [...new Set(materials)].filter(Boolean),
    [materials]
  );
  const [selectedMaterial, setSelectedMaterial] = useState(materialNames[0] || "");
  const [draft, setDraft] = useState(DEFAULT_DRAFT);

  useEffect(() => {
    if (!materialNames.includes(selectedMaterial)) {
      setSelectedMaterial(materialNames[0] || "");
    }
  }, [materialNames, selectedMaterial]);

  useEffect(() => {
    const current = overrides.find((item) => item.materialName === selectedMaterial);
    setDraft({
      ...DEFAULT_DRAFT,
      ...current,
    });
  }, [overrides, selectedMaterial]);

  if (materialNames.length === 0) return null;

  const currentOverride = overrides.some((item) => item.materialName === selectedMaterial);
  const applyOverride = () => {
    const next = {
      materialName: selectedMaterial,
      color: draft.color,
      metalness: Number(draft.metalness),
      roughness: Number(draft.roughness),
    };
    onChange([
      ...overrides.filter((item) => item.materialName !== selectedMaterial),
      next,
    ]);
  };

  const resetOverride = () => {
    onChange(overrides.filter((item) => item.materialName !== selectedMaterial));
  };

  return (
    <section className="asset-material-overrides" aria-label="局部材质控制">
      <h3>局部材质控制</h3>
      <p className="asset-workbench-hint">按材质槽独立调整颜色、金属度和粗糙度，不影响其他部件。</p>
      <label className="asset-select-label">
        材质槽
        <select value={selectedMaterial} onChange={(event) => setSelectedMaterial(event.target.value)}>
          {materialNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label className="asset-tuning-color">
        <span>基色</span>
        <input
          type="color"
          value={draft.color}
          onChange={(event) => setDraft((state) => ({ ...state, color: event.target.value }))}
        />
      </label>
      <label className="asset-tuning-control">
        <span>金属度<output>{Number(draft.metalness).toFixed(2)}</output></span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={draft.metalness}
          onChange={(event) => setDraft((state) => ({ ...state, metalness: Number(event.target.value) }))}
        />
      </label>
      <label className="asset-tuning-control">
        <span>粗糙度<output>{Number(draft.roughness).toFixed(2)}</output></span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={draft.roughness}
          onChange={(event) => setDraft((state) => ({ ...state, roughness: Number(event.target.value) }))}
        />
      </label>
      <div className="asset-motion-actions">
        <button type="button" className="asset-primary-button" onClick={applyOverride}>
          应用材质
        </button>
        <button type="button" className="asset-secondary-button" disabled={!currentOverride} onClick={resetOverride}>
          恢复原材质
        </button>
      </div>
      <p className="asset-workbench-hint" role="status">
        已覆盖 {overrides.length} 个材质槽。
      </p>
    </section>
  );
}
