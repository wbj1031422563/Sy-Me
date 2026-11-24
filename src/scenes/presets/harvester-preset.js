/**
 * 收获机展示预设。
 *
 * 资产只需要替换 modelUrl；如果模型中使用 VAR_ 前缀材质槽，材质变体
 * 会自动只作用到这些槽，否则默认作用于整台机器。
 *
 * 展示入口（showcase）默认关闭 machine 面板；作业演示 / 孪生模式可再打开。
 *
 * 分件整机：见 createHarvesterAssemblyScene — 各 GLB 已含 CAD 世界坐标，
 * 场景层用单位变换拼装（Approach B）。
 */
import {
  encodeHarvesterPartUrl,
  hasHarvesterPartL2,
  listHarvesterParts,
  summarizeHarvesterParts,
  HARVESTER_ASSEMBLY_GROUND_OFFSET,
} from "./harvester-parts.js";
import { applyShowroomSkin } from "../../features/showroom-props/showroom-skins.js";
import { recommendAssemblyCamera } from "../../core/scene/scene-visual-limits.js";

export const HARVESTER_MODEL_PLACEHOLDER = "/model/收获机.glb";

export {
  HARVESTER_PARTS,
  HARVESTER_PARTS_BASE,
  HARVESTER_PARTS_WEB_BASE,
  HARVESTER_PARTS_WEB_L2_BASE,
  HARVESTER_ASSEMBLY_GROUND_OFFSET,
  offsetHarvesterAssemblyPoint,
  HARVESTER_ASSEMBLY_MODES,
  encodeHarvesterPartUrl,
  hasHarvesterPartL2,
  listHarvesterParts,
  summarizeHarvesterParts,
  probeHarvesterPartsAvailable,
  probeHarvesterPartsWebAvailable,
  probeHarvesterPartsWebL2Available,
} from "./harvester-parts.js";

/** 展厅默认视觉方案（电影向柔和档） */
export const HARVESTER_SHOWCASE_VISUAL = Object.freeze({
  theme: "field",
  quality: "soft",
  particles: "dust",
  colorGrade: "warm",
  variant: "harvest-yellow",
  shot: "hero",
});

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

/**
 * 创建收获机展示场景。
 *
 * @param {object} options
 * @param {boolean} [options.machineEnabled=false] 展示默认关闭；孪生/作业演示可传 true
 * @param {boolean} [options.cinematic=true] 默认启用温和 bloom / vignette / 粒子
 */
export function createHarvesterScene({
  modelUrl = HARVESTER_MODEL_PLACEHOLDER,
  modelId = "harvester",
  modelLabel = "收获机",
  title = "收获机 · 智能农机展示",
  modelScale = 1,
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],
  machineEnabled = false,
  cinematic = true,
} = {}) {
  const scene = {
    version: 2,
    schemaVersion: 2,
    schema: { id: "sy-me.scene", version: 2 },
    id: "harvester-showcase",
    title,
    kind: "showcase",
    dracoDecoderPath: "/draco/",
    renderer: {
      dpr: [1, 1.25],
      antialias: false,
      toneMapping: "ACESFilmic",
      exposure: 1.1,
      shadows: cinematic,
      adaptiveQuality: true,
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
    // 展示入口默认关闭；作业演示模式可再打开（phase 3 孪生开关）
    machine: {
      enabled: machineEnabled,
      label: "主体状态",
      defaultState: "idle",
      telemetryLabels: {
        speed: "速度",
        fuel: "燃油",
        grainFill: "粮仓",
        engineHours: "工时",
        rotorRpm: "滚筒",
        headerHeight: "割台高度",
      },
      telemetry: {
        speed: 0,
        fuel: 100,
        grainFill: 12,
        engineHours: 128.4,
        rotorRpm: 0,
        headerHeight: 55,
      },
      parts: [
        {
          id: "cab",
          label: "驾驶室",
          shotId: "cab-close",
          modelIds: ["part-003-cab"],
          description: "操控与视野中心",
        },
        {
          id: "header",
          label: "割台",
          shotId: "header-close",
          modelIds: ["part-001-header", "part-002-bridge", "part-004-feeder"],
          description: "喂入与切割系统",
        },
        {
          id: "engine",
          label: "动力舱",
          shotId: "side",
          modelIds: ["part-011-intake", "part-012-exhaust", "part-013-fuel", "part-014-cooling", "part-023-engine-cover"],
          description: "进排气 / 燃油 / 散热",
        },
        {
          id: "grain-tank",
          label: "粮仓",
          shotId: "grain-close",
          modelIds: ["part-022-grain-tank", "part-008-grain-elevator"],
          description: "籽粒暂存与升运",
        },
        {
          id: "unloading",
          label: "卸粮筒",
          shotId: "unload-close",
          modelIds: ["part-015-unload"],
          description: "高位卸粮机构",
        },
        {
          id: "wheel",
          label: "行走系统",
          shotId: "wheels-close",
          modelIds: ["part-018-wheels", "part-019-axle", "part-017-gearbox", "part-020-driveline"],
          description: "轮系 / 桥 / 传动",
        },
      ],
    },
    environment: {
      background: "#6f8684",
      files: "/envMap/venice_sunset_1k.hdr",
      ambientIntensity: 0.36,
      keyLight: {
        position: [8, 12, 5],
        intensity: 2.8,
        color: "#fff4d6",
      },
      fillLight: {
        position: [-8, 6, 4],
        intensity: 1.5,
        color: "#b8dcff",
        distance: 28,
      },
      rimLight: {
        position: [0, 8, -10],
        intensity: 1.9,
        color: "#f4d59d",
      },
      contactShadow: true,
      contactShadowFrames: 1,
      contactShadowPosition: [0, 0.02, 0],
      contactShadowScale: 18,
    },
    ground: {
      enabled: true,
      y: 0,
      size: 48,
      color: "#4f4a37",
      metalness: 0.12,
      roughness: 0.9,
      grid: null,
    },
    effects: {
      enabled: cinematic,
      multisampling: cinematic ? 2 : 0,
      bloom: {
        enabled: cinematic,
        threshold: 0.86,
        intensity: 0.68,
        radius: 0.62,
      },
      vignette: {
        enabled: cinematic,
        offset: 0.2,
        darkness: 0.34,
      },
      noise: {
        enabled: false,
        opacity: 0,
      },
    },
    particles: cinematic
      ? {
        enabled: true,
        preset: "dust",
        count: 90,
        size: 1.05,
        speed: 0.14,
        opacity: 0.22,
        color: "#d6bb83",
        scale: [18, 5, 12],
        position: [0, 1.1, 0],
        noise: 1,
      }
      : { enabled: false },
    colorGrade: {
      enabled: cinematic,
      hue: 8,
      saturation: 0.06,
      brightness: 0.02,
      contrast: 0.06,
      rgbGain: [1.05, 1.01, 0.94],
      rgbLift: [0.01, 0, -0.01],
      rgbGamma: [0.98, 1, 1.04],
    },
    camera: {
      fov: 38,
      defaultShot: "hero",
      near: 0.1,
      far: 300,
    },
    // 巡演友好顺序：主视觉 → 正前 → 侧视 → 部件特写 → 俯视
    shots: [
      {
        id: "hero",
        label: "主视觉",
        position: [9.5, 4.2, 11.5],
        target: [0, 1.6, 0],
        durationMs: 1600,
      },
      {
        id: "front",
        label: "正前",
        position: [0, 3.1, 12],
        target: [0, 1.4, 0],
        durationMs: 1400,
      },
      {
        id: "cab-close",
        label: "驾驶室",
        position: [3.2, 3.4, 5.2],
        target: [0.2, 2.4, 0.4],
        durationMs: 1300,
      },
      {
        id: "header-close",
        label: "割台",
        position: [1.2, 1.8, 8.5],
        target: [0, 0.6, 2.2],
        durationMs: 1300,
      },
      {
        id: "side",
        label: "侧视",
        position: [13, 3.6, 2.5],
        target: [0, 1.5, 0],
        durationMs: 1400,
      },
      {
        id: "grain-close",
        label: "粮仓",
        position: [-4.5, 5.2, 6],
        target: [-0.4, 2.8, 0],
        durationMs: 1300,
      },
      {
        id: "unload-close",
        label: "卸粮",
        position: [-8, 4.2, 3],
        target: [-1.5, 2.6, 0.2],
        durationMs: 1300,
      },
      {
        id: "top",
        label: "俯视",
        position: [6.5, 12, 8],
        target: [0, 0.8, 0],
        durationMs: 1600,
      },
    ],
    hotspots: [
      {
        id: "cab",
        label: "驾驶室",
        anchor: "object",
        offset: [0.2, 2.6, 0.3],
        shotId: "cab-close",
        panel: {
          title: "驾驶室",
          body: "宽敞视野与人机工程操控台，兼顾长时间作业舒适性与信息可读性。",
        },
      },
      {
        id: "header",
        label: "割台",
        anchor: "object",
        offset: [0, 0.55, 2.4],
        shotId: "header-close",
        panel: {
          title: "割台",
          body: "高效喂入与仿形切割，适配不同作物与地表条件，保障收获质量。",
        },
      },
      {
        id: "grain",
        label: "粮仓",
        anchor: "object",
        offset: [-0.4, 3.1, -0.2],
        shotId: "grain-close",
        panel: {
          title: "粮仓",
          body: "大容量粮仓与填充监测，减少转场频次，提升连续作业效率。",
        },
      },
      {
        id: "unload",
        label: "卸粮",
        anchor: "object",
        offset: [-2.2, 2.8, 0.1],
        shotId: "unload-close",
        panel: {
          title: "卸粮系统",
          body: "高位卸粮筒便于对接运粮车，缩短停机卸粮时间。",
        },
      },
      {
        id: "wheels",
        label: "行走",
        anchor: "object",
        offset: [1.6, 0.7, 0.4],
        shotId: "side",
        panel: {
          title: "行走系统",
          body: "稳定行走与田间通过性设计，支撑复杂地形下的连续收获。",
        },
      },
    ],
    tour: {
      enabled: true,
      loop: true,
      intervalMs: 3800,
      shotIds: [
        "hero",
        "front",
        "cab-close",
        "header-close",
        "side",
        "grain-close",
        "unload-close",
        "top",
      ],
      autoStart: false,
    },
    materialVariants: [
      { id: "original", label: "原始材质", useOriginal: true, description: "保留 GLB 内嵌材质与贴图。", swatch: "#8a97a3" },
      {
        id: "harvest-yellow",
        label: "收获金",
        color: "#d9a52a",
        metalness: 0.7,
        roughness: 0.28,
        physical: true,
        clearcoat: 0.42,
        clearcoatRoughness: 0.14,
        description: "高光金色漆面，适合主视觉。",
        swatch: "#d9a52a",
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
        description: "偏自然的低饱和绿色漆面。",
        swatch: "#4d7654",
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
        description: "深色金属漆，突出轮廓与高光。",
        swatch: "#303940",
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
        description: "浅色柔光漆面，接近白馆静物。",
        swatch: "#e6e1d2",
      },
    ],
    defaultVariant: cinematic ? "harvest-yellow" : "original",
    controls: {
      autoRotate: false,
      minDistance: 4,
      maxDistance: 55,
      enablePan: true,
    },
  };

  return createHarvesterThemeScene(scene, cinematic ? "field" : "studio");
}

/**
 * 分件整机装配场景。
 *
 * 变换策略（已用 GLB JSON/AABB 验证）：
 * - 根节点 scale≈0.01（CAD→米）+ 约 +90°X（Z-up→Y-up）
 * - 网格顶点处于同一世界坐标系，多数根 translation=0
 * - 005 分离室根节点带 translation [1.79, 0.73, -0.01]
 * - 场景层 rotation/scale/position 保持单位；运行时按轮底 AABB 自适应贴地
 * - autoFrame=false，避免各分件被单独挪回原点
 *
 * @param {object} options
 * @param {'header'|'core'|'full'} [options.mode='full']
 * @param {boolean} [options.machineEnabled=false]
 * @param {boolean} [options.cinematic=true]
 * @param {string} [options.showroomSkin='amber-hall'] 展厅皮肤：amber-hall | white-hall | none
 */
export function createHarvesterAssemblyScene({
  mode = "full",
  machineEnabled = false,
  cinematic = true,
  title,
  showroomSkin = "amber-hall",
  partsBase,
  partsL2Base,
} = {}) {
  if (mode === "header") {
    return createHarvesterScene({
      modelUrl: HARVESTER_MODEL_PLACEHOLDER,
      modelLabel: "谷物割台",
      title: title || "收获机 · 割台展示",
      machineEnabled,
      cinematic,
    });
  }

  const parts = listHarvesterParts(mode);
  const summary = summarizeHarvesterParts(parts);
  const base = createHarvesterScene({
    modelUrl: parts[0] ? encodeHarvesterPartUrl(parts[0].file, partsBase) : HARVESTER_MODEL_PLACEHOLDER,
    modelId: parts[0]?.id || "harvester",
    modelLabel: parts[0]?.label || "收获机",
    title: title || (mode === "core"
      ? `收获机 · 精简整机（${summary.count} 件）`
      : `收获机 · 整机装配（${summary.count} 件）`),
    machineEnabled,
    cinematic,
  });

  // 模型保持 CAD 原坐标；运行时 AssemblyGroundAligner 按轮底自适应贴地
  const groundOffset = HARVESTER_ASSEMBLY_GROUND_OFFSET;
  const models = parts.map((part, index) => ({
    id: part.id,
    label: part.label,
    url: encodeHarvesterPartUrl(part.file, partsBase),
    // 大件附 L2 低模地址：自适应性能档降档时由 SceneViewer 切换
    ...(partsL2Base && hasHarvesterPartL2(part)
      ? { lodL2Url: encodeHarvesterPartUrl(part.file, partsL2Base) }
      : {}),
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    // 必须关闭：否则每个分件会被重新落到原点，破坏 CAD 世界坐标
    autoFrame: false,
    reveal: false,
    variantTarget: index === 0,
    assetId: part.id,
    parentId: null,
    assemblyId: "harvester-assembly",
    assetSource: "workspace-parts",
    assetFormat: "glb",
  }));

  // 镜头/热点用 CAD 坐标；CameraRig 会按实测 liftY 同步抬升
  const assemblyShots = [
    {
      id: "hero",
      label: "主视觉",
      position: [14, 5, 16],
      target: [2.2, 1.2, -0.4],
      durationMs: 1600,
    },
    {
      id: "front",
      label: "正前",
      position: [-8, 2.5, 10],
      target: [-1.5, 1.2, 0.2],
      durationMs: 1400,
    },
    {
      id: "cab-close",
      label: "驾驶室",
      position: [4.5, 2.8, 6],
      target: [0.7, 1.8, -0.4],
      durationMs: 1300,
    },
    {
      id: "header-close",
      label: "割台",
      position: [-6, 2, 8],
      target: [-2.8, 0.8, 0.3],
      durationMs: 1300,
    },
    {
      id: "wheels-close",
      label: "行走轮",
      position: [6, 2.2, 8],
      target: [2.3, 0.5, 0.2],
      durationMs: 1300,
    },
    {
      id: "side",
      label: "侧视",
      position: [3, 3, 18],
      target: [2.2, 1.4, -0.4],
      durationMs: 1400,
    },
    {
      id: "grain-close",
      label: "粮仓",
      position: [0.5, 5, -8],
      target: [1.8, 1.5, -2],
      durationMs: 1300,
    },
    {
      id: "unload-close",
      label: "卸粮",
      position: [12, 3.5, 4],
      target: [5.5, 1.2, -1.2],
      durationMs: 1300,
    },
    {
      id: "top",
      label: "俯视",
      position: [3, 20, 6],
      target: [2.2, 0.5, -0.5],
      durationMs: 1600,
    },
  ];

  const assembled = {
    ...base,
    id: mode === "core" ? "harvester-assembly-core" : "harvester-assembly",
    assemblyMode: mode,
    assemblyMeta: {
      transformSource: "embedded-glb-world",
      adaptiveGround: true,
      groundY: 0,
      showBounds: true,
      // 测量完成前的兜底抬升；实际以轮底 AABB 为准
      groundOffset: [...groundOffset],
      partCount: summary.count,
      approxSizeMB: summary.sizeMB,
      note: "CAD world coords; runtime adaptive ground lift from wheel bottoms.",
    },
    models,
    camera: {
      ...base.camera,
      ...recommendAssemblyCamera(summary.count),
      defaultShot: "hero",
    },
    controls: {
      ...base.controls,
      minDistance: 6,
      maxDistance: 80,
    },
    environment: {
      ...base.environment,
      contactShadowScale: 36,
      contactShadowPosition: [2, 0.02, 0],
    },
    ground: {
      ...base.ground,
      size: 72,
    },
    // 整机体量大：默认用 SMAA 抗锯齿而非 MSAA 上下文；阴影保持关闭，降低 OOM 风险
    renderer: {
      ...base.renderer,
      dpr: [1, 1.25],
      shadows: false,
      antialias: false,
      textureAnisotropy: 4,
    },
    effects: {
      ...base.effects,
      enabled: true,
      smaa: { enabled: true },
    },
    shots: assemblyShots,
    hotspots: (base.hotspots || []).map((spot) => {
      const offsets = {
        cab: [0.7, 2.4, -0.4],
        header: [-2.8, 0.8, 0.4],
        grain: [1.8, 2.6, -2],
        unload: [5.5, 1.8, -1.2],
        wheels: [2.3, 0.9, 0.5],
      };
      return {
        ...spot,
        offset: offsets[spot.id] || spot.offset,
      };
    }),
  };

  return applyShowroomSkin(assembled, showroomSkin);
}
