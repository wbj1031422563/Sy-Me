import { useEffect, useRef } from "react";
import { inspectAssetFile } from "./asset-inspector.js";
import { createMotionCapabilitiesFromDefinitions } from "./motion-analysis.js";
import {
  HARVESTER_ASSEMBLY_GROUND_OFFSET,
} from "../../scenes/presets/harvester-parts.js";
import { VISUAL_LIMITS } from "../../core/scene/scene-visual-limits.js";

export default function useModelLoader({
  selectedModelId,
  sceneRef,
  updateScene,
  setBusy,
  setReports,
  setAssetManifest,
  setSelectedModelId,
  setSelectedNodeIds,
  setBatchQueue,
  setMessage,
  resetPreviewForModel,
  setKnifeView,
  localModelPresets,
  workspaceMotion,
}) {
  const modelUrlsRef = useRef(new Map());
  const mountedRef = useRef(true);
  const loadRequestRef = useRef(0);

  const beginLoadRequest = () => {
    loadRequestRef.current += 1;
    return loadRequestRef.current;
  };

  const isCurrentLoadRequest = (requestId) =>
    mountedRef.current && loadRequestRef.current === requestId;

  const releaseModelUrl = (modelId) => {
    const url = modelUrlsRef.current.get(modelId);
    if (url) URL.revokeObjectURL(url);
    modelUrlsRef.current.delete(modelId);
  };

  const releaseAllModelUrls = () => {
    modelUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    modelUrlsRef.current.clear();
  };

  const cancelModelLoads = () => {
    loadRequestRef.current += 1;
  };

  useEffect(() => {
    mountedRef.current = true;
    const modelUrls = modelUrlsRef.current;
    return () => {
      mountedRef.current = false;
      loadRequestRef.current += 1;
      modelUrls.forEach((url) => URL.revokeObjectURL(url));
      modelUrls.clear();
    };
  }, []);

  const loadModelAsset = async (file, targetModelId = selectedModelId, preloadedReport = null, stagedObjectUrl = null) => {
    if (!file) return;
    const requestId = beginLoadRequest();
    const modelId = targetModelId || selectedModelId;
    let objectUrl = stagedObjectUrl;
    setBusy(true);
    try {
      const nextReport = preloadedReport || await inspectAssetFile(file);
      if (!isCurrentLoadRequest(requestId)) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return;
      }
      setReports((previous) => ({ ...previous, [modelId]: nextReport }));

      if (!nextReport.previewSupported) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setMessage(`${file.name} 已完成格式检查，但当前建议先转换为 GLB。`);
        return;
      }

      releaseModelUrl(modelId);
      objectUrl ||= URL.createObjectURL(file);
      modelUrlsRef.current.set(modelId, objectUrl);
      const matchingPreset = localModelPresets.find((preset) =>
        preset.fileName.toLowerCase() === file.name.toLowerCase()
        && preset.motionTracks?.every((track) => nextReport.nodeNames.includes(track.node))
      );
      resetPreviewForModel();
      updateScene((previous) => ({
        ...setKnifeView(previous, Boolean(matchingPreset)),
        title: "收获机视觉工作台",
        models: previous.models.map((model, index) =>
          (model.id === modelId || (!modelId && index === 0))
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
      setSelectedNodeIds((previous) => {
        const next = { ...previous };
        delete next[modelId];
        return next;
      });
      const modelManifest = {
        fileName: file.name,
        format: nextReport.format,
        slotId: modelId,
        source: "local",
      };
      setAssetManifest((previous) => ({
        ...previous,
        model: modelManifest,
        models: { ...(previous.models || {}), [modelId]: modelManifest },
      }));
      setMessage(`${file.name} 已检查并替换到当前场景 · ${nextReport.performanceLabel || "待评估"}。`);
    } catch (error) {
      if (objectUrl && modelUrlsRef.current.get(modelId) === objectUrl) releaseModelUrl(modelId);
      if (isCurrentLoadRequest(requestId)) setMessage(`模型加载失败：${error.message}`);
    } finally {
      if (isCurrentLoadRequest(requestId)) setBusy(false);
    }
  };

  const handleModelFile = (file, targetModelId = selectedModelId) =>
    loadModelAsset(file, targetModelId);

  const handleStagedModelAsset = (session, targetModelId = selectedModelId) =>
    loadModelAsset(session?.file, targetModelId, session?.report, session?.objectUrl);

  /**
   * 批量加载本地模型。
   * @param {FileList|File[]} fileList
   * @param {{ layout?: 'assemble'|'sideBySide' }} [options]
   *   assemble（默认）：identity + autoFrame=false，按 GLB 内嵌 CAD 坐标自动拼装
   *   sideBySide：沿 X 轴展开，便于无关模型对比
   */
  const handleBatchModelFiles = async (fileList, { layout = "assemble" } = {}) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const requestId = beginLoadRequest();
    const assembleInPlace = layout !== "sideBySide";
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
    const batchAssemblyId = assembleInPlace ? `batch-assembly-${Date.now()}` : null;

    const updateQueueItem = (id, patch) => {
      if (!isCurrentLoadRequest(requestId)) return;
      setBatchQueue((previous) => previous.map((item) => item.id === id ? { ...item, ...patch } : item));
    };

    const releaseLoadedModels = () => {
      loadedModels.forEach((model) => {
        if (modelUrlsRef.current.get(model.id) === model.url) releaseModelUrl(model.id);
      });
    };

    try {
      for (const [index, file] of files.entries()) {
        if (!isCurrentLoadRequest(requestId)) {
          releaseLoadedModels();
          return;
        }
        const queueItem = queueItems[index];
        updateQueueItem(queueItem.id, { status: "processing", message: "读取模型元数据" });
        try {
          const nextReport = await inspectAssetFile(file);
          if (!isCurrentLoadRequest(requestId)) {
            releaseLoadedModels();
            return;
          }
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
          if (!isCurrentLoadRequest(requestId)) {
            URL.revokeObjectURL(objectUrl);
            releaseLoadedModels();
            return;
          }
          modelUrlsRef.current.set(modelId, objectUrl);
          const model = {
            id: modelId,
            assetId: modelId,
            label: file.name.replace(/\.(glb|gltf)$/i, ""),
            url: objectUrl,
            // 装配：CAD 重合，由 SceneViewer 自适应贴地；并排：沿 X 展开
            position: assembleInPlace
              ? [0, 0, 0]
              : [loadedModels.length * 2.2, 0, 0],
            rotation: [0, 0, 0],
            scale: 1,
            visible: true,
            variantTarget: false,
            parentId: null,
            assemblyId: batchAssemblyId,
            assetFormat: nextReport.format,
            assetSource: "local",
            // 装配必须关闭：逐件 autoFrame 会把分件独立挪到原点，破坏 CAD 重合
            autoFrame: !assembleInPlace,
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
          updateQueueItem(queueItem.id, {
            status: "loaded",
            message: assembleInPlace
              ? `${nextReport.performanceLabel || "已完成体检"} · 按原坐标装配`
              : `${nextReport.performanceLabel || "已完成体检"} · 已创建模型槽位`,
          });
        } catch (error) {
          updateQueueItem(queueItem.id, { status: "failed", message: error.message });
        }
      }

      if (loadedModels.length > 0) {
        if (!isCurrentLoadRequest(requestId)) {
          releaseLoadedModels();
          return;
        }
        updateScene((previous) => ({
          ...previous,
          models: [...previous.models, ...loadedModels],
          ...(assembleInPlace
            ? {
              assemblyMeta: {
                ...(previous.assemblyMeta || {}),
                transformSource: "embedded-glb-world",
                adaptiveGround: true,
                groundY: 0,
                groundOffset: previous.assemblyMeta?.groundOffset
                  || [...HARVESTER_ASSEMBLY_GROUND_OFFSET],
                partCount: (previous.models?.length || 0) + loadedModels.length,
                note: "Workbench batch assemble: runtime adaptive ground from wheel bottoms.",
              },
              controls: {
                ...(previous.controls || {}),
                minDistance: Math.min(previous.controls?.minDistance ?? 6, 6),
                maxDistance: Math.max(previous.controls?.maxDistance ?? 80, 80),
              },
              camera: {
                ...(previous.camera || {}),
                far: Math.max(previous.camera?.far ?? 400, VISUAL_LIMITS.camera.far.min),
              },
            }
            : {}),
        }));
        setReports((previous) => ({ ...previous, ...loadedReports }));
        setAssetManifest((previous) => ({
          ...previous,
          model: loadedManifests[loadedModels[loadedModels.length - 1].id] || previous.model,
          models: { ...(previous.models || {}), ...loadedManifests },
        }));
        setSelectedModelId(loadedModels[loadedModels.length - 1].id);
        setSelectedNodeIds({});
        setMessage(
          assembleInPlace
            ? `批量加载完成：已按原坐标自动装配 ${loadedModels.length} 个模型，轮底自适应贴地。`
            : `批量加载完成：已并排放入 ${loadedModels.length} 个模型槽位。`
        );
      } else {
        setMessage("批量预处理完成，但没有可直接预览的模型。");
      }
    } finally {
      if (isCurrentLoadRequest(requestId)) setBusy(false);
    }
  };

  const loadLocalModel = async (preset) => {
    const requestId = beginLoadRequest();
    const modelId = selectedModelId;
    setBusy(true);
    try {
      const response = await fetch(preset.url, { method: "HEAD" });
      if (!isCurrentLoadRequest(requestId)) return;
      if (!response.ok || response.headers.get("content-type")?.includes("text/html")) {
        setMessage(`项目里没有 ${preset.fileName}。点击「GLB」选择本地文件，或将它放入 public/model/。`);
        return;
      }
      releaseModelUrl(modelId);
      resetPreviewForModel();
      updateScene((previous) => ({
        ...setKnifeView(previous, Boolean(preset.motionTracks?.length)),
        models: previous.models.map((model, index) =>
          (model.id === modelId || (!modelId && index === 0))
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
      setSelectedNodeIds((previous) => {
        const next = { ...previous };
        delete next[modelId];
        return next;
      });
      const modelManifest = {
        fileName: preset.fileName,
        format: "glb",
        slotId: modelId,
        source: "workspace",
      };
      setAssetManifest((previous) => ({
        ...previous,
        model: modelManifest,
        models: { ...(previous.models || {}), [modelId]: modelManifest },
      }));
      setReports((previous) => ({ ...previous, [modelId]: {
        fileName: preset.fileName,
        format: "glb",
        size: "637.25 MB",
        previewSupported: true,
        meshes: 113,
        materials: 37,
        nodes: 121,
        nodeNames: workspaceMotion.map((track) => track.node),
        materialNames: [],
        animations: 0,
        clipNames: [],
        vertices: null,
        faces: null,
        notes: ["工作区割台模型已接入当前场景，正在等待渲染器完成几何体体检。"],
        motion: createMotionCapabilitiesFromDefinitions(preset.motionTracks),
      } }));
      setMessage(`${preset.fileName} 已加载到当前场景。`);
    } catch (error) {
      if (isCurrentLoadRequest(requestId)) {
        setMessage(`未能访问 ${preset.fileName}：${error.message}`);
      }
      return;
    } finally {
      if (isCurrentLoadRequest(requestId)) setBusy(false);
    }
  };

  return {
    handleModelFile,
    handleStagedModelAsset,
    handleBatchModelFiles,
    loadLocalModel,
    releaseModelUrl,
    releaseAllModelUrls,
    cancelModelLoads,
  };
}
