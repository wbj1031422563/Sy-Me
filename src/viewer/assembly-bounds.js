import * as THREE from "three";
import {
  clampNumber,
  VISUAL_LIMITS,
} from "../core/scene/scene-visual-limits.js";

const DEFAULT_WHEEL_PATTERNS = [
  "wheel",
  "018",
  "019",
  "axle",
  "zhaunxiang",
  "qudong",
];

/**
 * 判断模型是否更像“轮系 / 桥”接触面参考。
 */
export function isWheelLikeModelId(modelId = "", patterns = DEFAULT_WHEEL_PATTERNS) {
  const id = String(modelId).toLowerCase();
  return patterns.some((pattern) => id.includes(String(pattern).toLowerCase()));
}

/**
 * 从已加载的 Object3D 计算世界包围盒。
 */
export function measureObjectsBounds(objects = []) {
  const box = new THREE.Box3();
  let counted = 0;
  for (const object of objects) {
    if (!object) continue;
    object.updateWorldMatrix?.(true, true);
    const next = new THREE.Box3().setFromObject(object);
    if (next.isEmpty()) continue;
    if (counted === 0) box.copy(next);
    else box.union(next);
    counted += 1;
  }
  if (!counted || box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return {
    min: box.min.toArray(),
    max: box.max.toArray(),
    size: size.toArray(),
    center: center.toArray(),
    count: counted,
  };
}

/**
 * 计算让接触面贴到 groundY 所需的抬升量。
 * 优先用轮系模型底面；没有轮系时退回整机包围盒底面。
 */
export function computeAdaptiveGroundLift({
  modelEntries = [],
  getObject,
  groundY = 0,
  wheelPatterns = DEFAULT_WHEEL_PATTERNS,
  fallbackLiftY = VISUAL_LIMITS.assembly.groundLiftY.default,
} = {}) {
  const visibleEntries = modelEntries.filter((entry) => entry && entry.visible !== false);
  if (!visibleEntries.length) {
    return {
      liftY: clampNumber(
        fallbackLiftY,
        VISUAL_LIMITS.assembly.groundLiftY.min,
        VISUAL_LIMITS.assembly.groundLiftY.max,
        VISUAL_LIMITS.assembly.groundLiftY.default
      ),
      source: "fallback",
      bounds: null,
      ready: false,
    };
  }

  // 轮系始终优先（即使被性能档隐藏），避免隐轮后改测机身导致整机“飘起”
  const wheelEntries = modelEntries.filter((entry) =>
    isWheelLikeModelId(entry.id, wheelPatterns)
  );
  const preferred = wheelEntries.length > 0 ? wheelEntries : visibleEntries;
  const objects = preferred
    .map((entry) => getObject?.(entry.id))
    .filter(Boolean);

  // 有任一参考件即可测；未加载完时继续用 fallback，等下一帧再收敛
  if (!objects.length) {
    return {
      liftY: clampNumber(
        fallbackLiftY,
        VISUAL_LIMITS.assembly.groundLiftY.min,
        VISUAL_LIMITS.assembly.groundLiftY.max,
        VISUAL_LIMITS.assembly.groundLiftY.default
      ),
      source: "fallback-pending",
      bounds: null,
      ready: false,
      loaded: 0,
      expected: preferred.length,
    };
  }

  // 测量前先把外层抬升清零由调用方保证；这里按当前世界盒计算补偿量。
  const bounds = measureObjectsBounds(objects);
  if (!bounds) {
    return {
      liftY: clampNumber(
        fallbackLiftY,
        VISUAL_LIMITS.assembly.groundLiftY.min,
        VISUAL_LIMITS.assembly.groundLiftY.max,
        VISUAL_LIMITS.assembly.groundLiftY.default
      ),
      source: "fallback-empty",
      bounds: null,
      ready: false,
    };
  }

  const minY = bounds.min[1];
  const liftY = clampNumber(
    groundY - minY,
    VISUAL_LIMITS.assembly.groundLiftY.min,
    VISUAL_LIMITS.assembly.groundLiftY.max,
    fallbackLiftY
  );

  return {
    liftY,
    source: wheelEntries.length > 0 ? "wheels" : "assembly",
    bounds,
    ready: true,
    contactMinY: minY,
    groundY,
  };
}

export function formatAssemblyAlignLabel(result) {
  if (!result) return "";
  const lift = Number(result.liftY || 0).toFixed(2);
  if (!result.ready) {
    return `贴地兜底 ${lift} m`;
  }
  const source = result.source === "wheels" ? "轮系底面" : "整机包围盒";
  const size = result.bounds?.size;
  const sizeText = Array.isArray(size)
    ? `${size[0].toFixed(1)}×${size[1].toFixed(1)}×${size[2].toFixed(1)} m`
    : "";
  return sizeText ? `${source} · 抬升 ${lift} m · ${sizeText}` : `${source} · 抬升 ${lift} m`;
}

export function offsetShotByLift(shot, liftY = 0) {
  if (!shot) return shot;
  // 已是世界坐标的聚焦镜头（如 __focus_*）不再叠加抬升
  if (shot.skipAssemblyLift || String(shot.id || "").startsWith("__focus_")) return shot;
  const dy = Number(liftY) || 0;
  if (!dy) return shot;
  const position = Array.isArray(shot.position) ? [...shot.position] : [0, 0, 5];
  const target = Array.isArray(shot.target) ? [...shot.target] : [0, 0, 0];
  position[1] = (position[1] || 0) + dy;
  target[1] = (target[1] || 0) + dy;
  return { ...shot, position, target };
}
