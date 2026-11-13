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
import MaterialOverridePanel from "./MaterialOverridePanel.jsx";
import PartMotionPanel from "./PartMotionPanel.jsx";
import RenderTuningPanel from "./RenderTuningPanel.jsx";
import ScenePerformancePanel from "./ScenePerformancePanel.jsx";
import VisualPresetPanel from "./VisualPresetPanel.jsx";
import VisualPresetLibraryPanel from "./VisualPresetLibraryPanel.jsx";
import CameraPresetPanel from "./CameraPresetPanel.jsx";
import ModelTransformPanel from "./ModelTransformPanel.jsx";
import ModelNodeTransformPanel from "./ModelNodeTransformPanel.jsx";
import ModelAssemblyPanel from "./ModelAssemblyPanel.jsx";
import AssemblyPresetPanel from "./AssemblyPresetPanel.jsx";
import ModelHierarchyPanel from "./ModelHierarchyPanel.jsx";
import BatchModelLoadPanel from "./BatchModelLoadPanel.jsx";
import { applyOptimizationPlan, getOptimizationPlan } from "./scene-optimization.js";
import {
  COLOR_GRADE_PRESETS,
  PARTICLE_PRESETS,
  QUALITY_PRESETS,
  VISUAL_PRESETS,
  findPreset,
} from "./visual-presets.js";
import "./asset-workbench.less";

const DEMO_MODEL_URL = "/model/汽车.glb";
const WORKSPACE_HEADER_MODEL_URL = "/model/text_model001.glb";
const LOCAL_SCENE_STORAGE_KEY = "sy-me.asset-workbench.scene.v1";
const VISUAL_LIBRARY_STORAGE_KEY = "sy-me.asset-workbench.visual-library.v1";
const VISUAL_LIBRARY_FILE_VERSION = 1;

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

function normalizeAssetManifest(manifest = {}) {
  const legacyModel = manifest.model;
  const models = manifest.models || (legacyModel?.slotId
    ? { [legacyModel.slotId]: legacyModel }
    : {});
  return {
    model: legacyModel || null,
    models,
    background: manifest.background || null,
  };
}

function resolveCameraShotId(scene, preferredId) {
  const shots = Array.isArray(scene?.shots) ? scene.shots : [];
  if (preferredId && shots.some((shot) => shot.id === preferredId)) return preferredId;
  return scene?.camera?.defaultShot || shots[0]?.id || "hero";
}

function setKnifeView(scene, enabled) {
  const shots = scene.shots.filter((shot) => shot.id !== WORKSPACE_KNIFE_SHOT.id);
  return {
    ...scene,
    shots: enabled ? [...shots, WORKSPACE_KNIFE_SHOT] : shots,
    controls: { ...scene.controls, minDistance: enabled ? 0.75 : 4 },
  };
}

function createDefaultScene() {
  const scene = createHarvesterScene({
    modelUrl: DEMO_MODEL_URL,
    modelLabel: "示例模型（可替换）",
    title: "收获机视觉工作台",
  });
  return {
    ...scene,
    visualPreset: "custom",
    models: scene.models.map((model) => ({
      ...model,
      assetId: model.id,
      parentId: null,
      assemblyId: null,
      assetFormat: "glb",
      assetSource: "demo",
    })),
  };
}

function downloadScene(scene, assetManifest) {
  const exportScene = {
    ...scene,
    models: scene.models?.map((model) => ({ ...model })),
  };
  const localModels = assetManifest.models || (assetManifest.model?.slotId
    ? { [assetManifest.model.slotId]: assetManifest.model }
    : {});
  const localBackground = assetManifest.background;
  exportScene.models = exportScene.models.map((model) => {
    const localModel = localModels[model.id];
    if (!localModel) return model;
    const modelUrl = localModel.source === "workspace"
      ? `/model/${localModel.fileName}`
      : `./assets/${localModel.fileName}`;
    return { ...model, url: modelUrl };
  });
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
  const [visualPresetId, setVisualPresetId] = useState("custom");
  const [cameraShotId, setCameraShotId] = useState("hero");
  const [modelAccept, setModelAccept] = useState(
    ".glb,.gltf,.fbx,.obj,.stl,.ply,.dae"
  );
  const [selectedModelId, setSelectedModelId] = useState("harvester");
  const [assetManifest, setAssetManifest] = useState({
    model: null,
    models: {},
    background: null,
  });
  const [reports, setReports] = useState({});
  const [modelHierarchies, setModelHierarchies] = useState({});
  const [modelSockets, setModelSockets] = useState({});
  const [selectedNodeIds, setSelectedNodeIds] = useState({});
  const [batchQueue, setBatchQueue] = useState([]);
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
  const [performance, setPerformance] = useState(null);
  const [localSceneSavedAt, setLocalSceneSavedAt] = useState(null);
  const [visualLibrary, setVisualLibrary] = useState([]);
  const [message, setMessage] = useState("请选择模型文件开始预处理。");
  const sceneRef = useRef(scene);
  const historyRef = useRef({ past: [], future: [] });
  const [, setHistoryVersion] = useState(0);
  const modelInputRef = useRef(null);
  const batchModelInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const sceneInputRef = useRef(null);
  const modelUrlsRef = useRef(new Map());
  const backgroundUrlRef = useRef(null);
  const captureRef = useRef(null);
  const runtimeRef = useRef(null);
  const sceneApiRef = useRef(null);

  const releaseModelUrl = (modelId) => {
    const url = modelUrlsRef.current.get(modelId);
    if (url) URL.revokeObjectURL(url);
    modelUrlsRef.current.delete(modelId);
  };

  const releaseAllModelUrls = () => {
    modelUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    modelUrlsRef.current.clear();
  };
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_SCENE_STORAGE_KEY) || "null");
      setLocalSceneSavedAt(saved?.savedAt || null);
    } catch {
      setLocalSceneSavedAt(null);
    }
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(VISUAL_LIBRARY_STORAGE_KEY) || "[]");
      setVisualLibrary(Array.isArray(saved) ? saved : []);
    } catch {
      setVisualLibrary([]);
    }
  }, []);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);
  const handleRuntimeReady = useCallback((runtime) => {
    runtimeRef.current = runtime;
  }, []);
  const handleCaptureReady = useCallback((capture) => {
    captureRef.current = capture;
  }, []);
  const handleSceneApiReady = useCallback((api) => {
    sceneApiRef.current = api;
  }, []);
  const handleModelInspect = useCallback((id, info, url) => {
    setMotionInspection({ id, url, trackIds: info.motionTrackIds });
    setModelHierarchies((previous) => ({
      ...previous,
      [id]: info.nodeHierarchy || [],
    }));
    setModelSockets((previous) => ({
      ...previous,
      [id]: info.sockets || [],
    }));
    setReports((previous) => {
      const report = previous[id];
      if (!report) return previous;
      return {
        ...previous,
        [id]: {
          ...report,
          nodeNames: info.nodeNames?.length ? info.nodeNames : report.nodeNames,
          materialNames: info.materialNames?.length ? info.materialNames : report.materialNames,
          nodeHierarchy: info.nodeHierarchy?.length ? info.nodeHierarchy : report.nodeHierarchy,
          sockets: info.sockets?.length ? info.sockets : report.sockets,
          clipNames: info.animationNames?.length ? info.animationNames : report.clipNames,
          animations: info.animationNames?.length ?? report.animations,
        },
      };
    });
  }, []);
  const activeModel = scene.models.find((model) => model.id === selectedModelId) || scene.models[0];
  const report = reports[selectedModelId] || null;
  const activeMotionModel = activeModel?.motionTracks?.length > 0 ? activeModel : null;
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
      setVisualPresetId(VISUAL_PRESETS.some((preset) => preset.id === imported.visualPreset)
        ? imported.visualPreset
        : "custom");
      setCameraShotId(imported.camera?.defaultShot || imported.shots?.[0]?.id || "hero");
      setSelectedModelId(imported.models[0].id);
      setAssetManifest(normalizeAssetManifest(imported.assetManifest));
      setReports({});
      setModelHierarchies({});
      setModelSockets({});
      setSelectedNodeIds({});
      resetPreviewForModel();
      setMessage(`${file.name} 已导入，场景参数与动作绑定已恢复。`);
    } catch (error) {
      setMessage(`场景配置导入失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const resetWorkspace = () => {
    releaseAllModelUrls();
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
    backgroundUrlRef.current = null;
    replaceScene(createDefaultScene());
    setTheme("studio");
    setBackgroundPreset("field");
    setVisualPresetId("custom");
    setCameraShotId("hero");
    setSelectedModelId("harvester");
    setAssetManifest({ model: null, models: {}, background: null });
    setReports({});
    setModelHierarchies({});
    setModelSockets({});
    setSelectedNodeIds({});
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

  const captureScene = () => {
    const dataUrl = captureRef.current?.();
    if (!dataUrl) {
      setMessage("渲染器还未准备好，暂时无法导出画面。");
      return;
    }
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${scene.id || "harvester-scene"}-view.png`;
    link.click();
    setMessage("已导出当前渲染画面 PNG。");
  };

  const optimizePerformance = () => {
    setVisualPresetId("custom");
    updateVisualScene((previous) => ({
      ...previous,
      renderer: {
        ...previous.renderer,
        dpr: [1, 1],
        shadows: false,
      },
      effects: {
        ...previous.effects,
        enabled: false,
        multisampling: 0,
        bloom: { ...previous.effects?.bloom, enabled: false },
        vignette: { ...previous.effects?.vignette, enabled: false },
        noise: { ...previous.effects?.noise, enabled: false },
      },
      particles: { ...previous.particles, enabled: false },
    }));
    setMessage("已应用性能优先配置：关闭阴影、后期和粒子，并降低 DPR。");
  };

  const restoreQuality = () => {
    setVisualPresetId("custom");
    updateVisualScene((previous) => ({
      ...previous,
      renderer: {
        ...previous.renderer,
        dpr: [1, 1.5],
        shadows: true,
        toneMapping: previous.renderer?.toneMapping || "ACESFilmic",
      },
      effects: {
        ...previous.effects,
        enabled: true,
        multisampling: previous.effects?.multisampling ?? 2,
        bloom: { ...previous.effects?.bloom, enabled: true },
        vignette: { ...previous.effects?.vignette, enabled: true },
        noise: { ...previous.effects?.noise, enabled: true },
      },
    }));
    setMessage("已恢复高质量渲染配置。");
  };

  const autoOptimizeScene = () => {
    const plan = getOptimizationPlan(performance, scene);
    if (plan.id === "none") {
      setMessage("当前场景负载正常，暂不需要自动降级。");
      return;
    }
    updateVisualScene((previous) => applyOptimizationPlan(previous, plan));
    setMessage(`已应用“${plan.label}”：${plan.description}`);
  };

  const saveLocalScene = () => {
    const savedAt = new Date().toISOString();
    try {
      localStorage.setItem(LOCAL_SCENE_STORAGE_KEY, JSON.stringify({
        scene,
        assetManifest,
        theme,
        backgroundPreset,
        visualPresetId,
        cameraShotId,
        savedAt,
      }));
      setLocalSceneSavedAt(savedAt);
      setMessage("当前视觉方案已保存到浏览器本地。");
    } catch (error) {
      setMessage(`本地方案保存失败：${error.message}`);
    }
  };

  const restoreLocalScene = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_SCENE_STORAGE_KEY) || "null");
      if (!saved?.scene || !Array.isArray(saved.scene.models) || saved.scene.models.length === 0) {
        throw new Error("没有可恢复的有效场景");
      }
      setTheme(saved.theme || "studio");
      setBackgroundPreset(saved.backgroundPreset || "field");
      setVisualPresetId(saved.visualPresetId || saved.scene.visualPreset || "custom");
      const nextShotId = resolveCameraShotId(saved.scene, saved.cameraShotId);
      replaceScene({
        ...saved.scene,
        camera: { ...saved.scene.camera, defaultShot: nextShotId },
      });
      setCameraShotId(nextShotId);
      setSelectedModelId(saved.scene.models[0].id);
      setAssetManifest(normalizeAssetManifest(saved.assetManifest));
      setReports({});
      setModelHierarchies({});
      setModelSockets({});
      setSelectedNodeIds({});
      resetPreviewForModel();
      setMessage("已恢复浏览器本地视觉方案。");
    } catch (error) {
      setMessage(`本地方案恢复失败：${error.message}`);
    }
  };

  const clearLocalScene = () => {
    localStorage.removeItem(LOCAL_SCENE_STORAGE_KEY);
    setLocalSceneSavedAt(null);
    setMessage("已清除浏览器本地视觉方案。");
  };

  const saveVisualLibraryPreset = (name) => {
    const savedAt = new Date().toISOString();
    const entry = {
      id: `visual-${Date.now()}`,
      name,
      savedAt,
      scene: JSON.parse(JSON.stringify({ ...scene, visualPreset: visualPresetId })),
      assetManifest: JSON.parse(JSON.stringify(assetManifest)),
      theme,
      backgroundPreset,
      visualPresetId,
      cameraShotId,
      selectedModelId,
    };
    const nextLibrary = [entry, ...visualLibrary].slice(0, 20);
    try {
      localStorage.setItem(VISUAL_LIBRARY_STORAGE_KEY, JSON.stringify(nextLibrary));
      setVisualLibrary(nextLibrary);
      setMessage(`已将当前方案保存为“${name}”。`);
    } catch (error) {
      setMessage(`视觉方案保存失败：${error.message}`);
    }
  };

  const exportVisualLibrary = () => {
    if (visualLibrary.length === 0) {
      setMessage("视觉方案库为空，先保存至少一套方案再导出。");
      return;
    }
    const payload = {
      version: VISUAL_LIBRARY_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      entries: visualLibrary,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sy-me-visual-library.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`已导出 ${visualLibrary.length} 套视觉方案。`);
  };

  const importVisualLibrary = async (file) => {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const candidates = Array.isArray(payload) ? payload : payload?.entries;
      if (!Array.isArray(candidates)) throw new Error("文件缺少 entries 方案列表");
      const importedAt = new Date().toISOString();
      const imported = candidates
        .filter((entry) => entry
          && typeof entry.name === "string"
          && entry.name.trim()
          && entry.scene
          && Array.isArray(entry.scene.models)
          && entry.scene.models.length > 0)
        .slice(0, 20)
        .map((entry, index) => ({
          ...entry,
          id: `visual-import-${Date.now()}-${index}`,
          name: entry.name.trim().slice(0, 80),
          savedAt: entry.savedAt || importedAt,
        }));
      if (imported.length === 0) throw new Error("没有包含有效模型的视觉方案");
      const nextLibrary = [...imported, ...visualLibrary].slice(0, 20);
      localStorage.setItem(VISUAL_LIBRARY_STORAGE_KEY, JSON.stringify(nextLibrary));
      setVisualLibrary(nextLibrary);
      setMessage(`已导入 ${imported.length} 套视觉方案，已合并到当前方案库。`);
    } catch (error) {
      setMessage(`视觉方案导入失败：${error.message}`);
    }
  };

  const applyVisualLibraryPreset = (entry) => {
    if (!entry?.scene || !Array.isArray(entry.scene.models) || entry.scene.models.length === 0) {
      setMessage("该方案缺少有效场景模型，无法应用。");
      return;
    }
    const nextShotId = resolveCameraShotId(entry.scene, entry.cameraShotId);
    const nextScene = {
      ...entry.scene,
      camera: { ...entry.scene.camera, defaultShot: nextShotId },
    };
    replaceScene(nextScene);
    setTheme(entry.theme || entry.scene.theme || "studio");
    setBackgroundPreset(entry.backgroundPreset || "field");
    setVisualPresetId(entry.visualPresetId || entry.scene.visualPreset || "custom");
    setCameraShotId(nextShotId);
    setSelectedModelId(entry.selectedModelId || entry.scene.models[0].id);
    setAssetManifest(normalizeAssetManifest(entry.assetManifest));
    setReports({});
    setModelHierarchies({});
    setModelSockets({});
    setSelectedNodeIds({});
    resetPreviewForModel();
    runtimeRef.current?.dispatch({
      type: "variant/set",
      payload: { id: nextScene.defaultVariant || "original" },
    });
    runtimeRef.current?.dispatch({
      type: "shot/set",
      payload: { id: nextShotId },
    });
    setMessage(`已应用视觉方案“${entry.name}”。`);
  };

  const deleteVisualLibraryPreset = (entryId) => {
    const nextLibrary = visualLibrary.filter((entry) => entry.id !== entryId);
    try {
      localStorage.setItem(VISUAL_LIBRARY_STORAGE_KEY, JSON.stringify(nextLibrary));
      setVisualLibrary(nextLibrary);
      setMessage("已删除视觉方案库中的方案。");
    } catch (error) {
      setMessage(`视觉方案删除失败：${error.message}`);
    }
  };

  const updateScene = (update) => {
    const selectedVariant = runtimeRef.current?.getState().variantId;
    commitScene((previous) => ({
      ...update(previous),
      defaultVariant: selectedVariant ?? previous.defaultVariant,
    }));
  };

  const updateVisualScene = (update) => {
    setVisualPresetId("custom");
    updateScene((previous) => ({
      ...update(previous),
      visualPreset: "custom",
    }));
  };

  const applyVisualPreset = (preset) => {
    const quality = findPreset(QUALITY_PRESETS, preset.quality);
    const particles = findPreset(PARTICLE_PRESETS, preset.particles);
    const colorGrade = findPreset(COLOR_GRADE_PRESETS, preset.colorGrade);
    const background = BACKGROUND_PRESETS.find((item) => item.id === preset.background);

    commitScene((previous) => {
      const themed = createHarvesterThemeScene(previous, preset.theme);
      const qualityEffects = quality.config.effects || {};
      return {
        ...themed,
        visualPreset: preset.id,
        defaultVariant: preset.variant,
        renderer: { ...themed.renderer, ...quality.config.renderer },
        environment: {
          ...themed.environment,
          ...(background ? { files: background.files } : {}),
        },
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
    });
    setTheme(preset.theme);
    setBackgroundPreset(preset.background);
    setVisualPresetId(preset.id);
    setCameraShotId(preset.shot);
    runtimeRef.current?.dispatch({ type: "variant/set", payload: { id: preset.variant } });
    runtimeRef.current?.dispatch({ type: "shot/set", payload: { id: preset.shot } });
    setMessage(`已应用“${preset.label}”视觉方案：${preset.description}`);
  };

  const selectCameraShot = (shotId) => {
    setCameraShotId(shotId);
    updateVisualScene((previous) => ({
      ...previous,
      camera: { ...previous.camera, defaultShot: shotId },
    }));
    runtimeRef.current?.dispatch({ type: "shot/set", payload: { id: shotId } });
  };

  const updateCameraShot = (shotId, patch) => {
    setCameraShotId(shotId);
    updateVisualScene((previous) => ({
      ...previous,
      camera: { ...previous.camera, defaultShot: shotId },
      shots: previous.shots.map((shot) => shot.id === shotId ? { ...shot, ...patch } : shot),
    }));
    runtimeRef.current?.dispatch({ type: "shot/set", payload: { id: shotId } });
  };

  const addCameraShot = (reference) => {
    const existingIds = new Set(scene.shots.map((shot) => shot.id));
    let index = scene.shots.length + 1;
    let id = `custom-shot-${index}`;
    while (existingIds.has(id)) {
      index += 1;
      id = `custom-shot-${index}`;
    }
    const nextShot = {
      id,
      label: `自定义镜头 ${index}`,
      position: [...(reference.position || [8, 4, 10])],
      target: [...(reference.target || [0, 1, 0])],
      durationMs: reference.durationMs ?? 1200,
    };
    updateVisualScene((previous) => ({
      ...previous,
      camera: { ...previous.camera, defaultShot: id },
      shots: [...previous.shots, nextShot],
    }));
    setCameraShotId(id);
    runtimeRef.current?.dispatch({ type: "shot/set", payload: { id } });
    setMessage(`已新增“${nextShot.label}”，可以继续编辑位置和观察目标。`);
  };

  const removeCameraShot = (shotId) => {
    if (scene.shots.length <= 1) {
      setMessage("至少保留一个镜头预设。");
      return;
    }
    const remaining = scene.shots.filter((shot) => shot.id !== shotId);
    const nextShotId = remaining[0].id;
    updateVisualScene((previous) => ({
      ...previous,
      camera: { ...previous.camera, defaultShot: nextShotId },
      shots: previous.shots.filter((shot) => shot.id !== shotId),
    }));
    setCameraShotId(nextShotId);
    runtimeRef.current?.dispatch({ type: "shot/set", payload: { id: nextShotId } });
    setMessage("已移除镜头预设。");
  };

  const updateActiveModelTransform = (patch) => {
    updateVisualScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => model.id === activeModel?.id
        ? { ...model, ...patch }
        : model),
    }));
  };

  const resetActiveModelTransform = () => {
    updateActiveModelTransform({
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      autoFrame: false,
    });
    setMessage("已重置当前模型变换。");
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

  const setMaterialOverrides = (nextOverrides) => {
    updateScene((previous) => {
      const currentModel = previous.models.find((model) => model.id === activeModel?.id);
      const resolved = typeof nextOverrides === "function"
        ? nextOverrides(currentModel?.materialOverrides || [])
        : nextOverrides;
      return {
        ...previous,
        models: previous.models.map((model) => model.id === activeModel?.id
          ? { ...model, materialOverrides: resolved.length > 0 ? resolved : undefined }
          : model),
      };
    });
    setMessage("已更新局部材质覆盖配置。");
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
    releaseAllModelUrls();
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
  }, []);

  const themeOptions = useMemo(() => Object.keys(HARVESTER_THEMES), []);

  const handleModelFile = async (file) => {
    if (!file) return;
    setBusy(true);
    const nextReport = await inspectAssetFile(file);
    setReports((previous) => ({ ...previous, [selectedModelId]: nextReport }));

    if (!nextReport.previewSupported) {
      setMessage(`${file.name} 已完成格式检查，但当前建议先转换为 GLB。`);
      setBusy(false);
      return;
    }

    releaseModelUrl(selectedModelId);
    const objectUrl = URL.createObjectURL(file);
    modelUrlsRef.current.set(selectedModelId, objectUrl);
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
            assetFormat: nextReport.format,
            assetSource: "local",
            autoFrame: true,
            nodeVisibility: undefined,
            nodeTransformDeltas: undefined,
            motionTracks: matchingPreset?.motionTracks,
          }
          : model
      ),
    }));
    const modelManifest = {
        fileName: file.name,
        format: nextReport.format,
        slotId: selectedModelId,
        source: "local",
      };
    setAssetManifest((previous) => ({
      ...previous,
      model: modelManifest,
      models: { ...(previous.models || {}), [selectedModelId]: modelManifest },
    }));
    setMessage(`${file.name} 已检查并替换到当前场景。`);
    setBusy(false);
  };

  const handleBatchModelFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const queueItems = files.map((file, index) => ({
      id: `batch-${Date.now()}-${index}`,
      name: file.name,
      status: "pending",
      message: "",
    }));
    setBatchQueue(queueItems);
    setBusy(true);

    const loadedModels = [];
    const loadedReports = {};
    const loadedManifests = {};
    const existingIds = new Set(sceneRef.current.models.map((model) => model.id));
    let modelIndex = sceneRef.current.models.length + 1;

    const updateQueueItem = (id, patch) => {
      setBatchQueue((previous) => previous.map((item) => item.id === id ? { ...item, ...patch } : item));
    };

    try {
      for (const [index, file] of files.entries()) {
        const queueItem = queueItems[index];
        updateQueueItem(queueItem.id, { status: "processing", message: "读取模型元数据" });
        try {
          const nextReport = await inspectAssetFile(file);
          if (!nextReport.previewSupported) {
            updateQueueItem(queueItem.id, { status: "skipped", message: "建议转换为单文件 GLB" });
            continue;
          }

          let modelId = `model-${modelIndex}`;
          while (existingIds.has(modelId)) {
            modelIndex += 1;
            modelId = `model-${modelIndex}`;
          }
          existingIds.add(modelId);
          modelIndex += 1;
          const objectUrl = URL.createObjectURL(file);
          modelUrlsRef.current.set(modelId, objectUrl);
          const model = {
            id: modelId,
            assetId: modelId,
            label: file.name.replace(/\.(glb|gltf)$/i, ""),
            url: objectUrl,
            position: [loadedModels.length * 2.2, 0, 0],
            rotation: [0, 0, 0],
            scale: 1,
            visible: true,
            variantTarget: false,
            parentId: null,
            assemblyId: null,
            assetFormat: nextReport.format,
            assetSource: "local",
            autoFrame: true,
            nodeVisibility: undefined,
            nodeTransformDeltas: undefined,
          };
          const manifest = {
            fileName: file.name,
            format: nextReport.format,
            slotId: modelId,
            source: "local",
          };
          loadedModels.push(model);
          loadedReports[modelId] = nextReport;
          loadedManifests[modelId] = manifest;
          updateQueueItem(queueItem.id, { status: "loaded", message: "已创建模型槽位" });
        } catch (error) {
          updateQueueItem(queueItem.id, { status: "failed", message: error.message });
        }
      }

      if (loadedModels.length > 0) {
        updateScene((previous) => ({
          ...previous,
          models: [...previous.models, ...loadedModels],
        }));
        setReports((previous) => ({ ...previous, ...loadedReports }));
        setAssetManifest((previous) => ({
          ...previous,
          model: loadedManifests[loadedModels[loadedModels.length - 1].id] || previous.model,
          models: { ...(previous.models || {}), ...loadedManifests },
        }));
        setSelectedModelId(loadedModels[loadedModels.length - 1].id);
        setSelectedNodeIds({});
        setMessage(`批量加载完成：新增 ${loadedModels.length} 个模型槽位。`);
      } else {
        setMessage("批量预处理完成，但没有可直接预览的模型。");
      }
    } finally {
      setBusy(false);
    }
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
    releaseModelUrl(selectedModelId);
    resetPreviewForModel();
    updateScene((previous) => ({
      ...setKnifeView(previous, Boolean(preset.motionTracks?.length)),
      models: previous.models.map((model, index) =>
        (model.id === selectedModelId || (!selectedModelId && index === 0))
          ? {
            ...model,
            url: preset.url,
            label: preset.label,
            assetFormat: "glb",
            assetSource: "workspace",
            autoFrame: true,
            nodeVisibility: undefined,
            nodeTransformDeltas: undefined,
            motionTracks: preset.motionTracks,
          }
          : model
      ),
    }));
    const modelManifest = {
        fileName: preset.fileName,
        format: "glb",
        slotId: selectedModelId,
        source: "workspace",
      };
    setAssetManifest((previous) => ({
      ...previous,
      model: modelManifest,
      models: { ...(previous.models || {}), [selectedModelId]: modelManifest },
    }));
    setReports((previous) => ({ ...previous, [selectedModelId]: {
      fileName: preset.fileName,
      format: "glb",
      size: "637.25 MB",
      previewSupported: true,
      meshes: 113,
      materials: 37,
      nodes: 121,
      nodeNames: WORKSPACE_HEADER_MOTION.map((track) => track.node),
      materialNames: [],
      animations: 0,
      clipNames: [],
      vertices: null,
      faces: null,
      notes: ["工作区割台模型已接入当前场景，正在等待渲染器完成几何体体检。"],
      motion: createMotionCapabilitiesFromDefinitions(preset.motionTracks),
    } }));
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
    setVisualPresetId("custom");
    setAssetManifest((previous) => ({
      ...previous,
      background: { fileName: file.name, format },
    }));
    updateVisualScene((previous) => ({
      ...previous,
      environment: { ...previous.environment, files: objectUrl },
    }));
    setMessage(`${file.name} 已作为环境背景替换。`);
  };

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    setBackgroundPreset(nextTheme);
    updateVisualScene((previous) => createHarvesterThemeScene(previous, nextTheme));
    setMessage(`已切换到“${THEME_LABELS[nextTheme]}”视觉主题。`);
  };

  const handleBackgroundPreset = (preset) => {
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
    backgroundUrlRef.current = null;
    setBackgroundPreset(preset.id);
    setVisualPresetId("custom");
    setAssetManifest((previous) => ({ ...previous, background: null }));
    updateVisualScene((previous) => ({
      ...previous,
      environment: { ...previous.environment, files: preset.files },
    }));
    setMessage(`已选择“${preset.label}”作为环境背景。`);
  };

  const selectModelSlot = (modelId) => {
    if (modelId === selectedModelId) return;
    setSelectedModelId(modelId);
    setSelectedNodeIds({});
    resetPreviewForModel();
    const model = scene.models.find((entry) => entry.id === modelId);
    setMessage(`已选中模型槽位“${model?.label || modelId}”，后续加载会替换该槽位。`);
  };

  const addModelSlot = () => {
    const existingIds = new Set(scene.models.map((model) => model.id));
    let index = scene.models.length + 1;
    let id = `model-${index}`;
    while (existingIds.has(id)) {
      index += 1;
      id = `model-${index}`;
    }
    const nextModel = {
      id,
      assetId: id,
      label: `模型槽位 ${index}`,
      url: DEMO_MODEL_URL,
      position: [scene.models.length * 1.8, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      visible: true,
      variantTarget: false,
      parentId: null,
      assemblyId: null,
      assetFormat: "glb",
      assetSource: "demo",
    };
    updateScene((previous) => ({ ...previous, models: [...previous.models, nextModel] }));
    setSelectedModelId(id);
    setMessage(`已新增“${nextModel.label}”，请选择文件加载到该槽位。`);
  };

  const removeModelSlot = (modelId) => {
    if (scene.models.length <= 1) {
      setMessage("至少保留一个模型槽位。可先新增槽位，再移除当前模型。");
      return;
    }
    const remaining = scene.models.filter((model) => model.id !== modelId);
    const nextSelectedId = selectedModelId === modelId ? remaining[0].id : selectedModelId;
    releaseModelUrl(modelId);
    updateScene((previous) => ({
      ...previous,
      models: previous.models
        .filter((model) => model.id !== modelId)
        .map((model) => model.parentId === modelId
          ? { ...model, parentId: null, assemblyId: null }
          : model),
    }));
    setReports((previous) => {
      const next = { ...previous };
      delete next[modelId];
      return next;
    });
    setModelHierarchies((previous) => {
      const next = { ...previous };
      delete next[modelId];
      return next;
    });
    setModelSockets((previous) => {
      const next = { ...previous };
      delete next[modelId];
      return next;
    });
    setSelectedNodeIds((previous) => {
      const next = { ...previous };
      delete next[modelId];
      return next;
    });
    setAssetManifest((previous) => {
      const models = { ...(previous.models || {}) };
      delete models[modelId];
      return {
        ...previous,
        model: models[nextSelectedId] || null,
        models,
      };
    });
    setSelectedModelId(nextSelectedId);
    resetPreviewForModel();
    setMessage("已移除模型槽位。导出场景时将不再包含该模型。");
  };

  const toggleModelSlotVisibility = (modelId) => {
    updateScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => model.id === modelId
        ? { ...model, visible: model.visible === false }
        : model),
    }));
  };

  const setModelParent = (modelId, parentId) => {
    if (modelId === parentId) {
      setMessage("模型不能将自己设置为父模型。");
      return;
    }
    const modelsById = new Map(sceneRef.current.models.map((model) => [model.id, model]));
    let cursor = parentId;
    while (cursor) {
      if (cursor === modelId) {
        setMessage("不能将当前模型挂到自己的子模型下。");
        return;
      }
      cursor = modelsById.get(cursor)?.parentId || null;
    }
    const parent = parentId ? modelsById.get(parentId) : null;
    const assemblyId = parentId ? (parent?.assemblyId || parent?.id || null) : null;
    updateScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => model.id === modelId
        ? { ...model, parentId: parentId || null, assemblyId }
        : model),
    }));
    setMessage(parentId ? "已建立模型父子装配关系。" : "已解除当前模型的父级关系。");
  };

  const applyAssemblyPreset = (entry) => {
    if (!entry?.models?.length) {
      setMessage("该装配方案没有有效的部件配置，无法应用。");
      return;
    }
    const currentModels = sceneRef.current.models;
    const usedCurrentIds = new Set();
    const targetIds = new Map();
    const findMatch = (snapshot) => {
      const exact = currentModels.find((model) => model.id === snapshot.id && !usedCurrentIds.has(model.id));
      if (exact) return exact;
      const byAssetId = currentModels.find((model) =>
        (model.assetId || model.id) === snapshot.assetId && !usedCurrentIds.has(model.id)
      );
      if (byAssetId) return byAssetId;
      return currentModels.find((model) =>
        (model.label || model.id) === snapshot.label && !usedCurrentIds.has(model.id)
      );
    };

    entry.models.forEach((snapshot) => {
      const target = findMatch(snapshot);
      if (target) {
        usedCurrentIds.add(target.id);
        targetIds.set(snapshot.id, target.id);
      }
    });

    if (targetIds.size === 0) {
      setMessage("当前模型槽位与该装配方案没有可匹配的部件。");
      return;
    }

    updateVisualScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => {
        const snapshot = entry.models.find((item) => targetIds.get(item.id) === model.id);
        if (!snapshot) return model;
        const parentId = snapshot.parentId ? targetIds.get(snapshot.parentId) || null : null;
        const assemblyId = snapshot.assemblyId ? targetIds.get(snapshot.assemblyId) || null : null;
        return {
          ...model,
          parentId,
          assemblyId,
          position: [...(snapshot.position || [0, 0, 0])],
          rotation: [...(snapshot.rotation || [0, 0, 0])],
          scale: snapshot.scale ?? 1,
          visible: snapshot.visible !== false,
        };
      }),
    }));
    setSelectedNodeIds({});
    setMessage(`已应用装配方案“${entry.name}”，匹配 ${targetIds.size}/${entry.models.length} 个部件。`);
  };

  const alignModelSockets = (request) => {
    const transform = sceneApiRef.current?.alignSocket?.(request);
    if (!transform) {
      setMessage("当前模型尚未完成加载，或找不到对应挂载点。");
      return;
    }
    updateVisualScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => model.id === request.childId
        ? { ...model, ...transform, autoFrame: false }
        : model),
    }));
    setMessage("已按挂载点自动对齐当前部件，并关闭自动落地偏移。");
  };

  const updateActiveNodeVisibility = (nodeId, nextHidden) => {
    updateVisualScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => model.id === activeModel?.id
        ? {
          ...model,
          nodeVisibility: {
            ...(model.nodeVisibility || {}),
            [nodeId]: !nextHidden,
          },
        }
        : model),
    }));
    setMessage(nextHidden ? "已隐藏当前节点。" : "已显示当前节点。");
  };

  const selectModelNode = (modelId, nodeId, { multi = false } = {}) => {
    setSelectedModelId(modelId);
    setSelectedNodeIds((previous) => {
      const current = previous[modelId] || [];
      const next = multi
        ? current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        : [nodeId];
      return multi ? { ...previous, [modelId]: next } : { [modelId]: next };
    });
    const node = modelHierarchies[modelId]?.find((item) => item.id === nodeId);
    setMessage(`${multi ? "已更新多选" : "已选择"}节点“${node?.name || nodeId}”。`);
  };

  const isolateActiveNode = (nodeId) => {
    const nodes = modelHierarchies[activeModel?.id] || [];
    const nextVisibility = Object.fromEntries(nodes.map((node) => [
      node.id,
      node.id === nodeId
        || node.id.startsWith(`${nodeId}/`)
        || nodeId.startsWith(`${node.id}/`),
    ]));
    updateVisualScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => model.id === activeModel?.id
        ? { ...model, nodeVisibility: nextVisibility }
        : model),
    }));
    setMessage("已隔离当前节点及其父子链。点击“恢复全部节点”可撤销。");
  };

  const resetActiveNodeVisibility = () => {
    updateVisualScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => model.id === activeModel?.id
        ? { ...model, nodeVisibility: undefined }
        : model),
    }));
    setMessage("已恢复当前模型的全部节点显示。");
  };

  const applyActiveNodeTransformDelta = (delta) => {
    const modelId = activeModel?.id;
    const selected = selectedNodeIds[modelId] || [];
    if (!modelId || selected.length === 0) return;
    updateVisualScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => {
        if (model.id !== modelId) return model;
        const nextDeltas = { ...(model.nodeTransformDeltas || {}) };
        selected.forEach((nodeId) => {
          const current = nextDeltas[nodeId] || {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: 1,
          };
          nextDeltas[nodeId] = {
            position: [0, 1, 2].map((index) =>
              (current.position?.[index] || 0) + (delta.position?.[index] || 0)),
            rotation: [0, 1, 2].map((index) =>
              (current.rotation?.[index] || 0) + (delta.rotation?.[index] || 0)),
            scale: Math.max(0.01, (current.scale ?? 1) * (delta.scale ?? 1)),
          };
        });
        return { ...model, nodeTransformDeltas: nextDeltas };
      }),
    }));
    setMessage(`已对 ${selected.length} 个节点应用批量变换。`);
  };

  const resetActiveNodeTransforms = () => {
    const modelId = activeModel?.id;
    const selected = selectedNodeIds[modelId] || [];
    if (!modelId || selected.length === 0) return;
    updateVisualScene((previous) => ({
      ...previous,
      models: previous.models.map((model) => {
        if (model.id !== modelId) return model;
        const nextDeltas = { ...(model.nodeTransformDeltas || {}) };
        selected.forEach((nodeId) => delete nextDeltas[nodeId]);
        return {
          ...model,
          nodeTransformDeltas: Object.keys(nextDeltas).length > 0 ? nextDeltas : undefined,
        };
      }),
    }));
    setMessage(`已恢复 ${selected.length} 个选中节点的局部变换。`);
  };

  const resetModel = () => {
    releaseModelUrl(selectedModelId);
    resetPreviewForModel();
    updateScene((previous) => {
      const models = previous.models.map((model) => model.id === selectedModelId
        ? {
          ...model,
          url: DEMO_MODEL_URL,
          label: "示例模型（可替换）",
          assetFormat: "glb",
          assetSource: "demo",
          autoFrame: false,
          nodeVisibility: undefined,
          nodeTransformDeltas: undefined,
          motionTracks: undefined,
        }
        : model);
      return setKnifeView({ ...previous, models }, models.some((model) => model.motionTracks?.length > 0));
    });
    setAssetManifest((previous) => {
      const models = { ...(previous.models || {}) };
      delete models[selectedModelId];
      return {
        ...previous,
        model: Object.values(models)[0] || null,
        models,
      };
    });
    setReports((previous) => {
      const next = { ...previous };
      delete next[selectedModelId];
      return next;
    });
    setModelHierarchies((previous) => {
      const next = { ...previous };
      delete next[selectedModelId];
      return next;
    });
    setModelSockets((previous) => {
      const next = { ...previous };
      delete next[selectedModelId];
      return next;
    });
    setSelectedNodeIds((previous) => {
      const next = { ...previous };
      delete next[selectedModelId];
      return next;
    });
    setMessage(`已将当前槽位“${activeModel?.label || selectedModelId}”恢复为示例模型。`);
  };

  return (
    <div className="asset-workbench">
      <SceneViewer
        scene={scene}
        onRuntimeReady={handleRuntimeReady}
        onModelInspect={handleModelInspect}
        onPerformance={setPerformance}
        onCaptureReady={handleCaptureReady}
        onSceneApiReady={handleSceneApiReady}
        selectedNodeIds={selectedNodeIds}
        onNodeSelect={selectModelNode}
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
            <button type="button" className="asset-secondary-button" disabled={busy} onClick={captureScene}>
              导出当前画面
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
          <div className="asset-action-subgroup">
            <span className="asset-tuning-label">本地视觉方案</span>
            <div className="asset-action-grid">
              <button type="button" className="asset-secondary-button" onClick={saveLocalScene}>
                保存方案
              </button>
              <button type="button" className="asset-secondary-button" disabled={!localSceneSavedAt} onClick={restoreLocalScene}>
                恢复方案
              </button>
              <button type="button" className="asset-secondary-button" disabled={!localSceneSavedAt} onClick={clearLocalScene}>
                清除方案
              </button>
            </div>
            <p className="asset-workbench-hint">
              {localSceneSavedAt
                ? `最近保存：${new Date(localSceneSavedAt).toLocaleString("zh-CN")}`
                : "尚未保存本地方案；模型文件本身仍需单独保留。"}
            </p>
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

        <ScenePerformancePanel
          stats={performance}
          scene={scene}
          onOptimize={optimizePerformance}
          onRestoreQuality={restoreQuality}
          onAutoOptimize={autoOptimizeScene}
        />

        <section className="asset-model-slots">
          <h3>模型资产管理</h3>
          <p className="asset-workbench-hint">先选择模型槽位，再加载或替换文件；支持单模型、多模型和不同格式混合。</p>
          <div className="asset-model-slot-list">
            {scene.models.map((model) => {
              const format = model.assetFormat || model.url?.split(".").pop() || "model";
              const isSelected = model.id === selectedModelId;
              return (
                <div key={model.id} className={`asset-model-slot ${isSelected ? "is-selected" : ""}`}>
                  <button
                    type="button"
                    className="asset-model-slot-select"
                    onClick={() => selectModelSlot(model.id)}
                  >
                    <strong>{model.label || model.id}</strong>
                    <small>{format.toUpperCase()} · {model.visible === false ? "已隐藏" : "可见"}{isSelected ? " · 当前" : ""}</small>
                  </button>
                  <div className="asset-model-slot-actions">
                    <button
                      type="button"
                      title={model.visible === false ? "显示模型" : "隐藏模型"}
                      aria-label={`${model.visible === false ? "显示" : "隐藏"}${model.label || model.id}`}
                      onClick={() => toggleModelSlotVisibility(model.id)}
                    >
                      {model.visible === false ? "显示" : "隐藏"}
                    </button>
                    <button
                      type="button"
                      title="移除模型槽位"
                      aria-label={`移除${model.label || model.id}`}
                      disabled={scene.models.length <= 1}
                      onClick={() => removeModelSlot(model.id)}
                    >
                      移除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" className="asset-secondary-button" onClick={addModelSlot} disabled={busy}>
            ＋ 新增模型槽位
          </button>
        </section>

        <ModelAssemblyPanel
          models={scene.models}
          selectedModelId={selectedModelId}
          modelSockets={modelSockets}
          onSelectModel={selectModelSlot}
          onParentChange={setModelParent}
          onAlignSockets={alignModelSockets}
        />

        <AssemblyPresetPanel
          models={scene.models}
          onApply={applyAssemblyPreset}
          onMessage={setMessage}
        />

        <ModelTransformPanel
          model={activeModel}
          onUpdate={updateActiveModelTransform}
          onReset={resetActiveModelTransform}
        />

        <ModelHierarchyPanel
          model={activeModel}
          nodes={modelHierarchies[activeModel?.id] || report?.nodeHierarchy || []}
          selectedNodeIds={selectedNodeIds[activeModel?.id] || []}
          onSelectNode={(nodeId, options) => selectModelNode(activeModel.id, nodeId, options)}
          onToggleVisibility={updateActiveNodeVisibility}
          onIsolate={isolateActiveNode}
          onReset={resetActiveNodeVisibility}
        />

        <ModelNodeTransformPanel
          selectedCount={selectedNodeIds[activeModel?.id]?.length || 0}
          onApplyDelta={applyActiveNodeTransformDelta}
          onReset={resetActiveNodeTransforms}
        />

        <section>
          <h3>文件预处理与加载</h3>
          <p className="asset-workbench-hint">当前加载目标：{activeModel?.label || "未选择模型槽位"}。先按格式选择入口，再检查网格、材质、动画和可预览性。</p>
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
          <input
            ref={batchModelInputRef}
            type="file"
            accept=".glb,.gltf"
            multiple
            hidden
            onChange={(event) => {
              handleBatchModelFiles(event.target.files);
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
          <button
            type="button"
            className="asset-secondary-button"
            disabled={busy}
            onClick={() => batchModelInputRef.current?.click()}
          >
            批量选择 GLB / GLTF
          </button>
          <div className="asset-local-model-list">
            {LOCAL_MODEL_PRESETS.map((preset) => (
              <button key={preset.id} className="asset-local-model-button" disabled={busy} onClick={() => loadLocalModel(preset)}>
                <strong>{preset.label}</strong>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>
          <BatchModelLoadPanel
            items={batchQueue}
            busy={busy}
            onClear={() => setBatchQueue([])}
          />
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

        {report?.materialNames?.length > 0 && (
          <MaterialOverridePanel
            materials={report.materialNames}
            overrides={activeModel?.materialOverrides || []}
            onChange={setMaterialOverrides}
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

        <VisualPresetPanel
          presets={VISUAL_PRESETS}
          activePresetId={visualPresetId}
          onApply={applyVisualPreset}
        />

        <VisualPresetLibraryPanel
          entries={visualLibrary}
          onSave={saveVisualLibraryPreset}
          onApply={applyVisualLibraryPreset}
          onDelete={deleteVisualLibraryPreset}
          onExport={exportVisualLibrary}
          onImport={importVisualLibrary}
        />

        <CameraPresetPanel
          shots={scene.shots}
          selectedShotId={cameraShotId}
          onSelect={selectCameraShot}
          onUpdate={updateCameraShot}
          onAdd={addCameraShot}
          onRemove={removeCameraShot}
        />

        <RenderTuningPanel scene={scene} onChange={updateVisualScene} />

        <button className="asset-export-button" onClick={exportScene}>
          导出当前场景配置
        </button>
        <div className="asset-workbench-message">{message}</div>
      </aside>
    </div>
  );
}

