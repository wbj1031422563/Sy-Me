import { HARVESTER_PARTS } from "./harvester-parts.js";

/**
 * 分件显隐性能档：按功能组开关，减轻展会现场负担。
 * 写入 models[].visible，不删除资源 URL。
 */

export const HARVESTER_VISIBILITY_PRESETS = Object.freeze([
  {
    id: "all",
    label: "全部显示",
    description: "加载清单内全部分件可见。",
    groups: ["appearance", "chassis", "working", "power"],
  },
  {
    id: "appearance",
    label: "外观优先",
    description: "驾驶室 / 护罩 / 粮箱 / 割台等外观件，适合主视觉。",
    groups: ["appearance"],
  },
  {
    id: "chassis",
    label: "行走机构",
    description: "轮系 / 桥 / 变速 / 传动，适合底盘讲解。",
    groups: ["chassis", "appearance"],
  },
  {
    id: "working",
    label: "作业系统",
    description: "脱粒 / 分离 / 升运 / 卸粮等作业链路。",
    groups: ["working", "appearance"],
  },
  {
    id: "lightweight",
    label: "轻量演示",
    description: "仅保留中小件与轮系，跳过超大体量外观件。",
    groups: ["chassis", "working", "power"],
    excludeIds: ["part-001-header", "part-003-cab", "part-021-covers"],
  },
]);

const PART_GROUPS = Object.freeze({
  "part-001-header": "appearance",
  "part-002-bridge": "working",
  "part-003-cab": "appearance",
  "part-004-feeder": "working",
  "part-005-separator": "working",
  "part-006-threshing": "working",
  "part-007-tailings": "working",
  "part-008-grain-elevator": "working",
  "part-009-chopper": "working",
  "part-010-air": "power",
  "part-011-intake": "power",
  "part-012-exhaust": "power",
  "part-013-fuel": "power",
  "part-014-cooling": "power",
  "part-015-unload": "working",
  "part-016-ladder": "appearance",
  "part-017-gearbox": "chassis",
  "part-018-wheels": "chassis",
  "part-019-axle": "chassis",
  "part-020-driveline": "chassis",
  "part-021-covers": "appearance",
  "part-022-grain-tank": "appearance",
  "part-023-engine-cover": "appearance",
});

export function findVisibilityPreset(presetId) {
  return HARVESTER_VISIBILITY_PRESETS.find((item) => item.id === presetId)
    || HARVESTER_VISIBILITY_PRESETS[0];
}

export function applyHarvesterVisibilityPreset(scene, presetId = "all") {
  if (!scene?.models?.length) return scene;
  const preset = findVisibilityPreset(presetId);
  const enabled = new Set(preset.groups || []);
  const excluded = new Set(preset.excludeIds || []);

  const models = scene.models.map((model) => {
    const group = PART_GROUPS[model.id];
    if (!group) {
      return { ...model, visible: model.visible !== false };
    }
    const visible = enabled.has(group) && !excluded.has(model.id);
    return { ...model, visible };
  });

  return {
    ...scene,
    visibilityPreset: preset.id,
    models,
  };
}

export function describeVisibilityCoverage(presetId = "all") {
  const preset = findVisibilityPreset(presetId);
  const enabled = new Set(preset.groups || []);
  const excluded = new Set(preset.excludeIds || []);
  const visibleIds = HARVESTER_PARTS
    .filter((part) => enabled.has(PART_GROUPS[part.id]) && !excluded.has(part.id))
    .map((part) => part.id);
  return {
    preset,
    visibleCount: visibleIds.length,
    totalCount: HARVESTER_PARTS.length,
  };
}
