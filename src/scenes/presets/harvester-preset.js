/**
 * 收获机展示预设。
 *
 * 资产只需要替换 modelUrl；如果模型中使用 VAR_ 前缀材质槽，材质变体
 * 会自动只作用到这些槽，否则默认作用于整台机器。
 */
export const HARVESTER_MODEL_PLACEHOLDER = "/model/收获机.glb";

export const HARVESTER_THEMES = Object.freeze({
  studio: {
    environment: {
      background: "#090b0f",
      files: "/envMap/apartment.hdr",
      keyLight: { position: [5, 8, 6], intensity: 2.4, color: "#fff5df" },
      fillLight: { position: [-7, 4, 4], intensity: 1.8, color: "#9bc5ff" },
      rimLight: { position: [1, 6, -8], intensity: 2.8, color: "#ffffff" },
    },
    effects: { bloom: { intensity: 0.9 }, vignette: { darkness: 0.48 } },
  },
  field: {
    environment: {
      background: "#8aa2a0",
      files: "/envMap/venice_sunset_1k.hdr",
      keyLight: { position: [8, 12, 5], intensity: 3, color: "#fff4d6" },
      fillLight: { position: [-8, 6, 4], intensity: 1.4, color: "#b8dcff" },
      rimLight: { position: [0, 8, -10], intensity: 1.8, color: "#f4d59d" },
    },
    ground: { color: "#4f4a37", roughness: 0.9, grid: null },
    effects: { bloom: { intensity: 0.65 }, vignette: { darkness: 0.36 } },
  },
  night: {
    environment: {
      background: "#02050b",
      files: "/envMap/夜晚.hdr",
      keyLight: { position: [5, 8, 2], intensity: 1.2, color: "#9cc7ff" },
      fillLight: { position: [-6, 3, 4], intensity: 1.6, color: "#3b75ff" },
      rimLight: { position: [3, 7, -8], intensity: 4, color: "#ffd36b" },
    },
    ground: { color: "#080d13", roughness: 0.36 },
    effects: { bloom: { intensity: 1.65, threshold: 0.58 }, vignette: { darkness: 0.8 } },
  },
  technical: {
    environment: {
      background: "#05070c",
      files: "/envMap/abstract-lighting-ray-room-style-01_2K_f478fdd1-243a-4cc8-b454-0f522f1afb6b.exr",
      keyLight: { position: [4, 9, 5], intensity: 2.3, color: "#d9e9ff" },
      fillLight: { position: [-8, 4, 2], intensity: 2.8, color: "#57d9ff" },
      rimLight: { position: [2, 6, -8], intensity: 3.4, color: "#8b6cff" },
    },
    ground: { color: "#0d1118", roughness: 0.48 },
    effects: { bloom: { intensity: 1.35 }, vignette: { darkness: 0.72 } },
  },
});

export function createHarvesterThemeScene(scene, themeId = "studio") {
  const theme = HARVESTER_THEMES[themeId] || HARVESTER_THEMES.studio;
  return {
    ...scene,
    theme: themeId,
    environment: {
      ...scene.environment,
      ...theme.environment,
      keyLight: { ...scene.environment?.keyLight, ...theme.environment?.keyLight },
      fillLight: { ...scene.environment?.fillLight, ...theme.environment?.fillLight },
      rimLight: { ...scene.environment?.rimLight, ...theme.environment?.rimLight },
    },
    ground: { ...scene.ground, ...theme.ground },
    effects: {
      ...scene.effects,
      ...theme.effects,
      bloom: { ...scene.effects?.bloom, ...theme.effects?.bloom },
      vignette: { ...scene.effects?.vignette, ...theme.effects?.vignette },
    },
  };
}

export function createHarvesterScene({
  modelUrl = HARVESTER_MODEL_PLACEHOLDER,
  modelId = "harvester",
  modelLabel = "收获机",
  title = "收获机 · 智能农机展示",
  modelScale = 1,
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],
} = {}) {
  return {
    version: 1,
    id: "harvester-showcase",
    title,
    dracoDecoderPath: "/draco/",
    renderer: {
      dpr: [1, 1.5],
      toneMapping: "ACESFilmic",
      exposure: 1.15,
      shadows: true,
    },
    models: [
      {
        id: modelId,
        label: modelLabel,
        url: modelUrl,
        position: modelPosition,
        rotation: modelRotation,
        scale: modelScale,
        variantTarget: true,
      },
    ],
    machine: {
      enabled: true,
      label: "收获机状态",
      defaultState: "idle",
      telemetryLabels: {
        speed: "速度",
        fuel: "燃油",
        grainFill: "粮仓",
        engineHours: "工时",
      },
      telemetry: {
        speed: 0,
        fuel: 100,
        grainFill: 0,
        engineHours: 0,
      },
      parts: [
        { id: "cab", label: "驾驶室" },
        { id: "header", label: "割台" },
        { id: "engine", label: "发动机" },
        { id: "grain-tank", label: "粮仓" },
        { id: "unloading", label: "卸粮筒" },
        { id: "wheel", label: "行走系统" },
      ],
    },
    environment: {
      background: "#071015",
      files: "/envMap/venice_sunset_1k.hdr",
      ambientIntensity: 0.34,
      keyLight: {
        position: [7, 10, 5],
        intensity: 2.6,
        color: "#fff0d2",
      },
      fillLight: {
        position: [-8, 5, 4],
        intensity: 2.2,
        color: "#83b9ff",
        distance: 28,
      },
      rimLight: {
        position: [2, 7, -9],
        intensity: 3.1,
        color: "#ffd18a",
      },
      contactShadow: true,
      contactShadowPosition: [0, 0.02, 0],
      contactShadowScale: 18,
    },
    ground: {
      enabled: true,
      y: 0,
      size: 48,
      color: "#10181b",
      metalness: 0.18,
      roughness: 0.52,
      grid: {
        divisions: 48,
        colorCenter: "#64716f",
        color: "#263234",
      },
    },
    effects: {
      enabled: true,
      multisampling: 2,
      bloom: {
        enabled: true,
        threshold: 0.78,
        intensity: 1.15,
        radius: 0.72,
      },
      vignette: {
        enabled: true,
        offset: 0.24,
        darkness: 0.58,
      },
      noise: {
        enabled: true,
        opacity: 0.018,
      },
    },
    camera: {
      fov: 38,
      defaultShot: "hero",
      near: 0.1,
      far: 300,
    },
    shots: [
      {
        id: "hero",
        label: "主视觉",
        position: [9.5, 4.2, 11.5],
        target: [0, 1.6, 0],
        durationMs: 1500,
      },
      {
        id: "front",
        label: "正前",
        position: [0, 3.1, 12],
        target: [0, 1.4, 0],
        durationMs: 1300,
      },
      {
        id: "side",
        label: "侧视",
        position: [13, 3.6, 2.5],
        target: [0, 1.5, 0],
        durationMs: 1300,
      },
      {
        id: "top",
        label: "俯视",
        position: [6.5, 12, 8],
        target: [0, 0.8, 0],
        durationMs: 1500,
      },
    ],
    materialVariants: [
      { id: "original", label: "原始材质", useOriginal: true },
      {
        id: "harvest-yellow",
        label: "收获金",
        color: "#d9a52a",
        metalness: 0.7,
        roughness: 0.28,
        physical: true,
        clearcoat: 0.42,
        clearcoatRoughness: 0.14,
      },
      {
        id: "field-green",
        label: "田野绿",
        color: "#4d7654",
        metalness: 0.62,
        roughness: 0.32,
        physical: true,
        clearcoat: 0.28,
        clearcoatRoughness: 0.18,
      },
      {
        id: "graphite",
        label: "石墨灰",
        color: "#303940",
        metalness: 0.82,
        roughness: 0.24,
        physical: true,
        clearcoat: 0.3,
        clearcoatRoughness: 0.16,
      },
      {
        id: "ivory",
        label: "象牙白",
        color: "#e6e1d2",
        metalness: 0.18,
        roughness: 0.3,
        physical: true,
        clearcoat: 0.22,
        clearcoatRoughness: 0.2,
      },
    ],
    defaultVariant: "original",
    controls: {
      autoRotate: false,
      minDistance: 4,
      maxDistance: 55,
      enablePan: true,
    },
  };
}

