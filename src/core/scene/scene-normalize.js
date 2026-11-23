/**
 * 将外部场景描述收敛成运行时使用的稳定结构。
 *
 * 这里不负责加载资源，也不负责渲染。它的作用是让 JSON、接口数据和
 * 后续编辑器生成的数据都能以同一种形态进入 SceneRuntime。
 */
import { normalizeModelCollection } from "./scene-safety.js";
import {
  CURRENT_SCENE_SCHEMA_VERSION,
  migrateSceneDocument,
} from "./scene-schema.js";
import {
  clampCameraConfig,
  clampEnvironment,
  clampGround,
  clampModelTransform,
  clampRenderer,
  clampShot,
} from "./scene-visual-limits.js";

export function normalizeScene(input = {}) {
  const { scene: migratedScene } = migrateSceneDocument(input);
  const source = migratedScene || {};
  const rawModels = Array.isArray(source.models) ? source.models : [];
  const rawVariants = Array.isArray(source.materialVariants)
    ? source.materialVariants
    : [];

  return {
    ...source,
    version: CURRENT_SCENE_SCHEMA_VERSION,
    schemaVersion: CURRENT_SCENE_SCHEMA_VERSION,
    schema: source.schema,
    id: source.id || "scene",
    title: source.title || "未命名场景",
    models: normalizeModelCollection(rawModels).map((model, index) => ({
      ...clampModelTransform(model),
      nodeTransformDeltas: model.nodeTransformDeltas || undefined,
      // 没有显式指定时，保持旧版“第一个模型作为变体目标”的行为。
      variantTarget: model.variantTarget ?? index === 0,
    })),
    environment: clampEnvironment({
      ...(source.environment || {}),
      background: source.environment?.background || "#05060a",
      ambientIntensity: source.environment?.ambientIntensity ?? 0.3,
    }),
    camera: clampCameraConfig({
      ...(source.camera || {}),
      fov: source.camera?.fov ?? 40,
      near: source.camera?.near ?? 0.1,
      far: source.camera?.far ?? 200,
    }),
    renderer: clampRenderer({
      ...(source.renderer || {}),
      dpr: source.renderer?.dpr || [1, 1.25],
      antialias: source.renderer?.antialias ?? false,
      toneMapping: source.renderer?.toneMapping || "None",
      exposure: source.renderer?.exposure ?? 1,
      shadows: source.renderer?.shadows ?? true,
    }),
    colorGrade: {
      enabled: source.colorGrade?.enabled ?? true,
      hue: source.colorGrade?.hue ?? 0,
      saturation: source.colorGrade?.saturation ?? 0,
      brightness: source.colorGrade?.brightness ?? 0,
      contrast: source.colorGrade?.contrast ?? 0,
      rgbGain: source.colorGrade?.rgbGain || [1, 1, 1],
      rgbLift: source.colorGrade?.rgbLift || [0, 0, 0],
      rgbGamma: source.colorGrade?.rgbGamma || [1, 1, 1],
    },
    particles: {
      enabled: source.particles?.enabled ?? false,
      preset: source.particles?.preset || "dust",
      count: source.particles?.count ?? 90,
      size: source.particles?.size ?? 1.1,
      speed: source.particles?.speed ?? 0.18,
      opacity: source.particles?.opacity ?? 0.28,
      color: source.particles?.color || "#d8ba7a",
      scale: source.particles?.scale || [18, 5, 12],
      position: source.particles?.position || [0, 1.5, 0],
      noise: source.particles?.noise ?? 1,
    },
    controls: {
      ...(source.controls || {}),
      autoRotate: source.controls?.autoRotate ?? false,
    },
    ground: source.ground ? clampGround(source.ground) : source.ground,
    shots: Array.isArray(source.shots) ? source.shots.map((shot) => clampShot(shot)) : [],
    hotspots: Array.isArray(source.hotspots) ? source.hotspots : [],
    tour: source.tour
      ? {
        enabled: source.tour.enabled !== false,
        loop: source.tour.loop !== false,
        intervalMs: Math.min(12000, Math.max(1200, source.tour.intervalMs ?? 3800)),
        autoStart: Boolean(source.tour.autoStart),
        shotIds: Array.isArray(source.tour.shotIds) ? source.tour.shotIds : [],
      }
      : null,
    materialVariants: rawVariants,
    machine: source.machine
      ? {
        ...source.machine,
        enabled: source.machine.enabled ?? true,
        parts: Array.isArray(source.machine.parts) ? source.machine.parts : [],
      }
      : null,
    extensions: Array.isArray(source.extensions) ? source.extensions : [],
    parameters: {
      ...(source.parameters || {}),
    },
  };
}

/**
 * 明确表达“导出为标准场景文档”的入口，避免调用方直接序列化旧结构。
 */
export function serializeScene(input = {}) {
  return normalizeScene(input);
}

