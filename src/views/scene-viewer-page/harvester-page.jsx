import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SceneViewer from "../../viewer/SceneViewer.jsx";
import { inspectAssetFile } from "../../features/asset-workbench/asset-inspector.js";
import {
  createHarvesterAssemblyScene,
  createHarvesterScene,
  createHarvesterThemeScene,
  HARVESTER_ASSEMBLY_GROUND_OFFSET,
  HARVESTER_ASSEMBLY_MODES,
  HARVESTER_MODEL_PLACEHOLDER,
  listHarvesterParts,
  probeHarvesterPartsAvailable,
  summarizeHarvesterParts,
} from "../../scenes/presets/harvester-preset.js";
import {
  COLOR_GRADE_PRESETS,
  PARTICLE_PRESETS,
  QUALITY_PRESETS,
  VISUAL_PRESETS,
  findPreset,
} from "../../features/asset-workbench/visual-presets.js";
import { usePageTheme } from "../../theme/page-themes.js";
import {
  SHOWROOM_SKINS,
  applyShowroomSkin,
} from "../../features/showroom-props/showroom-skins.js";
import {
  STAGE_SURFACE_PRESETS,
  applyStageSurface,
  applyCustomStageSurface,
} from "../../features/showroom-props/stage-surface-presets.js";
import {
  HARVESTER_VISIBILITY_PRESETS,
  applyHarvesterVisibilityPreset,
} from "../../scenes/presets/harvester-visibility.js";
import { downloadShowcasePack } from "../../features/asset-workbench/showcase-pack.js";
import "./harvester-page.less";

const DEMO_MODEL_URL = "/model/汽车.glb";
/** 默认整机装配（含割台）；可切「精简整机」跳过 637MB 割台以加快加载 */
const DEFAULT_ASSEMBLY_MODE = "full";
/** 多模型本地加载默认按 CAD 原坐标装配；可选并排对比 */
const LOCAL_LAYOUT_ASSEMBLE = "assemble";
const LOCAL_LAYOUT_SIDE_BY_SIDE = "sideBySide";
const LOCAL_LAYOUT_SPACING = 3.4;

/** 多件装配后的共享构图（CAD 坐标；镜头 Y 由运行时自适应贴地补偿） */
const LOCAL_ASSEMBLY_SHOTS = [
  {
    id: "hero",
    label: "主视觉",
    position: [14, 5, 16],
    target: [2.2, 1.2, -0.4],
    durationMs: 1600,
  },
  {
    id: "front",
    label: "正前",
    position: [-8, 2.5, 10],
    target: [-1.5, 1.2, 0.2],
    durationMs: 1400,
  },
  {
    id: "side",
    label: "侧视",
    position: [3, 3, 18],
    target: [2.2, 1.4, -0.4],
    durationMs: 1400,
  },
  {
    id: "top",
    label: "俯视",
    position: [3, 20, 6],
    target: [2.2, 0.5, -0.5],
    durationMs: 1600,
  },
];

function buildWorkspaceScene(assemblyMode, partsAvailable, showroomSkin = "amber-hall") {
  if (partsAvailable && assemblyMode !== "header") {
    return createHarvesterAssemblyScene({
      mode: assemblyMode,
      machineEnabled: false,
      showroomSkin,
    });
  }
  const headerScene = createHarvesterScene({
    modelUrl: HARVESTER_MODEL_PLACEHOLDER,
    modelLabel: "雷沃收获机",
    machineEnabled: false,
  });
  return applyShowroomSkin(headerScene, showroomSkin);
}

function describeAssemblyMode(assemblyMode, partsAvailable) {
  if (!partsAvailable || assemblyMode === "header") {
    return "雷沃收获机 · 仅割台";
  }
  const parts = listHarvesterParts(assemblyMode);
  const summary = summarizeHarvesterParts(parts);
  const modeLabel = HARVESTER_ASSEMBLY_MODES[assemblyMode]?.label || "整机装配";
  return `${modeLabel} · ${summary.count} 件 / ~${summary.sizeMB}MB`;
}

function applyVisualPreset(scene, preset) {
  const quality = findPreset(QUALITY_PRESETS, preset.quality);
  const particles = findPreset(PARTICLE_PRESETS, preset.particles);
  const colorGrade = findPreset(COLOR_GRADE_PRESETS, preset.colorGrade);
  const themed = createHarvesterThemeScene(scene, preset.theme);
  const qualityEffects = quality.config.effects || {};
  return {
    ...themed,
    visualPreset: preset.id,
    defaultVariant: preset.variant,
    renderer: { ...themed.renderer, ...quality.config.renderer },
    camera: { ...themed.camera, defaultShot: preset.shot },
    effects: {
      ...themed.effects,
      ...qualityEffects,
      bloom: { ...themed.effects?.bloom, ...qualityEffects.bloom },
      vignette: { ...themed.effects?.vignette, ...qualityEffects.vignette },
      noise: { ...themed.effects?.noise, ...qualityEffects.noise },
    },
    particles: { ...themed.particles, ...particles.config },
    colorGrade: { ...themed.colorGrade, ...colorGrade.config },
  };
}

/**
 * 本地多选场景。
 * - assemble（默认）：各件 identity + autoFrame=false，保留 GLB 内嵌 CAD 世界坐标并自动拼装
 * - sideBySide：沿 X 轴并排，便于无关模型对比（会破坏同坐标系装配）
 */
function createLocalShowcaseScene(files, urls, { layout = LOCAL_LAYOUT_ASSEMBLE } = {}) {
  const firstFile = files[0];
  const isMulti = files.length > 1;
  const assembleInPlace = !isMulti || layout === LOCAL_LAYOUT_ASSEMBLE;
  const baseScene = createHarvesterScene({
    modelUrl: urls[0],
    modelLabel: firstFile.name.replace(/\.(glb|gltf)$/i, ""),
    title: isMulti
      ? (assembleInPlace ? `多件装配 · ${files.length} 个模型` : `并排对比 · ${files.length} 个模型`)
      : "模型展台",
    machineEnabled: false,
  });
  const offset = (files.length - 1) / 2;
  const crispRenderer = {
    ...(baseScene.renderer || {}),
    dpr: [1, 1.25],
    antialias: false,
    textureAnisotropy: 4,
  };
  const crispEffects = {
    ...(baseScene.effects || {}),
    enabled: true,
    smaa: { enabled: true },
  };
  const models = files.map((file, index) => ({
    ...baseScene.models[0],
    id: `showcase-local-${index + 1}`,
    label: file.name.replace(/\.(glb|gltf)$/i, ""),
    url: urls[index],
    // 装配：CAD 重合（Y=0），运行时按轮底自适应贴地；并排：沿 X 散开
    position: assembleInPlace
      ? [0, 0, 0]
      : [(index - offset) * LOCAL_LAYOUT_SPACING, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    variantTarget: index === 0,
    assetSource: "local",
    assetFormat: file.name.toLowerCase().endsWith(".gltf") ? "gltf" : "glb",
    // 多件装配必须关闭：autoFrame 会把每个分件独立挪到原点，破坏 CAD 重合；单件仍可落地便于预览
    autoFrame: isMulti ? !assembleInPlace : true,
    reveal: isMulti && assembleInPlace ? false : undefined,
    parentId: null,
    assemblyId: assembleInPlace && isMulti ? "local-assembly" : null,
  }));

  if (assembleInPlace && isMulti) {
    return applyShowroomSkin({
      ...baseScene,
      id: "local-showcase-assembly",
      models,
      renderer: crispRenderer,
      effects: crispEffects,
      localLayout: LOCAL_LAYOUT_ASSEMBLE,
      assemblyMeta: {
        transformSource: "embedded-glb-world",
        adaptiveGround: true,
        groundY: 0,
        showBounds: true,
        groundOffset: [...HARVESTER_ASSEMBLY_GROUND_OFFSET],
        partCount: files.length,
        note: "CAD-coincident parts; runtime adaptive ground lift from wheel bottoms.",
      },
      camera: {
        ...baseScene.camera,
        defaultShot: "hero",
      },
      shots: LOCAL_ASSEMBLY_SHOTS,
    }, "amber-hall");
  }

  return {
    ...baseScene,
    models,
    renderer: crispRenderer,
    effects: crispEffects,
    localLayout: isMulti ? LOCAL_LAYOUT_SIDE_BY_SIDE : undefined,
  };
}

function withTwinMode(scene, enabled) {
  if (!scene) return scene;
  return {
    ...scene,
    machine: {
      ...(scene.machine || {}),
      enabled: Boolean(enabled),
      label: scene.machine?.label || "收获机状态",
    },
  };
}

function ShowcaseLanding({ inputRef, status, message, onChoose, onFileChange, onDemo }) {
  return (
    <main className="harvester-showcase-landing">
      <input ref={inputRef} hidden type="file" accept=".glb,.gltf" multiple onChange={onFileChange} />
      <div className="harvester-showcase-landing-mark">SY·ME</div>
      <span className="studio-section-kicker">MODEL SHOWROOM / HARVESTER</span>
      <h1>收获机产品展厅</h1>
      <p>
        电影感镜头、热点讲解与一键巡演。可直接进入工作区模型，或选择本地 GLB / 示例资产完成演示。
        一次多选分件时，将按各模型原坐标自动装配。
      </p>
      {status === "checking" && <div className="harvester-showcase-message">正在检查工作区模型…</div>}
      {status !== "checking" && (
        <div className="harvester-showcase-landing-actions">
          <button type="button" className="harvester-showcase-primary" onClick={onChoose}>
            选择本地模型进入展厅
          </button>
          <button type="button" className="harvester-showcase-secondary" onClick={onDemo}>
            打开示例展台
          </button>
        </div>
      )}
      {message && <div className="harvester-showcase-error" role="alert">{message}</div>}
      <div className="harvester-showcase-landing-links">
        <Link to="/">返回门户</Link>
        <Link to="/tools/asset-workbench">编辑入口 · 资产工作台</Link>
      </div>
      <small>支持单模型与多模型多选（按原坐标自动装配）；文件只在当前浏览器会话中使用，不会上传。</small>
    </main>
  );
}

function formatLoadStatus(loadStatus, assemblyMode) {
  if (!loadStatus?.total) return "";
  const { loaded, total, failed = [], pending = 0 } = loadStatus;
  if (failed.length) {
    const names = failed.map((item) => item.label).join("、");
    return `已加载 ${loaded}/${total}，失败：${names}`;
  }
  if (pending > 0) {
    return `正在加载 ${loaded}/${total}…`;
  }
  if (assemblyMode === "core") {
    return `已加载 ${loaded}/${total}（精简整机，不含割台；切「整机装配」可加载全部 23 件）`;
  }
  return `已加载 ${loaded}/${total}`;
}

function ShowroomChrome({
  inputRef,
  assetLabel,
  scene,
  activePresetId,
  activeShotId,
  autoPlay,
  twinMode,
  message,
  loadStatus,
  partsAvailable,
  assemblyMode,
  showroomSkin,
  stageSurface,
  visibilityPreset,
  localMultiSelect,
  localLayout,
  showBounds,
  sideOpen,
  onSideToggle,
  railOpen,
  onRailToggle,
  alignLabel,
  onAssemblyMode,
  onShowroomSkin,
  onStageSurface,
  onCustomStageSurface,
  onVisibilityPreset,
  onLocalLayout,
  onShowBounds,
  onChoose,
  onDemo,
  onPreset,
  onShot,
  onTour,
  onVariant,
  onTwinMode,
  onExportPack,
}) {
  const shots = scene?.shots || [];
  const variants = scene?.materialVariants || [];
  const assemblyModes = Object.values(HARVESTER_ASSEMBLY_MODES);
  const loadStatusText = formatLoadStatus(loadStatus, assemblyMode);
  const activeShotIndex = Math.max(0, shots.findIndex((shot) => shot.id === activeShotId));
  const tourProgress = shots.length > 0 ? ((activeShotIndex + 1) / shots.length) * 100 : 0;
  const activeHotspots = (scene?.hotspots || []).filter((spot) => spot.shotId);

  return (
    <div className="harvester-showroom-chrome">
      <input ref={inputRef} hidden type="file" accept=".glb,.gltf" multiple onChange={onChoose} />

      <button
        type="button"
        className={`harvester-showroom-drawer-toggle${sideOpen ? " is-open" : ""}`}
        title={sideOpen ? "收起控制台" : "展开控制台"}
        aria-expanded={sideOpen}
        onClick={() => onSideToggle?.(!sideOpen)}
      >
        <span className="harvester-showroom-drawer-toggle-icon" aria-hidden="true" />
        <em>{sideOpen ? "收起" : "控制台"}</em>
      </button>

      <header className="harvester-showroom-brand">
        <div>
          <span className="harvester-showroom-brand-mark">SY·ME</span>
          <strong>{scene?.title || "收获机展厅"}</strong>
          <small>{assetLabel}</small>
          {loadStatusText && (
            <small
              className={`harvester-showroom-load-status${loadStatus?.failed?.length ? " is-error" : ""}`}
              role="status"
            >
              {loadStatusText}
            </small>
          )}
          {alignLabel && (
            <small className="harvester-showroom-align-status" role="status">
              {alignLabel}
            </small>
          )}
        </div>
      </header>

      <aside className={`harvester-showroom-side${sideOpen ? " is-open" : ""}`}>
        <div className="harvester-showroom-panel harvester-showroom-panel-actions">
          <div className="harvester-showroom-panel-body harvester-showroom-quick-actions">
            <button type="button" className={twinMode ? "is-active" : ""} onClick={() => onTwinMode(!twinMode)}>
              {twinMode ? "退出主体状态" : "主体状态"}
            </button>
            <Link to="/tools/asset-workbench">编辑</Link>
            <Link to="/">门户</Link>
          </div>
        </div>
        {partsAvailable && (
          <details className="harvester-showroom-panel" open>
            <summary>装配模式</summary>
            <div className="harvester-showroom-panel-body">
              {assemblyModes.map((mode) => (
                <button
                  type="button"
                  key={mode.id}
                  className={assemblyMode === mode.id ? "is-active" : ""}
                  title={mode.description}
                  onClick={() => onAssemblyMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </details>
        )}
        <details className="harvester-showroom-panel" open>
          <summary>展厅皮肤</summary>
          <div className="harvester-showroom-panel-body">
            {SHOWROOM_SKINS.map((skin) => (
              <button
                type="button"
                key={skin.id}
                className={showroomSkin === skin.id ? "is-active" : ""}
                title={skin.description}
                onClick={() => onShowroomSkin(skin.id)}
              >
                {skin.label}
              </button>
            ))}
          </div>
        </details>
        <details className="harvester-showroom-panel" open>
          <summary>背景基面</summary>
          <div className="harvester-showroom-panel-body">
            <div className="harvester-stage-swatches">
              {STAGE_SURFACE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`harvester-stage-swatch${stageSurface === preset.id ? " is-active" : ""}`}
                  title={`${preset.label}：${preset.description}`}
                  style={{ "--swatch": preset.swatch }}
                  onClick={() => onStageSurface?.(preset.id)}
                >
                  <span className="harvester-stage-swatch-chip" aria-hidden="true" />
                  <em>{preset.label}</em>
                </button>
              ))}
            </div>
            <div className="harvester-stage-custom-colors">
              <label title="环境背景色">
                背景
                <input
                  type="color"
                  value={scene?.environment?.background || "#e6e8eb"}
                  onChange={(event) => onCustomStageSurface?.({ background: event.target.value })}
                />
              </label>
              <label title="无限地面色">
                地面
                <input
                  type="color"
                  value={scene?.ground?.color || "#d9dde2"}
                  onChange={(event) => onCustomStageSurface?.({ groundColor: event.target.value })}
                />
              </label>
              <label title="圆形地台色">
                地台
                <input
                  type="color"
                  value={
                    scene?.extensions?.find((item) => item.type === "showroom-floor")?.params?.color
                    || scene?.ground?.color
                    || "#f2f4f6"
                  }
                  onChange={(event) => onCustomStageSurface?.({ floorColor: event.target.value })}
                />
              </label>
            </div>
          </div>
        </details>
        {scene?.assemblyMeta?.adaptiveGround && (
          <details className="harvester-showroom-panel" open>
            <summary>坐标边界</summary>
            <div className="harvester-showroom-panel-body">
              <button
                type="button"
                className={showBounds ? "is-active" : ""}
                title="显示实测轮底/整机包围盒与贴地参考线"
                onClick={() => onShowBounds?.(!showBounds)}
              >
                {showBounds ? "隐藏包围盒" : "显示包围盒"}
              </button>
            </div>
          </details>
        )}
        {localMultiSelect && (
          <details className="harvester-showroom-panel" open>
            <summary>多选布局</summary>
            <div className="harvester-showroom-panel-body">
              <button
                type="button"
                className={localLayout === LOCAL_LAYOUT_ASSEMBLE ? "is-active" : ""}
                title="按各 GLB 内嵌世界坐标重合拼装"
                onClick={() => onLocalLayout(LOCAL_LAYOUT_ASSEMBLE)}
              >
                按原坐标装配
              </button>
              <button
                type="button"
                className={localLayout === LOCAL_LAYOUT_SIDE_BY_SIDE ? "is-active" : ""}
                title="沿 X 轴并排，适合无关模型对比"
                onClick={() => onLocalLayout(LOCAL_LAYOUT_SIDE_BY_SIDE)}
              >
                并排对比
              </button>
            </div>
          </details>
        )}
        <details className="harvester-showroom-panel" open={!partsAvailable && !localMultiSelect}>
          <summary>视觉方案</summary>
          <div className="harvester-showroom-panel-body">
            {VISUAL_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={activePresetId === preset.id ? "is-active" : ""}
                title={preset.description}
                onClick={() => onPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </details>
        <details className="harvester-showroom-panel" open>
          <summary>材质变体</summary>
          <div className="harvester-showroom-panel-body">
            <div className="harvester-stage-swatches harvester-variant-swatches">
              {variants.map((variant) => (
                <button
                  type="button"
                  key={variant.id}
                  className={`harvester-stage-swatch${scene?.defaultVariant === variant.id ? " is-active" : ""}`}
                  title={variant.description || variant.label}
                  style={{ "--swatch": variant.swatch || variant.color || "#8a97a3" }}
                  onClick={() => onVariant(variant.id)}
                >
                  <span className="harvester-stage-swatch-chip" aria-hidden="true" />
                  <em>{variant.label}</em>
                </button>
              ))}
            </div>
          </div>
        </details>
        {partsAvailable && (
          <details className="harvester-showroom-panel">
            <summary>性能档</summary>
            <div className="harvester-showroom-panel-body">
              {HARVESTER_VISIBILITY_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={visibilityPreset === preset.id ? "is-active" : ""}
                  title={preset.description}
                  onClick={() => onVisibilityPreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </details>
        )}
        {activeHotspots.length > 0 && (
          <details className="harvester-showroom-panel">
            <summary>讲解热点</summary>
            <div className="harvester-showroom-panel-body">
              {activeHotspots.map((spot) => (
                <button
                  type="button"
                  key={spot.id}
                  title={spot.panel?.body || spot.label}
                  onClick={() => onShot(spot.shotId)}
                >
                  看{spot.label}
                </button>
              ))}
            </div>
          </details>
        )}
        <div className="harvester-showroom-side-tools">
          <button type="button" onClick={() => inputRef.current?.click()}>替换模型</button>
          <button type="button" onClick={onDemo}>示例资产</button>
          <button type="button" onClick={onExportPack}>导出演示包</button>
        </div>
        {message && <small className="harvester-showroom-status" role="status">{message}</small>}
      </aside>

      <button
        type="button"
        className={`harvester-showroom-rail-toggle${railOpen ? " is-open" : ""}`}
        title={railOpen ? "收起视角与巡演" : "展开视角与巡演"}
        aria-expanded={railOpen}
        onClick={() => onRailToggle?.(!railOpen)}
      >
        <span className="harvester-showroom-rail-toggle-icon" aria-hidden="true" />
        <em>{railOpen ? "收起视角" : "视角 · 巡演"}</em>
      </button>

      <footer className={`harvester-showroom-rail${railOpen ? " is-open" : ""}`}>
        <div className="harvester-showroom-rail-main">
          <div className="harvester-showroom-tour-progress" aria-hidden="true">
            <span style={{ width: `${tourProgress}%` }} />
          </div>
          <div className="harvester-showroom-rail-shots">
            {shots.map((shot, index) => (
              <button
                type="button"
                key={shot.id}
                className={shot.id === activeShotId ? "is-active" : ""}
                onClick={() => onShot(shot.id)}
              >
                <em>{String(index + 1).padStart(2, "0")}</em>
                {shot.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`harvester-showroom-tour ${autoPlay ? "is-active" : ""}`}
          onClick={onTour}
        >
          {autoPlay ? "暂停巡演" : "开始巡演"}
        </button>
      </footer>
    </div>
  );
}

export default function HarvesterPage() {
  const inputRef = useRef(null);
  const localUrlsRef = useRef([]);
  const localFilesRef = useRef([]);
  const runtimeRef = useRef(null);
  const { themeId, setThemeId } = usePageTheme();
  const [assetStatus, setAssetStatus] = useState("checking");
  const [scene, setScene] = useState(null);
  const [assetLabel, setAssetLabel] = useState("工作区模型");
  const [message, setMessage] = useState("");
  const [activePresetId, setActivePresetId] = useState("custom");
  const [twinMode, setTwinMode] = useState(false);
  const [partsAvailable, setPartsAvailable] = useState(false);
  const [assemblyMode, setAssemblyMode] = useState(DEFAULT_ASSEMBLY_MODE);
  const [showroomSkin, setShowroomSkin] = useState("amber-hall");
  const [stageSurface, setStageSurface] = useState("amber-dark");
  const [visibilityPreset, setVisibilityPreset] = useState("all");
  const [localLayout, setLocalLayout] = useState(LOCAL_LAYOUT_ASSEMBLE);
  const [localMultiSelect, setLocalMultiSelect] = useState(false);
  const [loadStatus, setLoadStatus] = useState(null);
  const [showBounds, setShowBounds] = useState(true);
  const [sideOpen, setSideOpen] = useState(true);
  const [railOpen, setRailOpen] = useState(true);
  const [alignLabel, setAlignLabel] = useState("");
  const [runtimeVersion, setRuntimeVersion] = useState(0);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState({
    shotId: null,
    autoPlay: false,
    variantId: null,
  });
  const handleModelStatus = useMemo(() => (status) => setLoadStatus(status), []);

  useEffect(() => {
    if (themeId === "forest") setThemeId("amber");
  }, [themeId, setThemeId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [headerResponse, hasParts] = await Promise.all([
        fetch(HARVESTER_MODEL_PLACEHOLDER, { method: "HEAD" }).catch(() => null),
        probeHarvesterPartsAvailable(),
      ]);
      if (!active) return;

      const contentType = headerResponse?.headers.get("content-type") || "";
      const headerOk = Boolean(headerResponse?.ok && !contentType.includes("text/html"));
      setPartsAvailable(hasParts);

      if (!headerOk && !hasParts) {
        setAssetStatus("select");
        return;
      }

      const mode = hasParts ? DEFAULT_ASSEMBLY_MODE : "header";
      setAssemblyMode(mode);
      setShowroomSkin("amber-hall");
      setVisibilityPreset("all");
      setScene(applyHarvesterVisibilityPreset(
        buildWorkspaceScene(mode, hasParts, "amber-hall"),
        "all"
      ));
      setAssetLabel(describeAssemblyMode(mode, hasParts));
      setAssetStatus("ready");
      if (hasParts) {
        const summary = summarizeHarvesterParts(listHarvesterParts(mode));
        setMessage(`已按 CAD 世界坐标装配 ${summary.count} 个分件（约 ${summary.sizeMB}MB），轮底自适应贴地。侧栏可切皮肤 / 性能档 / 巡演。`);
      }
    })();

    return () => {
      active = false;
      localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      localUrlsRef.current = [];
      localFilesRef.current = [];
    };
  }, []);

  const clearLocalSelection = () => {
    localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    localUrlsRef.current = [];
    localFilesRef.current = [];
    setLocalLayout(LOCAL_LAYOUT_ASSEMBLE);
    setLocalMultiSelect(false);
  };

  const applyAssemblyMode = (mode) => {
    clearLocalSelection();
    setAssemblyMode(mode);
    setLoadStatus(null);
    const skinned = buildWorkspaceScene(mode, partsAvailable, showroomSkin);
    const withSurface = stageSurface && stageSurface !== "custom"
      ? applyStageSurface(skinned, stageSurface)
      : skinned;
    const next = applyHarvesterVisibilityPreset(withSurface, visibilityPreset);
    setScene(next);
    setAssetLabel(describeAssemblyMode(mode, partsAvailable));
    setTwinMode(false);
    setActivePresetId("custom");
    const meta = HARVESTER_ASSEMBLY_MODES[mode];
    setMessage(meta ? `已切换为「${meta.label}」：${meta.description}` : "已切换装配模式。");
  };

  const applyShowroomSkinChoice = (skinId) => {
    setShowroomSkin(skinId);
    setScene((previous) => {
      if (!previous) return previous;
      const skinned = localMultiSelect
        ? applyShowroomSkin(previous, skinId)
        : buildWorkspaceScene(assemblyMode, partsAvailable, skinId);
      const withSurface = stageSurface && stageSurface !== "custom"
        ? applyStageSurface(skinned, stageSurface)
        : skinned;
      return applyHarvesterVisibilityPreset(withSurface, visibilityPreset);
    });
    setActivePresetId("custom");
    const skin = SHOWROOM_SKINS.find((item) => item.id === skinId);
    setMessage(skin ? `已应用展厅皮肤「${skin.label}」：${skin.description}` : "已更新展厅皮肤。");
  };

  const applyStageSurfaceChoice = (presetId) => {
    setStageSurface(presetId);
    setScene((previous) => (previous ? applyStageSurface(previous, presetId) : previous));
    setActivePresetId("custom");
    const preset = STAGE_SURFACE_PRESETS.find((item) => item.id === presetId);
    setMessage(preset ? `已切换背景基面「${preset.label}」：${preset.description}` : "已更新背景基面。");
  };

  const applyCustomStageSurfaceChoice = (patch) => {
    setStageSurface("custom");
    setScene((previous) => (previous ? applyCustomStageSurface(previous, patch) : previous));
    setActivePresetId("custom");
    setMessage("已自定义背景 / 地面 / 地台颜色。");
  };

  const applyVisibilityChoice = (presetId) => {
    setVisibilityPreset(presetId);
    setScene((previous) => (previous ? applyHarvesterVisibilityPreset(previous, presetId) : previous));
    const preset = HARVESTER_VISIBILITY_PRESETS.find((item) => item.id === presetId);
    setMessage(preset ? `已切换性能档「${preset.label}」：${preset.description}` : "已更新显隐预设。");
  };

  const exportDemoPack = () => {
    if (!scene) return;
    const pack = downloadShowcasePack(scene, {
      title: scene.title || "收获机展厅演示包",
      note: `skin=${showroomSkin}; stage=${stageSurface}; visibility=${visibilityPreset}; assembly=${assemblyMode}`,
    });
    setMessage(`已下载演示包「${pack.title}」（含场景 JSON 与元信息）。`);
  };

  const applyLocalLayout = (layout) => {
    const files = localFilesRef.current;
    const urls = localUrlsRef.current;
    if (files.length < 2 || urls.length < 2) return;
    setLocalLayout(layout);
    setScene(createLocalShowcaseScene(files, urls, { layout }));
    setActivePresetId("custom");
    setTwinMode(false);
    setMessage(
      layout === LOCAL_LAYOUT_ASSEMBLE
        ? `已按原坐标自动装配 ${files.length} 个模型（关闭逐件落地）。`
        : `已切换为并排对比：${files.length} 个模型沿 X 轴展开。`
    );
  };

  const liveScene = useMemo(() => {
    const twin = withTwinMode(scene, twinMode);
    if (!twin?.assemblyMeta) return twin;
    return {
      ...twin,
      assemblyMeta: {
        ...twin.assemblyMeta,
        showBounds,
      },
    };
  }, [scene, twinMode, showBounds]);

  const chooseLocalModels = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setAssetStatus("loading");
    setMessage(`正在检查 ${files.length} 个模型…`);
    const inspected = await Promise.all(files.map(async (file) => ({ file, report: await inspectAssetFile(file) })));
    const supported = inspected.filter(({ report }) => report.previewSupported);
    const skipped = inspected.length - supported.length;
    if (!supported.length) {
      setAssetStatus("select");
      setMessage("没有可直接预览的模型，请将外部依赖打包为单文件 GLB。");
      return;
    }
    localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const urls = supported.map(({ file }) => URL.createObjectURL(file));
    const localFiles = supported.map(({ file }) => file);
    localUrlsRef.current = urls;
    localFilesRef.current = localFiles;
    const layout = LOCAL_LAYOUT_ASSEMBLE;
    setLocalLayout(layout);
    setLocalMultiSelect(localFiles.length > 1);
    setScene(createLocalShowcaseScene(localFiles, urls, { layout }));
    setAssetLabel(
      localFiles.length > 1
        ? `${localFiles.length} 个本地模型 · 按原坐标装配`
        : localFiles[0].name
    );
    setTwinMode(false);
    setAssetStatus("ready");
    if (skipped) {
      setMessage(`已按原坐标装配 ${localFiles.length} 个模型，跳过 ${skipped} 个需转换文件。`);
    } else if (localFiles.length > 1) {
      setMessage(`已按原坐标自动装配 ${localFiles.length} 个本地模型（identity + 关闭逐件落地）。`);
    } else {
      setMessage(`已加载本地模型「${localFiles[0].name}」。`);
    }
  };

  const openDemo = () => {
    clearLocalSelection();
    setScene(createHarvesterScene({
      modelUrl: DEMO_MODEL_URL,
      modelLabel: "示例汽车",
      title: "模型展台 · 示例资产",
      machineEnabled: false,
    }));
    setAssetLabel("示例汽车 · 工作区资产");
    setActivePresetId("custom");
    setTwinMode(false);
    setAssetStatus("ready");
    setMessage("已打开示例展台，可继续替换为本地模型。");
  };

  const applyPreset = (preset) => {
    setScene((previous) => (previous ? applyVisualPreset(previous, preset) : previous));
    setActivePresetId(preset.id);
    setMessage(`已应用“${preset.label}”：${preset.description}`);
  };

  const handleRuntimeReady = (runtime) => {
    runtimeRef.current = runtime;
    setRuntimeVersion((value) => value + 1);
  };

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return undefined;
    const sync = () => {
      const state = runtime.getState();
      setRuntimeSnapshot({
        shotId: state.shotId,
        autoPlay: state.autoPlay,
        variantId: state.variantId,
      });
    };
    sync();
    return runtime.subscribe(sync);
  }, [runtimeVersion, liveScene]);

  const setShot = (shotId) => {
    runtimeRef.current?.dispatch({ type: "autoplay/set", payload: { value: false } });
    runtimeRef.current?.dispatch({ type: "shot/set", payload: { id: shotId } });
  };

  const toggleTour = () => {
    runtimeRef.current?.dispatch({
      type: "autoplay/set",
      payload: { value: !runtimeSnapshot.autoPlay },
    });
  };

  const setVariant = (variantId) => {
    runtimeRef.current?.dispatch({ type: "variant/set", payload: { id: variantId } });
    setScene((previous) => (previous ? { ...previous, defaultVariant: variantId } : previous));
  };

  if (!liveScene) {
    return (
      <ShowcaseLanding
        inputRef={inputRef}
        status={assetStatus}
        message={message}
        onChoose={() => inputRef.current?.click()}
        onFileChange={chooseLocalModels}
        onDemo={openDemo}
      />
    );
  }

  return (
    <div className="harvester-showcase-page">
      <SceneViewer
        scene={liveScene}
        mode="showcase"
        ui={{ header: false, dock: false, models: false, nodes: false, performance: false }}
        onRuntimeReady={handleRuntimeReady}
        onModelStatus={handleModelStatus}
        onAssemblyAligned={(result) => {
          if (!result?.ready) {
            setAlignLabel("");
            return;
          }
          const lift = Number(result.liftY || 0).toFixed(2);
          const source = result.source === "wheels" ? "轮系底面" : "整机包围盒";
          const size = result.bounds?.size;
          const sizeText = Array.isArray(size)
            ? ` · ${size[0].toFixed(1)}×${size[1].toFixed(1)}×${size[2].toFixed(1)} m`
            : "";
          const label = `${source} · 抬升 ${lift} m${sizeText}`;
          setAlignLabel(label);
          setMessage(`自适应贴地完成：${label}`);
        }}
      />
      <ShowroomChrome
        inputRef={inputRef}
        assetLabel={assetLabel}
        scene={liveScene}
        activePresetId={activePresetId}
        activeShotId={runtimeSnapshot.shotId || liveScene.camera?.defaultShot}
        autoPlay={runtimeSnapshot.autoPlay}
        twinMode={twinMode}
        message={message}
        loadStatus={loadStatus}
        partsAvailable={partsAvailable}
        assemblyMode={assemblyMode}
        showroomSkin={showroomSkin}
        stageSurface={stageSurface}
        visibilityPreset={visibilityPreset}
        localMultiSelect={localMultiSelect}
        localLayout={localLayout}
        showBounds={showBounds}
        sideOpen={sideOpen}
        onSideToggle={setSideOpen}
        railOpen={railOpen}
        onRailToggle={setRailOpen}
        alignLabel={alignLabel}
        onAssemblyMode={applyAssemblyMode}
        onShowroomSkin={applyShowroomSkinChoice}
        onStageSurface={applyStageSurfaceChoice}
        onCustomStageSurface={applyCustomStageSurfaceChoice}
        onVisibilityPreset={applyVisibilityChoice}
        onLocalLayout={applyLocalLayout}
        onShowBounds={setShowBounds}
        onChoose={chooseLocalModels}
        onDemo={openDemo}
        onExportPack={exportDemoPack}
        onPreset={applyPreset}
        onShot={setShot}
        onTour={toggleTour}
        onVariant={setVariant}
        onTwinMode={setTwinMode}
      />
    </div>
  );
}
