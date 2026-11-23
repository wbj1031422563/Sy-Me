/**
 * 展厅皮肤：一键组合灯柱、地台、顶光、幕墙与轻度环境倾向。
 */

export const SHOWROOM_PROP_TYPES = Object.freeze({
  LIGHT_COLUMN: "light-column",
  SHOWROOM_FLOOR: "showroom-floor",
  SPOT_RIG: "spot-rig",
  BACKDROP: "backdrop",
});

export const SHOWROOM_PROP_TYPE_LIST = Object.freeze(Object.values(SHOWROOM_PROP_TYPES));

const HALL_CENTER = [2.2, 0, -0.3];

export const SHOWROOM_SKINS = Object.freeze([
  {
    id: "amber-hall",
    label: "麦田金馆",
    description: "暖金灯柱 + 抛光地台 + 顶光 + Logo 幕墙。",
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
    props: {
      floor: {
        radius: 14,
        innerRadius: 9.5,
        color: "#17110c",
        metalness: 0.62,
        roughness: 0.18,
        ringColor: "#f2c26b",
        emissiveIntensity: 0.7,
      },
      columns: {
        count: 8,
        radius: 12.5,
        height: 6.2,
        columnRadius: 0.11,
        color: "#f2c26b",
        emissiveIntensity: 2.6,
      },
      spots: {
        count: 4,
        radius: 9.5,
        height: 7.8,
        intensity: 20,
        color: "#ffe3a8",
        showFixtures: true,
      },
      backdrop: {
        width: 20,
        height: 7,
        color: "#14100c",
        logoText: "SY·ME",
        logoColor: "#f2c26b",
        accentColor: "#f2c26b",
        distance: -15,
      },
    },
  },
  {
    id: "white-hall",
    label: "极简白馆",
    description: "浅色地台 + 冷白灯柱 + 柔和顶光。",
    environment: {
      background: "#d8dde3",
      ambientIntensity: 0.42,
    },
    ground: {
      enabled: true,
      color: "#cfd5dc",
      metalness: 0.08,
      roughness: 0.72,
      grid: null,
    },
    props: {
      floor: {
        radius: 13,
        innerRadius: 9,
        color: "#eef2f6",
        metalness: 0.28,
        roughness: 0.32,
        ringColor: "#7eb6ff",
        emissiveIntensity: 0.45,
      },
      columns: {
        count: 6,
        radius: 11.5,
        height: 5.6,
        columnRadius: 0.1,
        color: "#dce9ff",
        emissiveIntensity: 1.8,
      },
      spots: {
        count: 3,
        radius: 8.5,
        height: 7.2,
        intensity: 14,
        color: "#f5f8ff",
        showFixtures: true,
      },
      backdrop: {
        width: 18,
        height: 6.4,
        color: "#e8edf3",
        logoText: "SY·ME",
        logoColor: "#3d7fd6",
        accentColor: "#7eb6ff",
        distance: -14,
      },
    },
  },
  {
    id: "night-hall",
    label: "夜间黑馆",
    description: "低环境光 + 高对比灯柱与蓝色顶光，适合科技演示。",
    environment: {
      background: "#05070c",
      ambientIntensity: 0.16,
    },
    ground: {
      enabled: true,
      color: "#070a10",
      metalness: 0.3,
      roughness: 0.48,
      grid: null,
    },
    props: {
      floor: {
        radius: 14.5,
        innerRadius: 10,
        color: "#0b1018",
        metalness: 0.7,
        roughness: 0.16,
        ringColor: "#57d9ff",
        emissiveIntensity: 0.85,
      },
      columns: {
        count: 10,
        radius: 13,
        height: 6.8,
        columnRadius: 0.1,
        color: "#57d9ff",
        emissiveIntensity: 3.1,
      },
      spots: {
        count: 5,
        radius: 10,
        height: 8.2,
        intensity: 22,
        color: "#9cc7ff",
        showFixtures: true,
      },
      backdrop: {
        width: 22,
        height: 7.5,
        color: "#060910",
        logoText: "SY·ME",
        logoColor: "#57d9ff",
        accentColor: "#57d9ff",
        distance: -16,
      },
    },
  },
  {
    id: "none",
    label: "关闭道具",
    description: "仅保留场景灯光与地面，不放置展厅道具。",
    props: null,
  },
]);

export function findShowroomSkin(skinId) {
  return SHOWROOM_SKINS.find((skin) => skin.id === skinId) || SHOWROOM_SKINS[0];
}

function isShowroomPropType(type) {
  return SHOWROOM_PROP_TYPE_LIST.includes(type);
}

function buildFloorExtension(skin, groundY) {
  const floor = skin.props?.floor;
  if (!floor) return null;
  return {
    id: "showroom-floor-main",
    type: SHOWROOM_PROP_TYPES.SHOWROOM_FLOOR,
    kind: "node",
    params: {
      ...floor,
      y: groundY + 0.01,
      center: HALL_CENTER,
    },
  };
}

function buildColumnExtension(skin, groundY) {
  const columns = skin.props?.columns;
  if (!columns) return null;
  return {
    id: "showroom-light-columns",
    type: SHOWROOM_PROP_TYPES.LIGHT_COLUMN,
    kind: "node",
    params: {
      ...columns,
      y: groundY,
      center: HALL_CENTER,
      glow: true,
    },
  };
}

function buildSpotExtension(skin) {
  const spots = skin.props?.spots;
  if (!spots) return null;
  return {
    id: "showroom-spot-rig",
    type: SHOWROOM_PROP_TYPES.SPOT_RIG,
    kind: "node",
    params: {
      ...spots,
      center: HALL_CENTER,
      targetY: 1.8,
    },
  };
}

function buildBackdropExtension(skin) {
  const backdrop = skin.props?.backdrop;
  if (!backdrop) return null;
  return {
    id: "showroom-backdrop",
    type: SHOWROOM_PROP_TYPES.BACKDROP,
    kind: "node",
    params: {
      ...backdrop,
      center: HALL_CENTER,
    },
  };
}

export function createShowroomPropExtensions(skinId = "amber-hall", options = {}) {
  const skin = findShowroomSkin(skinId);
  if (!skin?.props) return [];
  const groundY = options.groundY ?? 0;
  return [
    buildFloorExtension(skin, groundY),
    buildColumnExtension(skin, groundY),
    buildSpotExtension(skin),
    buildBackdropExtension(skin),
  ].filter(Boolean);
}

export function applyShowroomSkin(scene, skinId = "amber-hall", options = {}) {
  if (!scene) return scene;
  const skin = findShowroomSkin(skinId);
  const groundY = options.groundY ?? 0;

  const preserved = (scene.extensions || []).filter(
    (extension) => !isShowroomPropType(extension?.type)
  );
  const propExtensions = createShowroomPropExtensions(skin.id, { groundY });

  const next = {
    ...scene,
    showroomSkin: skin.id,
    extensions: [...preserved, ...propExtensions],
  };

  if (skin.environment) {
    next.environment = {
      ...scene.environment,
      ...skin.environment,
    };
  }
  if (skin.ground) {
    next.ground = {
      ...scene.ground,
      ...skin.ground,
      y: scene.ground?.y ?? 0,
      size: Math.max(scene.ground?.size || 72, (skin.props?.floor?.radius || 12) * 2.4),
    };
  }

  return next;
}

function defaultIdForType(type) {
  switch (type) {
    case SHOWROOM_PROP_TYPES.LIGHT_COLUMN:
      return "showroom-light-columns";
    case SHOWROOM_PROP_TYPES.SHOWROOM_FLOOR:
      return "showroom-floor-main";
    case SHOWROOM_PROP_TYPES.SPOT_RIG:
      return "showroom-spot-rig";
    case SHOWROOM_PROP_TYPES.BACKDROP:
      return "showroom-backdrop";
    default:
      return `showroom-${type}`;
  }
}

export function upsertShowroomPropParams(scene, type, paramsPatch = {}) {
  if (!scene) return scene;
  const extensions = Array.isArray(scene.extensions) ? [...scene.extensions] : [];
  const index = extensions.findIndex((item) => item.type === type);
  if (index < 0) {
    extensions.push({
      id: defaultIdForType(type),
      type,
      kind: "node",
      params: { ...paramsPatch },
    });
  } else {
    extensions[index] = {
      ...extensions[index],
      params: {
        ...(extensions[index].params || {}),
        ...paramsPatch,
      },
    };
  }
  return {
    ...scene,
    showroomSkin: "custom",
    extensions,
  };
}

export function removeShowroomProps(scene) {
  if (!scene) return scene;
  return {
    ...scene,
    showroomSkin: "none",
    extensions: (scene.extensions || []).filter(
      (extension) => !isShowroomPropType(extension?.type)
    ),
  };
}
