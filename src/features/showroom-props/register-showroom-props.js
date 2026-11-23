import { sceneRegistry } from "../../core/scene/scene-registry.js";
import LightColumnExtension from "./LightColumnExtension.jsx";
import ShowroomFloorExtension from "./ShowroomFloorExtension.jsx";
import SpotRigExtension from "./SpotRigExtension.jsx";
import BackdropExtension from "./BackdropExtension.jsx";
import { SHOWROOM_PROP_TYPES } from "./showroom-skins.js";

let registered = false;

/** 注册展厅道具扩展（可重复调用，仅生效一次）。 */
export function registerShowroomProps() {
  if (registered) return;
  sceneRegistry.registerNode(SHOWROOM_PROP_TYPES.LIGHT_COLUMN, LightColumnExtension);
  sceneRegistry.registerNode(SHOWROOM_PROP_TYPES.SHOWROOM_FLOOR, ShowroomFloorExtension);
  sceneRegistry.registerNode(SHOWROOM_PROP_TYPES.SPOT_RIG, SpotRigExtension);
  sceneRegistry.registerNode(SHOWROOM_PROP_TYPES.BACKDROP, BackdropExtension);
  registered = true;
}

registerShowroomProps();
