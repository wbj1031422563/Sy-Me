/**
 * 展厅道具与皮肤。
 *
 * 路线：
 * 1. 灯柱 + 地台 + 皮肤
 * 2. 顶光灯位 + Logo 幕墙          ← 当前
 * 3. 讲解巡演增强 / 演示包导出
 * 4. 分件显隐性能档
 */

export { default as LightColumnExtension } from "./LightColumnExtension.jsx";
export { default as ShowroomFloorExtension } from "./ShowroomFloorExtension.jsx";
export { default as SpotRigExtension } from "./SpotRigExtension.jsx";
export { default as BackdropExtension } from "./BackdropExtension.jsx";
export { registerShowroomProps } from "./register-showroom-props.js";
export {
  SHOWROOM_PROP_TYPES,
  SHOWROOM_PROP_TYPE_LIST,
  SHOWROOM_SKINS,
  findShowroomSkin,
  createShowroomPropExtensions,
  applyShowroomSkin,
  upsertShowroomPropParams,
  removeShowroomProps,
} from "./showroom-skins.js";
export {
  STAGE_SURFACE_PRESETS,
  findStageSurfacePreset,
  applyStageSurface,
  applyCustomStageSurface,
} from "./stage-surface-presets.js";
