import {
  SHOWROOM_PROP_TYPES,
  SHOWROOM_SKINS,
  applyShowroomSkin,
  upsertShowroomPropParams,
} from "../showroom-props/showroom-skins.js";
import {
  STAGE_SURFACE_PRESETS,
  applyStageSurface,
  applyCustomStageSurface,
} from "../showroom-props/stage-surface-presets.js";

function readPropParams(scene, type) {
  return scene?.extensions?.find((item) => item.type === type)?.params || null;
}

function RangeField({ label, min, max, step, value, onChange, digits = 0 }) {
  const shown = digits > 0 ? Number(value).toFixed(digits) : value;
  return (
    <label>
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span>{shown}</span>
    </label>
  );
}

export default function ShowroomPropsPanel({ scene, onChange }) {
  const skinId = scene?.showroomSkin || "none";
  const stageId = scene?.stageSurface || "custom";
  const columns = readPropParams(scene, SHOWROOM_PROP_TYPES.LIGHT_COLUMN);
  const floor = readPropParams(scene, SHOWROOM_PROP_TYPES.SHOWROOM_FLOOR);
  const spots = readPropParams(scene, SHOWROOM_PROP_TYPES.SPOT_RIG);
  const backdrop = readPropParams(scene, SHOWROOM_PROP_TYPES.BACKDROP);

  const applySkin = (nextSkinId) => {
    onChange?.(applyShowroomSkin(scene, nextSkinId));
  };

  const applySurface = (presetId) => {
    onChange?.(applyStageSurface(scene, presetId));
  };

  const patch = (type, next) => {
    onChange?.(upsertShowroomPropParams(scene, type, next));
  };

  return (
    <section className="asset-showroom-props-panel">
      <h3>展厅道具</h3>
      <p className="asset-showroom-props-hint">
        灯柱 / 地台 / 顶光 / 幕墙写入 extensions，可随展厅导出一起保存。
      </p>

      <div className="asset-theme-list">
        {SHOWROOM_SKINS.map((skin) => (
          <button
            key={skin.id}
            type="button"
            className={skinId === skin.id ? "is-active" : ""}
            title={skin.description}
            onClick={() => applySkin(skin.id)}
          >
            {skin.label}
          </button>
        ))}
      </div>

      <div className="asset-showroom-props-fields">
        <strong>背景基面</strong>
        <p className="asset-showroom-props-hint">只改背景 / 地面 / 地台颜色，不改灯柱布局。</p>
        <div className="asset-theme-list">
          {STAGE_SURFACE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={stageId === preset.id ? "is-active" : ""}
              title={preset.description}
              onClick={() => applySurface(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label>
          背景色
          <input
            type="color"
            value={scene?.environment?.background || "#e6e8eb"}
            onChange={(event) => onChange?.(applyCustomStageSurface(scene, { background: event.target.value }))}
          />
        </label>
        <label>
          地面色
          <input
            type="color"
            value={scene?.ground?.color || "#d9dde2"}
            onChange={(event) => onChange?.(applyCustomStageSurface(scene, { groundColor: event.target.value }))}
          />
        </label>
        <label>
          地台色
          <input
            type="color"
            value={floor?.color || scene?.ground?.color || "#f2f4f6"}
            onChange={(event) => onChange?.(applyCustomStageSurface(scene, { floorColor: event.target.value }))}
          />
        </label>
      </div>

      {columns && (
        <div className="asset-showroom-props-fields">
          <strong>灯柱</strong>
          <RangeField label="数量" min={0} max={16} step={1} value={columns.count ?? 8} onChange={(count) => patch(SHOWROOM_PROP_TYPES.LIGHT_COLUMN, { count })} />
          <RangeField label="环绕半径" min={6} max={20} step={0.5} value={columns.radius ?? 12} digits={1} onChange={(radius) => patch(SHOWROOM_PROP_TYPES.LIGHT_COLUMN, { radius })} />
          <RangeField label="高度" min={3} max={10} step={0.1} value={columns.height ?? 5.5} digits={1} onChange={(height) => patch(SHOWROOM_PROP_TYPES.LIGHT_COLUMN, { height })} />
          <label>
            颜色
            <input type="color" value={columns.color || "#f2c26b"} onChange={(event) => patch(SHOWROOM_PROP_TYPES.LIGHT_COLUMN, { color: event.target.value })} />
          </label>
        </div>
      )}

      {floor && (
        <div className="asset-showroom-props-fields">
          <strong>地台</strong>
          <RangeField label="半径" min={6} max={22} step={0.5} value={floor.radius ?? 10} digits={1} onChange={(radius) => patch(SHOWROOM_PROP_TYPES.SHOWROOM_FLOOR, { radius })} />
          <label>
            台面色
            <input type="color" value={floor.color || "#17110c"} onChange={(event) => patch(SHOWROOM_PROP_TYPES.SHOWROOM_FLOOR, { color: event.target.value })} />
          </label>
          <label>
            光环色
            <input
              type="color"
              value={floor.ringColor || "#f2c26b"}
              onChange={(event) => patch(SHOWROOM_PROP_TYPES.SHOWROOM_FLOOR, { ringColor: event.target.value, emissive: event.target.value })}
            />
          </label>
        </div>
      )}

      {spots && (
        <div className="asset-showroom-props-fields">
          <strong>顶光灯位</strong>
          <RangeField label="数量" min={0} max={12} step={1} value={spots.count ?? 4} onChange={(count) => patch(SHOWROOM_PROP_TYPES.SPOT_RIG, { count })} />
          <RangeField label="半径" min={4} max={16} step={0.5} value={spots.radius ?? 9} digits={1} onChange={(radius) => patch(SHOWROOM_PROP_TYPES.SPOT_RIG, { radius })} />
          <RangeField label="高度" min={4} max={12} step={0.1} value={spots.height ?? 7.5} digits={1} onChange={(height) => patch(SHOWROOM_PROP_TYPES.SPOT_RIG, { height })} />
          <RangeField label="强度" min={2} max={40} step={1} value={spots.intensity ?? 18} onChange={(intensity) => patch(SHOWROOM_PROP_TYPES.SPOT_RIG, { intensity })} />
          <label>
            光色
            <input type="color" value={spots.color || "#fff4df"} onChange={(event) => patch(SHOWROOM_PROP_TYPES.SPOT_RIG, { color: event.target.value })} />
          </label>
        </div>
      )}

      {backdrop && (
        <div className="asset-showroom-props-fields">
          <strong>Logo 幕墙</strong>
          <RangeField label="宽度" min={10} max={28} step={0.5} value={backdrop.width ?? 18} digits={1} onChange={(width) => patch(SHOWROOM_PROP_TYPES.BACKDROP, { width })} />
          <RangeField label="高度" min={4} max={10} step={0.1} value={backdrop.height ?? 6.5} digits={1} onChange={(height) => patch(SHOWROOM_PROP_TYPES.BACKDROP, { height })} />
          <RangeField label="距离" min={-24} max={-8} step={0.5} value={backdrop.distance ?? -14} digits={1} onChange={(distance) => patch(SHOWROOM_PROP_TYPES.BACKDROP, { distance })} />
          <label>
            墙面色
            <input type="color" value={backdrop.color || "#12151a"} onChange={(event) => patch(SHOWROOM_PROP_TYPES.BACKDROP, { color: event.target.value })} />
          </label>
          <label>
            强调色
            <input
              type="color"
              value={backdrop.accentColor || "#f2c26b"}
              onChange={(event) => patch(SHOWROOM_PROP_TYPES.BACKDROP, {
                accentColor: event.target.value,
                logoColor: event.target.value,
              })}
            />
          </label>
        </div>
      )}

      {!columns && !floor && !spots && !backdrop && (
        <p className="asset-showroom-props-empty">当前未启用展厅道具，选择一套皮肤即可添加。</p>
      )}
    </section>
  );
}
