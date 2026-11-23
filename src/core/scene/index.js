export { normalizeScene, serializeScene } from "./scene-normalize.js";
export { hasRenderableModelUrl, normalizeModelCollection } from "./scene-safety.js";
export {
  CURRENT_SCENE_SCHEMA_VERSION,
  LEGACY_SCENE_SCHEMA_VERSION,
  SCENE_SCHEMA_ID,
  getSceneSchemaVersion,
  migrateSceneDocument,
} from "./scene-schema.js";
export { createSceneRuntime, useSceneRuntime } from "./scene-runtime.js";
export { sceneRegistry } from "./scene-registry.js";
export {
  HARVESTER_COMMANDS,
  HARVESTER_MACHINE_STATES,
  HARVESTER_STATE_LABELS,
  HARVESTER_STATE_HINTS,
  createMachineState,
  tickMachineTelemetry,
  resolveMachinePartFocus,
} from "../machine/harvester-machine.js";

export {
  VISUAL_LIMITS,
  clampNumber,
  clampVec3,
  clampCameraConfig,
  clampEnvironment,
  clampGround,
  clampRenderer,
  clampShot,
  clampModelTransform,
  createDefaultAssemblyGroundOffset,
  createDefaultHallCenter,
  recommendAssemblyCamera,
} from "./scene-visual-limits.js";

