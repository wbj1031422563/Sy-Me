import { useEffect, useState } from "react";

const INITIAL_VALUES = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ModelNodeTransformPanel({
  selectedCount = 0,
  onApplyDelta,
  onReset,
}) {
  const [values, setValues] = useState(INITIAL_VALUES);

  useEffect(() => {
    setValues({
      position: [...INITIAL_VALUES.position],
      rotation: [...INITIAL_VALUES.rotation],
      scale: INITIAL_VALUES.scale,
    });
  }, [selectedCount]);

  if (selectedCount === 0) return null;

  const updateVector = (key, index, value) => {
    setValues((previous) => ({
      ...previous,
      [key]: previous[key].map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  };

  const apply = () => {
    onApplyDelta?.({
      position: values.position.map((value) => toNumber(value)),
      rotation: values.rotation.map((value) => (toNumber(value) * Math.PI) / 180),
      scale: Math.max(0.01, toNumber(values.scale, 1)),
    });
  };

  return (
    <section className="asset-node-transform">
      <h3>选中节点批量变换</h3>
      <p className="asset-workbench-hint">
        已选 {selectedCount} 个节点；位移单位为场景单位，旋转输入角度，缩放为倍率。
      </p>
      <div className="asset-node-transform-grid">
        {[
          ["position", 0, "X 位移"],
          ["position", 1, "Y 位移"],
          ["position", 2, "Z 位移"],
          ["rotation", 0, "X 旋转"],
          ["rotation", 1, "Y 旋转"],
          ["rotation", 2, "Z 旋转"],
        ].map(([key, index, label]) => (
          <label key={label}>
            <span>{label}</span>
            <input
              aria-label={label}
              type="number"
              step={key === "position" ? "0.01" : "1"}
              value={values[key][index]}
              onChange={(event) => updateVector(key, index, event.target.value)}
            />
          </label>
        ))}
        <label>
          <span>缩放倍率</span>
          <input
            aria-label="缩放倍率"
            type="number"
            min="0.01"
            step="0.01"
            value={values.scale}
            onChange={(event) => setValues((previous) => ({
              ...previous,
              scale: event.target.value,
            }))}
          />
        </label>
      </div>
      <div className="asset-node-transform-actions">
        <button type="button" className="asset-primary-button" onClick={apply}>
          应用批量变换
        </button>
        <button type="button" className="asset-secondary-button" onClick={onReset}>
          恢复选中节点变换
        </button>
      </div>
    </section>
  );
}
