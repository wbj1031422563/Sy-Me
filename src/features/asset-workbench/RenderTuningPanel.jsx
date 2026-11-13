import {
  COLOR_GRADE_PRESETS,
  PARTICLE_PRESETS,
  QUALITY_PRESETS,
} from "./visual-presets.js";

function updateSection(onChange, section, values) {
  onChange((previous) => ({
    ...previous,
    [section]: { ...previous[section], ...values },
  }));
}

function updateLight(onChange, id, key, value) {
  onChange((previous) => ({
    ...previous,
    environment: {
      ...previous.environment,
      [id]: { ...previous.environment?.[id], [key]: value },
    },
  }));
}

function updateColorGrade(onChange, values) {
  onChange((previous) => ({
    ...previous,
    effects: {
      ...previous.effects,
      enabled: values.enabled === false ? previous.effects?.enabled : true,
    },
    colorGrade: {
      enabled: true,
      hue: 0,
      saturation: 0,
      brightness: 0,
      contrast: 0,
      rgbGain: [1, 1, 1],
      rgbLift: [0, 0, 0],
      rgbGamma: [1, 1, 1],
      ...previous.colorGrade,
      ...values,
    },
  }));
}

function ChannelControl({ label, values, min, max, step, onChange }) {
  return (
    <div className="asset-rgb-channel-group">
      <span className="asset-rgb-channel-label">{label}</span>
      <div className="asset-rgb-channel-list">
        {[
          ["R", 0],
          ["G", 1],
          ["B", 2],
        ].map(([channel, index]) => (
          <NumberControl
            key={channel}
            label={channel}
            value={values[index]}
            min={min}
            max={max}
            step={step}
            onChange={(value) => {
              const next = [...values];
              next[index] = value;
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NumberControl({ label, value, min, max, step, onChange, suffix }) {
  return (
    <label className="asset-tuning-control">
      <span>{label}<output>{Number(value ?? 0).toFixed(step < 1 ? 2 : 0)}{suffix || ""}</output></span>
      <input type="range" min={min} max={max} step={step} value={value ?? min} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function RenderTuningPanel({ scene, onChange }) {
  const environment = scene.environment || {};
  const effects = scene.effects || {};
  const renderer = scene.renderer || {};
  const particles = scene.particles || {};
  const colorGrade = {
    enabled: true,
    hue: 0,
    saturation: 0,
    brightness: 0,
    contrast: 0,
    rgbGain: [1, 1, 1],
    rgbLift: [0, 0, 0],
    rgbGamma: [1, 1, 1],
    ...scene.colorGrade,
  };
  const particlePreset = particles.enabled ? particles.preset || "custom" : "none";

  const applyQuality = (preset) => {
    onChange((previous) => ({
      ...previous,
      renderer: { ...previous.renderer, ...preset.config.renderer },
      effects: {
        ...previous.effects,
        ...preset.config.effects,
        bloom: { ...previous.effects?.bloom, ...preset.config.effects.bloom },
        vignette: { ...previous.effects?.vignette, ...preset.config.effects.vignette },
        noise: { ...previous.effects?.noise, ...preset.config.effects.noise },
      },
    }));
  };

  const applyParticles = (preset) => {
    onChange((previous) => ({ ...previous, particles: { ...previous.particles, ...preset.config } }));
  };

  return (
    <section className="asset-render-tuning" aria-label="灯光渲染与粒子">
      <div className="asset-capability-heading">
        <div>
          <h3>灯光 / 渲染 / 粒子</h3>
          <p>先用预设快速定调，再用滑杆微调并随场景一起导出。</p>
        </div>
      </div>

      <div className="asset-tuning-group">
        <span className="asset-tuning-label">渲染质量</span>
        <div className="asset-theme-list">
          {QUALITY_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => applyQuality(preset)}>{preset.label}</button>
          ))}
        </div>
      </div>

      <div className="asset-tuning-group">
        <span className="asset-tuning-label">曝光与环境</span>
        <NumberControl label="曝光" value={renderer.exposure} min={0.5} max={2} step={0.05} suffix="×" onChange={(value) => updateSection(onChange, "renderer", { exposure: value })} />
        <NumberControl label="环境光" value={environment.ambientIntensity} min={0} max={1.5} step={0.05} onChange={(value) => updateSection(onChange, "environment", { ambientIntensity: value })} />
        <label className="asset-tuning-color">
          <span>背景色</span>
          <input type="color" value={environment.background || "#071015"} onChange={(event) => updateSection(onChange, "environment", { background: event.target.value })} />
        </label>
        <label className="asset-tuning-checkbox">
          <input type="checkbox" checked={renderer.shadows !== false} onChange={(event) => updateSection(onChange, "renderer", { shadows: event.target.checked })} />
          <span>启用实时阴影</span>
        </label>
      </div>

      <div className="asset-tuning-group">
        <span className="asset-tuning-label">三点灯光</span>
        {[
          ["keyLight", "主光", "#fff0d2"],
          ["fillLight", "补光", "#83b9ff"],
          ["rimLight", "轮廓光", "#ffd18a"],
        ].map(([id, label, fallbackColor]) => {
          const light = environment[id] || {};
          return (
            <div key={id} className="asset-light-control">
              <span>{label}</span>
              <input type="color" value={light.color || fallbackColor} aria-label={`${label}颜色`} onChange={(event) => updateLight(onChange, id, "color", event.target.value)} />
              <NumberControl label="强度" value={light.intensity ?? 1} min={0} max={5} step={0.1} onChange={(value) => updateLight(onChange, id, "intensity", value)} />
            </div>
          );
        })}
      </div>

      <div className="asset-tuning-group asset-color-grade">
        <span className="asset-tuning-label">色彩分级</span>
        <div className="asset-theme-list">
          {COLOR_GRADE_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => updateColorGrade(onChange, preset.config)}>{preset.label}</button>
          ))}
        </div>
        <NumberControl label="色调" value={colorGrade.hue} min={-180} max={180} step={1} suffix="°" onChange={(value) => updateColorGrade(onChange, { hue: value })} />
        <NumberControl label="饱和度" value={colorGrade.saturation} min={-1} max={1} step={0.01} onChange={(value) => updateColorGrade(onChange, { saturation: value })} />
        <NumberControl label="亮度" value={colorGrade.brightness} min={-1} max={1} step={0.01} onChange={(value) => updateColorGrade(onChange, { brightness: value })} />
        <NumberControl label="对比度" value={colorGrade.contrast} min={-1} max={1} step={0.01} onChange={(value) => updateColorGrade(onChange, { contrast: value })} />
        <ChannelControl label="RGB Gain 增益" values={colorGrade.rgbGain} min={0.5} max={1.5} step={0.01} onChange={(value) => updateColorGrade(onChange, { rgbGain: value })} />
        <ChannelControl label="RGB Lift 黑位" values={colorGrade.rgbLift} min={-0.2} max={0.2} step={0.01} onChange={(value) => updateColorGrade(onChange, { rgbLift: value })} />
        <ChannelControl label="RGB Gamma 曲线" values={colorGrade.rgbGamma} min={0.5} max={1.5} step={0.01} onChange={(value) => updateColorGrade(onChange, { rgbGamma: value })} />
        <label className="asset-tuning-checkbox">
          <input type="checkbox" checked={colorGrade.enabled !== false} onChange={(event) => updateColorGrade(onChange, { enabled: event.target.checked })} />
          <span>启用色彩分级</span>
        </label>
      </div>

      <div className="asset-tuning-group">
        <span className="asset-tuning-label">后期效果</span>
        <NumberControl label="Bloom" value={effects.bloom?.intensity} min={0} max={2.5} step={0.05} onChange={(value) => updateSection(onChange, "effects", { bloom: { ...effects.bloom, enabled: value > 0, intensity: value } })} />
        <NumberControl label="暗角" value={effects.vignette?.darkness} min={0} max={1} step={0.05} onChange={(value) => updateSection(onChange, "effects", { vignette: { ...effects.vignette, enabled: value > 0, darkness: value } })} />
        <NumberControl label="颗粒" value={effects.noise?.opacity} min={0} max={0.08} step={0.002} onChange={(value) => updateSection(onChange, "effects", { noise: { ...effects.noise, enabled: value > 0, opacity: value } })} />
      </div>

      <div className="asset-tuning-group">
        <span className="asset-tuning-label">粒子氛围</span>
        <div className="asset-theme-list">
          {PARTICLE_PRESETS.map((preset) => (
            <button key={preset.id} type="button" className={particlePreset === preset.id ? "is-active" : ""} onClick={() => applyParticles(preset)}>{preset.label}</button>
          ))}
        </div>
        {particles.enabled && (
          <NumberControl label="粒子数量" value={particles.count} min={0} max={240} step={10} onChange={(value) => updateSection(onChange, "particles", { count: value })} />
        )}
      </div>
    </section>
  );
}

