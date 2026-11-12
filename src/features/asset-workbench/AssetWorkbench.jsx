import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SceneViewer from "../../viewer/SceneViewer.jsx";
import {
  createHarvesterScene,
  createHarvesterThemeScene,
  HARVESTER_THEMES,
} from "../../scenes/presets/harvester-preset.js";
import { WORKSPACE_HEADER_MOTION, WORKSPACE_KNIFE_SHOT } from "../../scenes/presets/header-motion.js";
import { inspectAssetFile } from "./asset-inspector.js";
import { createMotionCapabilitiesFromDefinitions } from "./motion-analysis.js";
import ClipMotionPanel from "./ClipMotionPanel.jsx";
import MotionCapabilityPanel from "./MotionCapabilityPanel.jsx";
import PartMotionPanel from "./PartMotionPanel.jsx";
import RenderTuningPanel from "./RenderTuningPanel.jsx";
import "./asset-workbench.less";

const DEMO_MODEL_URL = "/model/汽车.glb";
const WORKSPACE_HEADER_MODEL_URL = "/model/text_model001.glb";

const LOCAL_MODEL_PRESETS = [
  {
    id: "workspace-header",
    label: "工作区割台 · text_model001.glb",
    url: WORKSPACE_HEADER_MODEL_URL,
    fileName: "text_model001.glb",
    description: "当前工作区导出的割台模型",
    motionTracks: WORKSPACE_HEADER_MOTION,
  },
];

const MODEL_FORMAT_BUTTONS = [
  {
    id: "all",
    label: "全部格式",
    accept: ".glb,.gltf,.fbx,.obj,.stl,.ply,.dae",
  },
  { id: "glb", label: "GLB", accept: ".glb" },
  { id: "gltf", label: "GLTF", accept: ".gltf" },
  { id: "fbx", label: "FBX", accept: ".fbx" },
  { id: "obj", label: "OBJ", accept: ".obj" },
  { id: "stl", label: "STL", accept: ".stl" },
  { id: "other", label: "PLY / DAE", accept: ".ply,.dae" },
];

const BACKGROUND_PRESETS = [
  { id: "studio", label: "展厅 HDR", files: "/envMap/apartment.hdr" },
  { id: "field", label: "夕阳 HDR", files: "/envMap/venice_sunset_1k.hdr" },
  { id: "night", label: "夜间 HDR", files: "/envMap/夜晚.hdr" },
  {
    id: "technical",
    label: "技术 EXR",
    files: "/envMap/abstract-lighting-ray-room-style-01_2K_f478fdd1-243a-4cc8-b454-0f522f1afb6b.exr",
  },
];

const THEME_LABELS = {
  studio: "高级展厅",
  field: "白天田间",
  night: "夜间灯光",
  technical: "技术演示",
};

const MOTION_PRESETS = [
  { id: "idle", label: "待机", playing: false, rotationRate: 0, parallelRate: 0, direction: 1 },
  { id: "harvest", label: "收割作业", playing: true, rotationRate: 24, parallelRate: 2, direction: 1 },
  { id: "inspection", label: "低速检查", playing: false, rotationRate: 6, parallelRate: 0.5, direction: 1 },
  { id: "reverse", label: "反向演示", playing: true, rotationRate: 18, parallelRate: 1.5, direction: -1 },
];

function setKnifeView(scene, enabled) {
  const shots = scene.shots.filter((shot) => shot.id !== WORKSPACE_KNIFE_SHOT.id);
  return {
    ...scene,
    shots: enabled ? [...shots, WORKSPACE_KNIFE_SHOT] : shots,
    controls: { ...scene.controls, minDistance: enabled ? 0.75 : 4 },
  };
}

function createDefaultScene() {
  return createHarvesterScene({
    modelUrl: DEMO_MODEL_URL,
    modelLabel: "示例模型（可替换）",
    title: "收获机视觉工作台",
  });
}

function downloadScene(scene, assetManifest) {
  const exportScene = {
    ...scene,
    models: scene.models?.map((model) => ({ ...model })),
  };
  const localModel = assetManifest.model;
  const localBackground = assetManifest.background;
  if (localModel) {
    const modelUrl = localModel.source === "workspace"
      ? `/model/${localModel.fileName}`
      : `./assets/${localModel.fileName}`;
    exportScene.models = exportScene.models.map((model) =>
      model.id === localModel.slotId
        ? { ...model, url: modelUrl }
        : model
    );
  }
  if (localBackground) {
    exportScene.environment = {
      ...exportScene.environment,
      files: `./assets/${localBackground.fileName}`,
    };
  }
  exportScene.assetManifest = assetManifest;
  const blob = new Blob([JSON.stringify(exportScene, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${scene.id || "harvester-scene"}.scene.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AssetWorkbench() {
  const [scene, setScene] = useState(createDefaultScene);
  const [theme, setTheme] = useState("studio");
  const [backgroundPreset, setBackgroundPreset] = useState("field");
  const [modelAccept, setModelAccept] = useState(
    ".glb,.gltf,.fbx,.obj,.stl,.ply,.dae"
  );
  const [selectedModelId, setSelectedModelId] = useState("harvester");
  const [assetManifest, setAssetManifest] = useState({
    model: null,
    background: null,
  });
  const [report, setReport] = useState(null);
  const [motionPreview, setMotionPreview] = useState({
    playing: false,
    clipPlaying: false,
    clipRate: 1,
    clipId: null,
    diagnostics: false,
    rates: {},
    directions: {},
    resetVersion: 0,
  });
  const [motionInspection, setMotionInspection] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("请选择模型文件开始预处理。");
  const sceneRef = useRef(scene);
  const historyRef = useRef({ past: [], future: [] });
  const [, setHistoryVersion] = useState(0);
  const modelInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const sceneInputRef = useRef(null);
  const modelUrlRef = useRef(null);
  const backgroundUrlRef = useRef(null);
  const runtimeRef = useRef(null);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);
  const handleRuntimeReady = useCallback((runtime) => {
    runtimeRef.current = runtime;
  }, []);
  const handleModelInspect = useCallback((id, info, url) => {
    setMotionInspection({ id, url, trackIds: info.motionTrackIds });
    setReport((previous) => previous
      ? {
        ...previous,
        nodeNames: info.nodeNames?.length ? info.nodeNames : previous.nodeNames,
        clipNames: info.animationNames?.length ? info.animationNames : previous.clipNames,
        animations: info.animationNames?.length ?? previous.animations,
      }
      : previous);
  }, []);
  const activeModel = scene.models.find((model) => model.id === selectedModelId) || scene.models[0];
  const activeMotionModel = scene.models.find((model) => model.motionTracks?.length > 0);
  const boundTrackIds =
    motionInspection?.id === activeMotionModel?.id && motionInspection?.url === activeMotionModel?.url
      ? motionInspection?.trackIds
      : null;

  const resetPreviewForModel = () => {
    setMotionPreview((previous) => ({
      playing: false,
      clipPlaying: false,
      clipRate: 1,
      clipId: null,
      diagnostics: false,
      rates: {},
      directions: {},
      resetVersion: previous.resetVersion + 1,
    }));
    setMotionInspection(null);
  };

  const commitScene = (update) => {
    const previous = sceneRef.current;
    const next = typeof update === "function" ? update(previous) : update;
    if (!next || next === previous) return;
    historyRef.current = {
      past: [...historyRef.current.past, previous].slice(-30),
      future: [],
    };
    sceneRef.current = next;
    setScene(next);
    setHistoryVersion((value) => value + 1);
  };

  const replaceScene = (next) => {
    sceneRef.current = next;
    historyRef.current = { past: [], future: [] };
    setScene(next);
    setHistoryVersion((value) => value + 1);
  };

  const undoScene = () => {
    const { past, future } = historyRef.current;
    const previous = past[past.length - 1];
    if (!previous) return;
    historyRef.current = {
      past: past.slice(0, -1),
      future: [sceneRef.current, ...future].slice(0, 30),
    };
    sceneRef.current = previous;
    setScene(previous);
    setHistoryVersion((value) => value + 1);
    setMessage("已撤销上一项场景修改。");
  };

  const redoScene = () => {
    const { past, future } = historyRef.current;
    const next = future[0];
    if (!next) return;
    historyRef.current = {
      past: [...past, sceneRef.current].slice(-30),
      future: future.slice(1),
    };
    sceneRef.current = next;
    setScene(next);
    setHistoryVersion((value) => value + 1);
    setMessage("已重做上一项场景修改。");
  };

  const handleSceneFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported.models) || imported.models.length === 0) {
        throw new Error("场景配置缺少 models 模型列表");
      }
      const nextTheme = THEME_LABELS[imported.theme] ? imported.theme : "studio";
      const nextBackground = BACKGROUND_PRESETS.find((preset) => preset.files === imported.environment?.files);
      replaceScene(imported);
      setTheme(nextTheme);
      setBackgroundPreset(nextBackground?.id || (imported.environment?.files ? "custom" : "field"));
      setSelectedModelId(imported.models[0].id);
      setAssetManifest(imported.assetManifest || { model: null, background: null });
      setReport(null);
      resetPreviewForModel();
      setMessage(`${file.name} 已导入，场景参数与动作绑定已恢复。`);
    } catch (error) {
      setMessage(`场景配置导入失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const resetWorkspace = () => {
    if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
    modelUrlRef.current = null;
    backgroundUrlRef.current = null;
    replaceScene(createDefaultScene());
    setTheme("studio");
    setBackgroundPreset("field");
    setSelectedModelId("harvester");
    setAssetManifest({ model: null, background: null });
    setReport(null);
    resetPreviewForModel();
    setMessage("已恢复完整工作台默认配置。");
  };

  const hasBoundMotion = Boolean(boundTrackIds?.length);
  const hasClipMotion = Boolean(report?.animations || motionPreview.clipId);
  const hasMotionControls = hasBoundMotion || hasClipMotion;
  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const playAllMotion = () => {
    setMotionPreview((state) => ({
      ...state,
      playing: hasBoundMotion,
      clipPlaying: Boolean(report?.animations || state.clipId),
    }));
    setMessage("已播放当前模型的全部可用动作。");
  };

  const pauseAllMotion = () => {
    setMotionPreview((state) => ({ ...state, playing: false, clipPlaying: false }));
    setMessage("已暂停全部动作。");
  };

  const resetAllMotion = () => {
    setMotionPreview((state) => ({
      ...state,
      playing: false,
      clipPlaying: false,
      resetVersion: state.resetVersion + 1,
    }));
    setMessage("全部动作已复位。");
  };

  const updateScene = (update) => {
    const selectedVariant = runtimeRef.current?.getState().variantId;
    commitScene((previous) => ({
      ...update(previous),
      defaultVariant: selectedVariant ?? previous.defaultVariant,
    }));
  };

  const applyMotionPreset = (preset) => {
    const tracks = activeMotionModel?.motionTracks || [];
    const rates = Object.fromEntries(tracks.map((track) => [
      track.id,
      track.kind === "rotation" ? preset.rotationRate : preset.parallelRate,
    ]));
    const directions = Object.fromEntries(
      tracks
        .filter((track) => track.kind === "rotation")
        .map((track) => [track.id, preset.direction])
    );
    setMotionPreview((state) => ({
      ...state,
      playing: preset.playing && hasBoundMotion,
      clipPlaying: preset.playing && hasClipMotion,
      rates: { ...state.rates, ...rates },
      directions: { ...state.directions, ...directions },
      resetVersion: state.resetVersion + 1,
    }));
    if (activeMotionModel) {
      updateScene((previous) => ({
        ...previous,
        models: previous.models.map((model) => model.id === activeMotionModel.id
          ? {
            ...model,
            motionTracks: model.motionTracks.map((track) => ({
              ...track,
              rate: rates[track.id] ?? track.rate,
              ...(track.kind === "rotation" && { direction: preset.direction }),
            })),
          }
          : model),
      }));
    }
    setMessage(`已应用“${preset.label}”动作方案。`);
  };

  const setMotionDefinitions = (definitions) => {
    resetPreviewForModel();
    updateScene((previous) => ({
      ...setKnifeView(previous, definitions.length > 0),
      models: previous.models.map((model) => model.id === activeModel?.id
        ? { ...model, motionTracks: definitions.length > 0 ? definitions : undefined }
        : model),
    }));
    setMessage(definitions.length > 0 ? `已配置 ${definitions.length} 个可选动作。` : "已清空当前模型的动作绑定。");
  };

  const exportScene = () => {
    const defaultVariant = runtimeRef.current?.getState().variantId ?? scene.defaultVariant;
    const models = scene.models.map((model) => {
      let nextModel = model.motionTracks?.length > 0
        ? {
          ...model,
          motionTracks: model.motionTracks.map((track) => ({
            ...track,
            rate: motionPreview.rates[track.id] ?? track.rate,
            ...(track.kind === "rotation" && {
              direction: motionPreview.directions[track.id] ?? track.direction ?? 1,
            }),
          })),
        }
        : model;
      if (model.id === activeModel?.id && motionPreview.clipId) {
        nextModel = {
          ...nextModel,
          clipAnimation: {
            clipId: motionPreview.clipId,
            rate: motionPreview.clipRate ?? 1,
            playing: false,
          },
        };
      }
      return nextModel;
    });
    downloadScene({ ...scene, models, defaultVariant }, assetManifest);
  };

  useEffect(() => () => {
    if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
  }, []);

  const themeOptions = useMemo(() => Object.keys(HARVESTER_THEMES), []);

  const handleModelFile = async (file) => {
    if (!file) return;
    setBusy(true);
    const nextReport = await inspectAssetFile(file);
    setReport(nextReport);

    if (!nextReport.previewSupported) {
      setMessage(`${file.name} 已完成格式检查，但当前建议先转换为 GLB。`);
      setBusy(false);
      return;
    }

    if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    modelUrlRef.current = objectUrl;
    const matchingPreset = LOCAL_MODEL_PRESETS.find((preset) =>
      preset.fileName.toLowerCase() === file.name.toLowerCase()
      && preset.motionTracks?.every((track) => nextReport.nodeNames.includes(track.node))
    );
    resetPreviewForModel();
    updateScene((previous) => ({
      ...setKnifeView(previous, Boolean(matchingPreset)),
      title: "收获机视觉工作台",
      models: previous.models.map((model, index) =>
        (model.id === selectedModelId || (!selectedModelId && index === 0))
          ? {
            ...model,
            url: objectUrl,
            label: file.name.replace(/\.(glb|gltf)$/i, ""),
            autoFrame: true,
            motionTracks: matchingPreset?.motionTracks,
          }
          : model
      ),
    }));
    setAssetManifest((previous) => ({
      ...previous,
      model: {
        fileName: file.name,
        format: nextReport.format,
        slotId: selectedModelId,
      },
    }));
    setMessage(`${file.name} 已检查并替换到当前场景。`);
    setBusy(false);
  };

  const loadLocalModel = async (preset) => {
    setBusy(true);
    try {
      const response = await fetch(preset.url, { method: "HEAD" });
      if (!response.ok || response.headers.get("content-type")?.includes("text/html")) {
        setMessage(`项目里没有 ${preset.fileName}。点击「GLB」选择本地文件，或将它放入 public/model/。`);
        return;
      }
    } catch {
      setMessage(`未能访问 ${preset.fileName}，也可以用「GLB」按钮从本机选择文件。`);
      return;
    } finally {
      setBusy(false);
    }
    if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
    modelUrlRef.current = null;
    resetPreviewForModel();
    updateScene((previous) => ({
      ...setKnifeView(previous, Boolean(preset.motionTracks?.length)),
      models: previous.models.map((model, index) =>
        (model.id === selectedModelId || (!selectedModelId && index === 0))
          ? { ...model, url: preset.url, label: preset.label, autoFrame: true, motionTracks: preset.motionTracks }
          : model
      ),
    }));
    setAssetManifest((previous) => ({
      ...previous,
      model: {
        fileName: preset.fileName,
        format: "glb",
        slotId: selectedModelId,
        source: "workspace",
      },
    }));
    setReport({
      fileName: preset.fileName,
      format: "glb",
      size: "637.25 MB",
      previewSupported: true,
      meshes: 113,
      materials: 37,
      nodes: 121,
      nodeNames: WORKSPACE_HEADER_MOTION.map((track) => track.node),
      animations: 0,
      clipNames: [],
      vertices: null,
      faces: null,
      notes: ["工作区割台模型已接入当前场景，正在等待渲染器完成几何体体检。"],
      motion: createMotionCapabilitiesFromDefinitions(preset.motionTracks),
    });
    setMessage(`${preset.fileName} 已加载到当前场景。`);
  };

  const handleBackgroundFile = (file) => {
    if (!file) return;
    const format = file.name.toLowerCase().split(".").pop();
    if (!['hdr', 'exr'].includes(format)) {
      setMessage("背景文件建议使用 HDR 或 EXR 格式。\n");
      return;
    }
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    backgroundUrlRef.current = objectUrl;
    setBackgroundPreset("custom");
    setAssetManifest((previous) => ({
      ...previous,
      background: { fileName: file.name, format },
    }));
    updateScene((previous) => ({
      ...previous,
      environment: { ...previous.environment, files: objectUrl },
    }));
    setMessage(`${file.name} 已作为环境背景替换。`);
  };

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    setBackgroundPreset(nextTheme);
    updateScene((previous) => createHarvesterThemeScene(previous, nextTheme));
    setMessage(`已切换到“${THEME_LABELS[nextTheme]}”视觉主题。`);
  };

  const handleBackgroundPreset = (preset) => {
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
    backgroundUrlRef.current = null;
    setBackgroundPreset(preset.id);
    setAssetManifest((previous) => ({ ...previous, background: null }));
    updateScene((previous) => ({
      ...previous,
      environment: { ...previous.environment, files: preset.files },
    }));
    setMessage(`已选择“${preset.label}”作为环境背景。`);
  };

  const resetModel = () => {
    if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
    modelUrlRef.current = null;
    resetPreviewForModel();
    updateScene((previous) => ({
      ...setKnifeView(previous, false),
      models: previous.models.map((model) => ({
        ...model,
        url: DEMO_MODEL_URL,
        label: "示例模型（可替换）",
        autoFrame: false,
        motionTracks: undefined,
      })),
    }));
    setAssetManifest((previous) => ({ ...previous, model: null }));
    setReport(null);
    setMessage("已恢复示例模型。\n");
  };

  return (
    <div className="asset-workbench">
      <SceneViewer
        scene={scene}
        onRuntimeReady={handleRuntimeReady}
        onModelInspect={handleModelInspect}
        motionPreview={(() => {
          const previewModel = activeMotionModel || activeModel;
          return previewModel ? { ...motionPreview, modelId: previewModel.id } : null;
        })()}
      />

      <aside className="asset-workbench-panel">
        <div className="asset-workbench-title">
          <span>收获机视觉工作台</span>
          <small>Asset Lab</small>
        </div>

        <section className="asset-action-center" aria-label="工作台快捷操作">
          <h3>快捷操作</h3>
          <p className="asset-workbench-hint">把常用预览、诊断和配置管理集中到这里。</p>
          <div className="asset-action-grid">
            <button
              type="button"
              className="asset-primary-button"
              disabled={!hasMotionControls}
              onClick={playAllMotion}
            >
              ▶ 播放全部
            </button>
            <button
              type="button"
              className="asset-secondary-button"
              disabled={!hasMotionControls}
              onClick={pauseAllMotion}
            >
              ❚❚ 全部暂停
            </button>
            <button
              type="button"
              className="asset-secondary-button"
              disabled={!hasMotionControls}
              onClick={resetAllMotion}
            >
              ↺ 全部复位
            </button>
            <button
              type="button"
              className={`asset-secondary-button ${motionPreview.diagnostics ? "is-active" : ""}`}
              disabled={!activeMotionModel}
              onClick={() => setMotionPreview((state) => ({ ...state, diagnostics: !state.diagnostics }))}
            >
              {motionPreview.diagnostics ? "隐藏诊断轴" : "显示诊断轴"}
            </button>
          </div>
          <input
            ref={sceneInputRef}
            type="file"
            accept=".scene.json,application/json"
            hidden
            onChange={(event) => {
              handleSceneFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div className="asset-action-grid asset-config-actions">
            <button type="button" className="asset-secondary-button" disabled={busy} onClick={() => sceneInputRef.current?.click()}>
              导入场景配置
            </button>
            <button type="button" className="asset-secondary-button" disabled={busy} onClick={exportScene}>
              导出场景配置
            </button>
            <button type="button" className="asset-secondary-button" disabled={busy} onClick={resetWorkspace}>
              恢复完整默认
            </button>
          </div>
          <div className="asset-action-grid asset-history-actions">
            <button type="button" className="asset-secondary-button" disabled={!canUndo} onClick={undoScene}>
              ↶ 撤销
            </button>
            <button type="button" className="asset-secondary-button" disabled={!canRedo} onClick={redoScene}>
              ↷ 重做
            </button>
          </div>
          <div className="asset-workbench-status" role="status">
            <span>模型<strong>{activeModel?.label || "未加载"}</strong></span>
            <span>动作<strong>{hasBoundMotion ? `${boundTrackIds.length} 个已绑定` : "未绑定"}</strong></span>
            <span>片段<strong>{report?.animations || 0}</strong></span>
          </div>
          <div className="asset-action-subgroup">
            <span className="asset-tuning-label">动作方案</span>
            <div className="asset-theme-list">
              {MOTION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!hasMotionControls}
                  onClick={() => applyMotionPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h3>模型预处理</h3>
          <p className="asset-workbench-hint">先按格式选择入口，再检查网格、材质、动画和可预览性。</p>
          <input
            ref={modelInputRef}
            type="file"
            accept={modelAccept}
            hidden
            onChange={(event) => {
              handleModelFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div className="asset-format-list">
            {MODEL_FORMAT_BUTTONS.map((item) => (
              <button
                key={item.id}
                className={item.id === "all" ? "is-wide" : ""}
                onClick={() => {
                  setModelAccept(item.accept);
                  modelInputRef.current?.click();
                }}
                disabled={busy}
              >
                {item.id === "all" && busy ? "正在检查…" : item.label}
              </button>
            ))}
          </div>
          <div className="asset-local-model-list">
            {LOCAL_MODEL_PRESETS.map((preset) => (
              <button key={preset.id} className="asset-local-model-button" disabled={busy} onClick={() => loadLocalModel(preset)}>
                <strong>{preset.label}</strong>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>
          {scene.models.length > 1 && (
            <label className="asset-select-label">
              替换模型槽位
              <select value={selectedModelId} onChange={(event) => setSelectedModelId(event.target.value)}>
                {scene.models.map((model) => <option key={model.id} value={model.id}>{model.label || model.id}</option>)}
              </select>
            </label>
          )}
          <button className="asset-secondary-button" disabled={busy} onClick={resetModel}>
            恢复示例模型
          </button>
        </section>

        {(report || activeMotionModel) && (
          <MotionCapabilityPanel
            report={report}
            definitions={activeModel?.motionTracks || []}
            boundTrackIds={boundTrackIds}
            onSetDefinitions={setMotionDefinitions}
            diagnostics={motionPreview.diagnostics}
            onToggleDiagnostics={() => setMotionPreview((state) => ({ ...state, diagnostics: !state.diagnostics }))}
          />
        )}

        {report && (report.animations > 0 || report.clipNames?.length > 0) && (
          <ClipMotionPanel
            clips={report.clipNames}
            clipCount={report.animations}
            preview={motionPreview}
            onChange={setMotionPreview}
          />
        )}

        {activeMotionModel && (
          <PartMotionPanel
            definitions={activeMotionModel.motionTracks}
            boundTrackIds={boundTrackIds}
            preview={motionPreview}
            onChange={setMotionPreview}
          />
        )}

        {report && (
          <section className="asset-report">
            <h3>检查结果</h3>
            <div className="asset-report-grid">
              <span>文件</span><strong>{report.fileName}</strong>
              <span>格式</span><strong>{report.format.toUpperCase()}</strong>
              <span>大小</span><strong>{report.size}</strong>
              {report.meshes != null && <><span>网格</span><strong>{report.meshes}</strong></>}
              {report.materials != null && <><span>材质</span><strong>{report.materials}</strong></>}
              {report.nodes != null && <><span>节点</span><strong>{report.nodes}</strong></>}
              {report.animations != null && <><span>动画</span><strong>{report.animations}</strong></>}
              {report.vertices != null && <><span>顶点</span><strong>{report.vertices}</strong></>}
              {report.faces != null && <><span>面</span><strong>{report.faces}</strong></>}
            </div>
            <p className={report.previewSupported ? "asset-status-ok" : "asset-status-warn"}>
              {report.previewSupported ? "可直接替换到当前场景" : "已完成预处理检查，需先转换为 GLB"}
            </p>
            {report.notes.map((note, index) => <p key={index}>{note}</p>)}
          </section>
        )}

        <section>
          <h3>视觉主题</h3>
          <div className="asset-theme-list">
            {themeOptions.map((item) => (
              <button
                key={item}
                className={theme === item ? "is-active" : ""}
                onClick={() => handleThemeChange(item)}
              >
                {THEME_LABELS[item]}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>环境背景</h3>
          <div className="asset-theme-list asset-background-list">
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={backgroundPreset === preset.id ? "is-active" : ""}
                onClick={() => handleBackgroundPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            ref={backgroundInputRef}
            type="file"
            accept=".hdr,.exr"
            hidden
            onChange={(event) => {
              handleBackgroundFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button className="asset-secondary-button" onClick={() => backgroundInputRef.current?.click()}>
            选择 HDR / EXR
          </button>
        </section>

        <RenderTuningPanel scene={scene} onChange={updateScene} />

        <button className="asset-export-button" onClick={exportScene}>
          导出当前场景配置
        </button>
        <div className="asset-workbench-message">{message}</div>
      </aside>
    </div>
  );
}

