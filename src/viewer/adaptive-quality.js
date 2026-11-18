export const QUALITY_TIER_LABELS = Object.freeze({
  high: "高质量",
  balanced: "平衡优化",
  performance: "性能优先",
});

export function nextQualityTier(currentTier, stats, counters = { down: 0, up: 0 }) {
  const fps = Number.isFinite(stats?.fps) ? stats.fps : 60;
  const triangles = Number.isFinite(stats?.triangles) ? stats.triangles : 0;
  const calls = Number.isFinite(stats?.calls) ? stats.calls : 0;
  const textures = Number.isFinite(stats?.textures) ? stats.textures : 0;
  const severe = fps < 30 || triangles > 12000000 || calls > 1800 || textures > 600;
  const heavy = fps < 45 || triangles > 5000000 || calls > 800 || textures > 250;
  const smooth = fps >= 52 && triangles < 4500000 && calls < 700 && textures < 220;
  let nextTier = currentTier;
  let down = counters.down || 0;
  let up = counters.up || 0;

  if (severe) {
    down += 1;
    up = 0;
    if (down >= 2) nextTier = currentTier === "high" ? "balanced" : "performance";
  } else if (heavy) {
    down += 1;
    up = 0;
    if (down >= 3 && currentTier === "high") nextTier = "balanced";
  } else if (smooth) {
    up += 1;
    down = 0;
    if (up >= 6) nextTier = currentTier === "performance" ? "balanced" : "high";
  } else {
    down = 0;
    up = 0;
  }

  return { tier: nextTier, counters: { down, up } };
}

export function applyQualityTier(scene, tier) {
  if (!scene || tier === "high") return scene;
  const originalDpr = scene.renderer?.dpr || [1, 1.5];
  const dpr = tier === "performance"
    ? [0.75, 0.9]
    : [0.9, Math.min(originalDpr[1] || 1.1, 1.1)];
  const baseEffects = scene.effects || {};
  const baseParticles = scene.particles || {};
  const performanceEffects = {
    ...baseEffects,
    enabled: tier !== "performance",
    multisampling: 0,
    bloom: { ...baseEffects.bloom, enabled: false },
    noise: { ...baseEffects.noise, enabled: false, opacity: 0 },
    vignette: tier === "performance" ? { ...baseEffects.vignette, enabled: false } : baseEffects.vignette,
  };
  const baseEnvironment = scene.environment || {};
  const performanceEnvironment = {
    ...baseEnvironment,
    contactShadow: false,
  };

  return {
    ...scene,
    renderer: {
      ...scene.renderer,
      dpr,
      shadows: false,
    },
    environment: performanceEnvironment,
    effects: performanceEffects,
    particles: { ...baseParticles, enabled: false, count: 0 },
  };
}
