import { clampNumber, VISUAL_LIMITS } from "../scene/scene-visual-limits.js";

export const HARVESTER_MACHINE_STATES = Object.freeze({
  IDLE: "idle",
  DRIVING: "driving",
  HARVESTING: "harvesting",
  UNLOADING: "unloading",
  WARNING: "warning",
  MAINTENANCE: "maintenance",
});

export const HARVESTER_COMMANDS = Object.freeze({
  STOP: "stop",
  DRIVE: "drive",
  HARVEST: "harvest",
  UNLOAD: "unload",
  RESET: "reset",
});

export const HARVESTER_STATE_LABELS = Object.freeze({
  [HARVESTER_MACHINE_STATES.IDLE]: "待机",
  [HARVESTER_MACHINE_STATES.DRIVING]: "行驶",
  [HARVESTER_MACHINE_STATES.HARVESTING]: "收割作业",
  [HARVESTER_MACHINE_STATES.UNLOADING]: "卸粮",
  [HARVESTER_MACHINE_STATES.WARNING]: "告警",
  [HARVESTER_MACHINE_STATES.MAINTENANCE]: "维护",
});

export const HARVESTER_STATE_HINTS = Object.freeze({
  [HARVESTER_MACHINE_STATES.IDLE]: "发动机怠速，机构静止，可切换作业指令。",
  [HARVESTER_MACHINE_STATES.DRIVING]: "行走系统运转，适合转场与田间机动。",
  [HARVESTER_MACHINE_STATES.HARVESTING]: "割台/输送/脱粒联动，粮仓填充上升。",
  [HARVESTER_MACHINE_STATES.UNLOADING]: "卸粮筒展开，粮仓余量下降。",
  [HARVESTER_MACHINE_STATES.WARNING]: "存在告警，建议检查燃油或粮仓状态。",
  [HARVESTER_MACHINE_STATES.MAINTENANCE]: "维护模式，作业动作锁定。",
});

function clampTelemetry(values = {}) {
  const next = { ...values };
  for (const [key, limits] of Object.entries(VISUAL_LIMITS.telemetry)) {
    if (next[key] == null) continue;
    next[key] = clampNumber(next[key], limits.min, limits.max, limits.min);
  }
  return next;
}

export function createMachineState(config = {}) {
  return {
    state: config.defaultState || HARVESTER_MACHINE_STATES.IDLE,
    selectedPart: null,
    telemetry: clampTelemetry({
      speed: 0,
      fuel: 100,
      grainFill: 0,
      engineHours: 0,
      headerHeight: 55,
      rotorRpm: 0,
      ...(config.telemetry || {}),
    }),
    animation: {
      speed: 1,
      progress: 0,
      ...(config.animation || {}),
    },
  };
}

function commandToState(command) {
  switch (command) {
    case HARVESTER_COMMANDS.DRIVE:
      return HARVESTER_MACHINE_STATES.DRIVING;
    case HARVESTER_COMMANDS.HARVEST:
      return HARVESTER_MACHINE_STATES.HARVESTING;
    case HARVESTER_COMMANDS.UNLOAD:
      return HARVESTER_MACHINE_STATES.UNLOADING;
    case HARVESTER_COMMANDS.STOP:
      return HARVESTER_MACHINE_STATES.IDLE;
    default:
      return null;
  }
}

function commandProfile(command) {
  switch (command) {
    case HARVESTER_COMMANDS.DRIVE:
      return { speed: 8, animationSpeed: 1, rotorRpm: 0, headerHeight: 70 };
    case HARVESTER_COMMANDS.HARVEST:
      return { speed: 4, animationSpeed: 1.15, rotorRpm: 780, headerHeight: 35 };
    case HARVESTER_COMMANDS.UNLOAD:
      return { speed: 0, animationSpeed: 0.8, rotorRpm: 0, headerHeight: 55 };
    case HARVESTER_COMMANDS.STOP:
      return { speed: 0, animationSpeed: 0, rotorRpm: 0, headerHeight: 55 };
    default:
      return null;
  }
}

/**
 * 按状态推进示意遥测（展厅演示用，非真实传感器）。
 */
export function tickMachineTelemetry(machine, deltaSec = 0.016) {
  if (!machine) return machine;
  const dt = clampNumber(deltaSec, 0, 0.1, 0.016);
  const telemetry = { ...machine.telemetry };
  const state = machine.state;

  if (state === HARVESTER_MACHINE_STATES.DRIVING) {
    telemetry.fuel = Math.max(0, telemetry.fuel - dt * 0.35);
    telemetry.engineHours += dt / 3600;
  } else if (state === HARVESTER_MACHINE_STATES.HARVESTING) {
    telemetry.fuel = Math.max(0, telemetry.fuel - dt * 0.55);
    telemetry.grainFill = Math.min(100, telemetry.grainFill + dt * 3.2);
    telemetry.engineHours += dt / 3600;
    telemetry.rotorRpm = telemetry.rotorRpm || 780;
  } else if (state === HARVESTER_MACHINE_STATES.UNLOADING) {
    telemetry.grainFill = Math.max(0, telemetry.grainFill - dt * 6.5);
    telemetry.engineHours += dt / 3600;
  } else if (state === HARVESTER_MACHINE_STATES.IDLE) {
    telemetry.rotorRpm = Math.max(0, telemetry.rotorRpm - dt * 120);
  }

  let nextState = state;
  if (telemetry.fuel <= 5 && state !== HARVESTER_MACHINE_STATES.IDLE) {
    nextState = HARVESTER_MACHINE_STATES.WARNING;
  } else if (telemetry.grainFill >= 98 && state === HARVESTER_MACHINE_STATES.HARVESTING) {
    nextState = HARVESTER_MACHINE_STATES.WARNING;
  }

  const clamped = clampTelemetry(telemetry);
  const progress = state === HARVESTER_MACHINE_STATES.HARVESTING
    ? clamped.grainFill / 100
    : state === HARVESTER_MACHINE_STATES.UNLOADING
      ? 1 - clamped.grainFill / 100
      : machine.animation?.progress || 0;

  if (
    nextState === machine.state
    && clamped.speed === machine.telemetry.speed
    && clamped.fuel === machine.telemetry.fuel
    && clamped.grainFill === machine.telemetry.grainFill
    && clamped.rotorRpm === machine.telemetry.rotorRpm
    && clamped.headerHeight === machine.telemetry.headerHeight
  ) {
    return {
      ...machine,
      telemetry: clamped,
      animation: { ...machine.animation, progress },
    };
  }

  return {
    ...machine,
    state: nextState,
    telemetry: clamped,
    animation: {
      ...machine.animation,
      progress,
    },
  };
}

export function reduceMachineState(state, action) {
  if (!state) return state;

  switch (action.type) {
    case "machine/command": {
      if (action.payload.command === HARVESTER_COMMANDS.RESET) {
        return createMachineState();
      }
      const nextState = commandToState(action.payload.command);
      const profile = commandProfile(action.payload.command);
      if (!nextState || !profile) return state;
      return {
        ...state,
        state: nextState,
        telemetry: clampTelemetry({
          ...state.telemetry,
          speed: profile.speed,
          rotorRpm: profile.rotorRpm,
          headerHeight: profile.headerHeight,
        }),
        animation: { ...state.animation, speed: profile.animationSpeed },
      };
    }
    case "machine/state":
      return action.payload.value && action.payload.value !== state.state
        ? { ...state, state: action.payload.value }
        : state;
    case "machine/select-part": {
      const value = action.payload.id || null;
      return value !== state.selectedPart
        ? { ...state, selectedPart: value }
        : state;
    }
    case "machine/telemetry":
      return {
        ...state,
        telemetry: clampTelemetry({ ...state.telemetry, ...action.payload.values }),
      };
    case "machine/tick": {
      const next = tickMachineTelemetry(state, action.payload?.delta ?? 0.016);
      return next === state ? state : next;
    }
    case "machine/animation":
      return {
        ...state,
        animation: { ...state.animation, ...action.payload.values },
      };
    case "machine/reset":
      return createMachineState();
    default:
      return state;
  }
}

/** 部件 → 镜头 / 分件模型，供状态面板联动 */
export function resolveMachinePartFocus(part, machineConfig = {}) {
  if (!part) return null;
  const configured = (machineConfig.parts || []).find((item) => item.id === part);
  if (!configured) return null;
  return {
    id: configured.id,
    label: configured.label || configured.id,
    shotId: configured.shotId || null,
    modelIds: Array.isArray(configured.modelIds) ? configured.modelIds : [],
  };
}
