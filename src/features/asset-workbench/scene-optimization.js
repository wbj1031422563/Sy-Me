function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function getOptimizationAdvice(stats, scene = {}) {
  const advice = [];
  const models = Array.isArray(scene.models) ? scene.models : [];
  const visibleModels = models.filter((model) => model.visible !== false).length;

  if (!stats) {
    return ["正在采集实时数据，完成后会给出针对当前场景的建议。"];
  }
  if (stats.fps < 30) {
    advice.push("帧率偏低：建议关闭阴影、后期和粒子，并将 DPR 降到 1.0。");
  } else if (stats.fps < 45) {
    advice.push("帧率低于 45：建议降低 DPR，优先关闭高成本后期效果。");
  }
  if (stats.triangles > 5000000) {
    advice.push("三角面较高：建议在 Blender 中减面，并准备 Draco 压缩版本。");
  }
  if (stats.calls > 800) {
    advice.push("Draw Call 较高：建议合并材质槽，减少透明材质与重复灯光。");
  }
  if (stats.textures > 250) {
    advice.push("纹理数量较多：建议整理贴图，优先使用 1K/2K 纹理并清理重复资源。");
  }
  if (visibleModels > 3) {
    advice.push("当前可见模型较多：建议隐藏暂时不用的模型，或按展示镜头拆分场景。");
  }
  return advice.length > 0
    ? advice
    : ["当前场景负载正常，可以继续调整视觉质量和效果。"];
}

export function getOptimizationPlan(stats, scene = {}) {
  const fps = finite(stats?.fps, 60);
  const triangles = finite(stats?.triangles);
  const calls = finite(stats?.calls);
  const textures = finite(stats?.textures);
  const visibleModels = (scene.models || []).filter((model) => model.visible !== false).length;
  const severe = fps < 30 || triangles > 12000000 || calls > 1800 || textures > 600;
  const heavy = fps < 45 || triangles > 5000000 || calls > 800 || textures > 250 || visibleModels > 3;

  if (severe) {
    return {
      id: "aggressive",
      label: "激进优化",
      description: "关闭高成本效果并降低 DPR，优先恢复交互流畅度。",
      changes: {
        renderer: { dpr: [1, 1], shadows: false },
        effects: {
          enabled: false,
          multisampling: 0,
          bloom: { enabled: false },
          vignette: { enabled: false },
          noise: { enabled: false },
        },
        particles: { enabled: false, count: 0 },
      },
    };
  }
  if (heavy) {
    return {
      id: "balanced",
      label: "平衡优化",
      description: "保留基础视觉效果，降低 DPR、阴影和粒子开销。",
      changes: {
        renderer: { dpr: [1, 1.25], shadows: false },
        effects: {
          enabled: true,
          multisampling: 0,
          bloom: { enabled: true, intensity: 0.55 },
          vignette: { enabled: true },
          noise: { enabled: false, opacity: 0 },
        },
        particles: { enabled: true, count: 60 },
      },
    };
  }
  return {
    id: "none",
    label: "无需优化",
    description: "当前场景负载在建议范围内，可以保持高质量渲染。",
    changes: {},
  };
}

export function applyOptimizationPlan(scene, plan) {
  if (!plan?.changes || plan.id === "none") return scene;
  const effects = plan.changes.effects || {};
  return {
    ...scene,
    renderer: { ...scene.renderer, ...plan.changes.renderer },
    effects: {
      ...scene.effects,
      ...effects,
      bloom: { ...scene.effects?.bloom, ...effects.bloom },
      vignette: { ...scene.effects?.vignette, ...effects.vignette },
      noise: { ...scene.effects?.noise, ...effects.noise },
    },
    particles: { ...scene.particles, ...plan.changes.particles },
  };
}
