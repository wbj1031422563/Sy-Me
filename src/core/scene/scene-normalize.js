/**
 * 将外部场景描述收敛成运行时使用的稳定结构。
 *
 * 这里不负责加载资源，也不负责渲染。它的作用是让 JSON、接口数据和
 * 后续编辑器生成的数据都能以同一种形态进入 SceneRuntime。
 */
export function normalizeScene(input = {}) {
  const source = input || {};
  const rawModels = Array.isArray(source.models) ? source.models : [];
  const rawVariants = Array.isArray(source.materialVariants)
    ? source.materialVariants
    : [];

  return {
    ...source,
    version: source.version ?? 1,
    id: source.id || "scene",
    title: source.title || "未命名场景",
    models: rawModels.map((model, index) => ({
      ...model,
      id: model.id || `model-${index + 1}`,
      position: model.position || [0, 0, 0],
      rotation: model.rotation || [0, 0, 0],
      scale: model.scale ?? 1,
      // 没有显式指定时，保持旧版“第一个模型作为变体目标”的行为。
      variantTarget: model.variantTarget ?? index === 0,
    })),
    environment: {
      ...(source.environment || {}),
      background: source.environment?.background || "#05060a",
      ambientIntensity: source.environment?.ambientIntensity ?? 0.3,
    },
    camera: {
      ...(source.camera || {}),
      fov: source.camera?.fov ?? 40,
      near: source.camera?.near ?? 0.1,
      far: source.camera?.far ?? 200,
    },
    renderer: {
      ...(source.renderer || {}),
      dpr: source.renderer?.dpr || [1, 1.5],
      toneMapping: source.renderer?.toneMapping || "None",
      exposure: source.renderer?.exposure ?? 1,
      shadows: source.renderer?.shadows ?? true,
    },
    controls: {
      ...(source.controls || {}),
      autoRotate: source.controls?.autoRotate ?? false,
    },
    shots: Array.isArray(source.shots) ? source.shots : [],
    hotspots: Array.isArray(source.hotspots) ? source.hotspots : [],
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

