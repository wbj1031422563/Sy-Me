import { useEffect, useRef, useState } from "react";
import SceneViewer from "../../viewer/SceneViewer.jsx";
import { inspectAssetFile } from "../../features/asset-workbench/asset-inspector.js";
import {
  createHarvesterScene,
  createHarvesterThemeScene,
  HARVESTER_MODEL_PLACEHOLDER,
} from "../../scenes/presets/harvester-preset.js";
import {
  COLOR_GRADE_PRESETS,
  PARTICLE_PRESETS,
  QUALITY_PRESETS,
  VISUAL_PRESETS,
  findPreset,
} from "../../features/asset-workbench/visual-presets.js";
import "./harvester-page.less";

const DEMO_MODEL_URL = "/model/汽车.glb";

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

function createLocalShowcaseScene(files, urls) {
  const firstFile = files[0];
  const baseScene = createHarvesterScene({
    modelUrl: urls[0],
    modelLabel: firstFile.name.replace(/\.(glb|gltf)$/i, ""),
    title: files.length > 1 ? `多模型展台 · ${files.length} 个模型` : "模型展台",
  });
  const offset = (files.length - 1) / 2;
  return {
    ...baseScene,
    models: files.map((file, index) => ({
      ...baseScene.models[0],
      id: `showcase-local-${index + 1}`,
      label: file.name.replace(/\.(glb|gltf)$/i, ""),
      url: urls[index],
      position: [(index - offset) * 3.4, 0, 0],
      variantTarget: index === 0,
      assetSource: "local",
      assetFormat: file.name.toLowerCase().endsWith(".gltf") ? "gltf" : "glb",
      autoFrame: true,
    })),
  };
}

function ShowcaseLanding({ inputRef, status, message, onChoose, onFileChange, onDemo }) {
  return (
    <main className="harvester-showcase-landing">
      <input ref={inputRef} hidden type="file" accept=".glb,.gltf" multiple onChange={onFileChange} />
      <div className="harvester-showcase-landing-mark">SY</div>
      <span className="studio-section-kicker">MODEL SHOWCASE / LOCAL ASSET</span>
      <h1>模型展台</h1>
      <p>选择一个或多个本地 GLB / GLTF，直接进入展台查看镜头、材质、灯光、背景与模型状态。</p>
      {status === "checking" && <div className="harvester-showcase-message">正在检查工作区模型…</div>}
      {status !== "checking" && (
        <div className="harvester-showcase-landing-actions">
          <button type="button" className="harvester-showcase-primary" onClick={onChoose}>选择本地 GLB / GLTF</button>
          <button type="button" className="harvester-showcase-secondary" onClick={onDemo}>打开示例展台</button>
        </div>
      )}
      {message && <div className="harvester-showcase-error" role="alert">{message}</div>}
      <small>支持单模型与多模型；文件只在当前浏览器会话中使用，不会上传。</small>
    </main>
  );
}

function ShowcaseToolbar({ inputRef, assetLabel, activePresetId, onChoose, onDemo, onPreset, message }) {
  return (
    <div className="harvester-showcase-toolbar">
      <input ref={inputRef} hidden type="file" accept=".glb,.gltf" multiple onChange={onChoose} />
      <div><span>展台资产</span><strong>{assetLabel}</strong></div>
      <button type="button" onClick={() => inputRef.current?.click()}>替换 / 添加模型</button>
      <button type="button" onClick={onDemo}>示例模型</button>
      <details className="harvester-showcase-presets">
        <summary className="harvester-showcase-preset-summary">视觉方案</summary>
        <div className="harvester-showcase-preset-list">
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
      {message && <small role="status">{message}</small>}
    </div>
  );
}

export default function HarvesterPage() {
  const inputRef = useRef(null);
  const localUrlsRef = useRef([]);
  const [assetStatus, setAssetStatus] = useState("checking");
  const [scene, setScene] = useState(null);
  const [assetLabel, setAssetLabel] = useState("工作区模型");
  const [message, setMessage] = useState("");
  const [activePresetId, setActivePresetId] = useState("custom");

  useEffect(() => {
    let active = true;
    fetch(HARVESTER_MODEL_PLACEHOLDER, { method: "HEAD" })
      .then((response) => {
        const contentType = response.headers.get("content-type") || "";
        const isHtmlFallback = contentType.includes("text/html");
        if (!active) return;
        if (response.ok && !isHtmlFallback) {
          setScene(createHarvesterScene({ modelUrl: HARVESTER_MODEL_PLACEHOLDER, modelLabel: "雷沃收获机" }));
          setAssetLabel("雷沃收获机 · 工作区");
          setAssetStatus("ready");
        } else {
          setAssetStatus("select");
        }
      })
      .catch(() => {
        if (active) setAssetStatus("select");
      });
    return () => {
      active = false;
      localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      localUrlsRef.current = [];
    };
  }, []);

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
    localUrlsRef.current = urls;
    const localFiles = supported.map(({ file }) => file);
    setScene(createLocalShowcaseScene(localFiles, urls));
    setAssetLabel(localFiles.length > 1 ? `${localFiles.length} 个本地模型` : localFiles[0].name);
    setAssetStatus("ready");
    setMessage(skipped ? `已加载 ${localFiles.length} 个模型，跳过 ${skipped} 个需转换文件。` : `已加载 ${localFiles.length} 个本地模型。`);
  };

  const openDemo = () => {
    localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    localUrlsRef.current = [];
    setScene(createHarvesterScene({ modelUrl: DEMO_MODEL_URL, modelLabel: "示例汽车", title: "模型展台 · 示例资产" }));
    setAssetLabel("示例汽车 · 工作区资产");
    setActivePresetId("custom");
    setAssetStatus("ready");
    setMessage("已打开示例展台，可继续替换为本地模型。");
  };

  const applyPreset = (preset) => {
    setScene((previous) => (previous ? applyVisualPreset(previous, preset) : previous));
    setActivePresetId(preset.id);
    setMessage(`已应用“${preset.label}”：${preset.description}`);
  };

  if (!scene) {
    return <ShowcaseLanding inputRef={inputRef} status={assetStatus} message={message} onChoose={() => inputRef.current?.click()} onFileChange={chooseLocalModels} onDemo={openDemo} />;
  }

  return (
    <div className="harvester-showcase-page">
      <SceneViewer scene={scene} />
      <ShowcaseToolbar
        inputRef={inputRef}
        assetLabel={assetLabel}
        activePresetId={activePresetId}
        onChoose={chooseLocalModels}
        onDemo={openDemo}
        onPreset={applyPreset}
        message={message}
      />
    </div>
  );
}
