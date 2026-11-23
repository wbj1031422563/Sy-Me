/**
 * 场景可视化参数边界与初始化。
 * 用于 normalize / 装配预设 / 展厅皮肤，避免灯光、镜头、偏移越界导致“看不到主体”。
 */

export const VISUAL_LIMITS = Object.freeze({
  position: { min: -200, max: 200 },
  scale: { min: 0.001, max: 100 },
  rotationRad: { min: -Math.PI * 2, max: Math.PI * 2 },
  camera: {
    fov: { min: 18, max: 90 },
    near: { min: 0.01, max: 10 },
    far: { min: 20, max: 2000 },
    distance: { min: 1, max: 250 },
  },
  lightIntensity: { min: 0, max: 40 },
  ambientIntensity: { min: 0, max: 2 },
  exposure: { min: 0.2, max: 3 },
  groundSize: { min: 8, max: 200 },
  groundOffsetY: { min: 0, max: 8 },
  assembly: {
    // 收获机 CAD→Three 后轮子底面约 -1.57；允许微调但不回到地下
    groundLiftY: { min: 0, max: 4, default: 1.57 },
    hallCenterX: { min: -8, max: 12, default: 2.2 },
    hallCenterZ: { min: -8, max: 8, default: -0.3 },
  },
  telemetry: {
    speed: { min: 0, max: 40 },
    fuel: { min: 0, max: 100 },
    grainFill: { min: 0, max: 100 },
    engineHours: { min: 0, max: 99999 },
    headerHeight: { min: 0, max: 100 },
    rotorRpm: { min: 0, max: 1200 },
  },
});

export function clampNumber(value, min, max, fallback = min) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

export function clampVec3(value, limits = VISUAL_LIMITS.position, fallback = [0, 0, 0]) {
  const source = Array.isArray(value) ? value : fallback;
  return [
    clampNumber(source[0], limits.min, limits.max, fallback[0]),
    clampNumber(source[1], limits.min, limits.max, fallback[1]),
    clampNumber(source[2], limits.min, limits.max, fallback[2]),
  ];
}

export function clampScale(value, fallback = 1) {
  return clampNumber(value, VISUAL_LIMITS.scale.min, VISUAL_LIMITS.scale.max, fallback);
}

export function createDefaultAssemblyGroundOffset(liftY = VISUAL_LIMITS.assembly.groundLiftY.default) {
  return [
    0,
    clampNumber(
      liftY,
      VISUAL_LIMITS.assembly.groundLiftY.min,
      VISUAL_LIMITS.assembly.groundLiftY.max,
      VISUAL_LIMITS.assembly.groundLiftY.default
    ),
    0,
  ];
}

export function createDefaultHallCenter() {
  return [
    VISUAL_LIMITS.assembly.hallCenterX.default,
    0,
    VISUAL_LIMITS.assembly.hallCenterZ.default,
  ];
}

export function clampCameraConfig(camera = {}) {
  const fov = clampNumber(camera.fov, VISUAL_LIMITS.camera.fov.min, VISUAL_LIMITS.camera.fov.max, 38);
  const near = clampNumber(camera.near, VISUAL_LIMITS.camera.near.min, VISUAL_LIMITS.camera.near.max, 0.1);
  let far = clampNumber(camera.far, VISUAL_LIMITS.camera.far.min, VISUAL_LIMITS.camera.far.max, 400);
  if (far <= near + 1) far = near + 50;
  return {
    ...camera,
    fov,
    near,
    far,
  };
}

export function clampShot(shot = {}) {
  return {
    ...shot,
    position: clampVec3(shot.position, VISUAL_LIMITS.position, [8, 4, 10]),
    target: clampVec3(shot.target, VISUAL_LIMITS.position, [0, 1.5, 0]),
    durationMs: clampNumber(shot.durationMs, 200, 12000, 1400),
  };
}

export function clampLight(light = {}, fallbackIntensity = 1) {
  if (!light || typeof light !== "object") return light;
  return {
    ...light,
    intensity: clampNumber(
      light.intensity,
      VISUAL_LIMITS.lightIntensity.min,
      VISUAL_LIMITS.lightIntensity.max,
      fallbackIntensity
    ),
    position: light.position
      ? clampVec3(light.position, VISUAL_LIMITS.position, light.position)
      : light.position,
    distance: light.distance == null
      ? light.distance
      : clampNumber(light.distance, 1, 200, 30),
  };
}

export function clampEnvironment(environment = {}) {
  return {
    ...environment,
    ambientIntensity: clampNumber(
      environment.ambientIntensity,
      VISUAL_LIMITS.ambientIntensity.min,
      VISUAL_LIMITS.ambientIntensity.max,
      0.3
    ),
    keyLight: clampLight(environment.keyLight, 2),
    fillLight: clampLight(environment.fillLight, 1.5),
    rimLight: clampLight(environment.rimLight, 2),
    contactShadowScale: environment.contactShadowScale == null
      ? environment.contactShadowScale
      : clampNumber(environment.contactShadowScale, 4, 80, 18),
  };
}

export function clampGround(ground = {}) {
  if (!ground || ground.enabled === false) return ground;
  return {
    ...ground,
    y: clampNumber(ground.y, -2, 4, 0),
    size: clampNumber(ground.size, VISUAL_LIMITS.groundSize.min, VISUAL_LIMITS.groundSize.max, 48),
    metalness: clampNumber(ground.metalness, 0, 1, 0.18),
    roughness: clampNumber(ground.roughness, 0, 1, 0.52),
  };
}

export function clampRenderer(renderer = {}) {
  return {
    ...renderer,
    exposure: clampNumber(
      renderer.exposure,
      VISUAL_LIMITS.exposure.min,
      VISUAL_LIMITS.exposure.max,
      1.1
    ),
  };
}

export function clampModelTransform(model = {}) {
  return {
    ...model,
    position: clampVec3(model.position, VISUAL_LIMITS.position, [0, 0, 0]),
    rotation: clampVec3(model.rotation || [0, 0, 0], VISUAL_LIMITS.rotationRad, [0, 0, 0]),
    scale: clampScale(model.scale ?? 1, 1),
  };
}

/**
 * 根据装配分件数量给镜头/远裁一个稳妥默认，避免远平面过小裁掉主体。
 */
export function recommendAssemblyCamera(partCount = 1) {
  const far = clampNumber(180 + partCount * 8, 220, 600, 400);
  return {
    fov: 38,
    near: 0.15,
    far,
    defaultShot: "hero",
  };
}
