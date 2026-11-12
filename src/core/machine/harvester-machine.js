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

export function createMachineState(config = {}) {
  return {
    state: config.defaultState || HARVESTER_MACHINE_STATES.IDLE,
    selectedPart: null,
    telemetry: {
      speed: 0,
      fuel: 100,
      grainFill: 0,
      engineHours: 0,
      ...(config.telemetry || {}),
    },
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
      return { speed: 8, animationSpeed: 1 };
    case HARVESTER_COMMANDS.HARVEST:
      return { speed: 4, animationSpeed: 1.15 };
    case HARVESTER_COMMANDS.UNLOAD:
      return { speed: 0, animationSpeed: 0.8 };
    case HARVESTER_COMMANDS.STOP:
      return { speed: 0, animationSpeed: 0 };
    default:
      return null;
  }
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
      if (nextState === state.state && state.telemetry.speed === profile.speed) {
        return state;
      }
      return {
        ...state,
        state: nextState,
        telemetry: { ...state.telemetry, speed: profile.speed },
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
        telemetry: { ...state.telemetry, ...action.payload.values },
      };
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

