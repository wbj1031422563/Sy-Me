/**
 * 展厅背景 / 地面 / 地台基面颜色预设。
 * 与完整皮肤（灯柱/幕墙）解耦：换基面不改道具布局，只改色彩与轻度材质。
 */

import { SHOWROOM_PROP_TYPES } from "./showroom-skins.js";

export const STAGE_SURFACE_PRESETS = Object.freeze([
  {
    id: "studio-white",
    label: "影棚白",
    description: "接近产品静物图的浅灰白基面与背景。",
    swatch: "#e8eaed",
    environment: {
      background: "#e6e8eb",
      ambientIntensity: 0.48,
    },
    ground: {
      enabled: true,
      color: "#d9dde2",
      metalness: 0.04,
      roughness: 0.86,
      grid: null,
    },
    floor: {
      color: "#f2f4f6",
      metalness: 0.12,
      roughness: 0.42,
      ringColor: "#c5ccd4",
      emissiveIntensity: 0.18,
    },
  },
  {
    id: "soft-grey",
    label: "柔和灰",
    description: "中性灰背景，适合看清红机身轮廓。",
    swatch: "#9aa3ad",
    environment: {
      background: "#aeb6bf",
      ambientIntensity: 0.4,
    },
    ground: {
      enabled: true,
      color: "#8f98a2",
      metalness: 0.06,
      roughness: 0.78,
      grid: null,
    },
    floor: {
      color: "#c8ced5",
      metalness: 0.18,
      roughness: 0.38,
      ringColor: "#7d8792",
      emissiveIntensity: 0.22,
    },
  },
  {
    id: "warm-cream",
    label: "暖米白",
    description: "偏暖的展台底色，接近麦田金气质。",
    swatch: "#e8dcc8",
    environment: {
      background: "#e4d7c2",
      ambientIntensity: 0.44,
    },
    ground: {
      enabled: true,
      color: "#d4c4ab",
      metalness: 0.05,
      roughness: 0.8,
      grid: null,
    },
    floor: {
      color: "#efe4d2",
      metalness: 0.16,
      roughness: 0.4,
      ringColor: "#c9a56a",
      emissiveIntensity: 0.28,
    },
  },
  {
    id: "charcoal",
    label: "炭灰",
    description: "深灰影棚，突出高光与轮缘细节。",
    swatch: "#3a4048",
    environment: {
      background: "#2c3138",
      ambientIntensity: 0.3,
    },
    ground: {
      enabled: true,
      color: "#23282e",
      metalness: 0.16,
      roughness: 0.62,
      grid: null,
    },
    floor: {
      color: "#353b44",
      metalness: 0.42,
      roughness: 0.28,
      ringColor: "#8a93a0",
      emissiveIntensity: 0.35,
    },
  },
  {
    id: "pure-black",
    label: "纯黑",
    description: "低环境光黑底，科技演示向。",
    swatch: "#0b0d10",
    environment: {
      background: "#05060a",
      ambientIntensity: 0.18,
    },
    ground: {
      enabled: true,
      color: "#090b0f",
      metalness: 0.28,
      roughness: 0.5,
      grid: null,
    },
    floor: {
      color: "#12151b",
      metalness: 0.62,
      roughness: 0.18,
      ringColor: "#57d9ff",
      emissiveIntensity: 0.55,
    },
  },
  {
    id: "amber-dark",
    label: "麦田金底",
    description: "深暖金背景与抛光地台。",
    swatch: "#c9963f",
    environment: {
      background: "#120e0a",
      ambientIntensity: 0.28,
    },
    ground: {
      enabled: true,
      color: "#0d0b09",
      metalness: 0.22,
      roughness: 0.55,
      grid: null,
    },
    floor: {
      color: "#17110c",
      metalness: 0.62,
      roughness: 0.18,
      ringColor: "#f2c26b",
      emissiveIntensity: 0.7,
    },
  },
  {
    id: "field-green",
    label: "田间绿",
    description: "偏自然的灰绿展台氛围。",
    swatch: "#6f8684",
    environment: {
      background: "#6f8684",
      ambientIntensity: 0.36,
    },
    ground: {
      enabled: true,
      color: "#4f6361",
      metalness: 0.08,
      roughness: 0.72,
      grid: null,
    },
    floor: {
      color: "#7f9693",
      metalness: 0.22,
      roughness: 0.4,
      ringColor: "#d8ba7a",
      emissiveIntensity: 0.3,
    },
  },
  {
    id: "sky-soft",
    label: "天空蓝灰",
    description: "浅蓝灰背景，适合冷调机身对比。",
    swatch: "#9bb4c9",
    environment: {
      background: "#9bb4c9",
      ambientIntensity: 0.42,
    },
    ground: {
      enabled: true,
      color: "#7f97ab",
      metalness: 0.06,
      roughness: 0.76,
      grid: null,
    },
    floor: {
      color: "#d5e2ec",
      metalness: 0.2,
      roughness: 0.36,
      ringColor: "#7eb6ff",
      emissiveIntensity: 0.32,
    },
  },
]);

export function findStageSurfacePreset(presetId) {
  return STAGE_SURFACE_PRESETS.find((item) => item.id === presetId) || STAGE_SURFACE_PRESETS[0];
}

function patchFloorExtension(extensions = [], floorPatch = {}) {
  const next = Array.isArray(extensions) ? [...extensions] : [];
  const index = next.findIndex((item) => item?.type === SHOWROOM_PROP_TYPES.SHOWROOM_FLOOR);
  if (index < 0) return next;
  next[index] = {
    ...next[index],
    params: {
      ...(next[index].params || {}),
      ...floorPatch,
    },
  };
  return next;
}

/**
 * 应用背景 / 地面 / 地台颜色预设。
 */
export function applyStageSurface(scene, presetId = "studio-white") {
  if (!scene) return scene;
  const preset = findStageSurfacePreset(presetId);
  const next = {
    ...scene,
    stageSurface: preset.id,
    environment: {
      ...(scene.environment || {}),
      ...(preset.environment || {}),
    },
    ground: {
      ...(scene.ground || {}),
      ...(preset.ground || {}),
      y: scene.ground?.y ?? 0,
      size: scene.ground?.size ?? 72,
      enabled: preset.ground?.enabled ?? scene.ground?.enabled ?? true,
    },
  };

  if (preset.floor) {
    next.extensions = patchFloorExtension(scene.extensions, preset.floor);
  }

  return next;
}

/**
 * 自定义三层颜色（背景 / 地面 / 地台），写入 stageSurface=custom。
 */
export function applyCustomStageSurface(scene, {
  background,
  groundColor,
  floorColor,
  ringColor,
  ambientIntensity,
} = {}) {
  if (!scene) return scene;
  const next = {
    ...scene,
    stageSurface: "custom",
    environment: {
      ...(scene.environment || {}),
      ...(background ? { background } : {}),
      ...(ambientIntensity != null ? { ambientIntensity } : {}),
    },
    ground: {
      ...(scene.ground || {}),
      ...(groundColor ? { color: groundColor } : {}),
      enabled: scene.ground?.enabled !== false,
      y: scene.ground?.y ?? 0,
      size: scene.ground?.size ?? 72,
    },
  };

  const floorPatch = {};
  if (floorColor) floorPatch.color = floorColor;
  if (ringColor) floorPatch.ringColor = ringColor;
  if (Object.keys(floorPatch).length > 0) {
    next.extensions = patchFloorExtension(scene.extensions, floorPatch);
  }

  return next;
}
