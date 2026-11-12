import { useSyncExternalStore } from "react";
import {
  createMachineState,
  reduceMachineState,
} from "../machine/harvester-machine.js";

function mergeById(list = [], incoming = []) {
  const map = new Map(list.map((item) => [item.id, item]));
  for (const item of incoming) {
    if (item?.id) map.set(item.id, { ...map.get(item.id), ...item });
  }
  return [...map.values()];
}

function createInitialState(scene) {
  const visibility = Object.fromEntries(
    scene.models.map((model) => [model.id, model.visible !== false])
  );
  const variants = scene.materialVariants || [];

  return {
    modelsInfo: {},
    visibility,
    parsedShots: [],
    parsedHotspots: [],
    activeHotspot: null,
    autoPlay: false,
    shotId: scene.camera?.defaultShot,
    variantId: scene.defaultVariant || variants[0]?.id,
    parameters: { ...(scene.parameters || {}) },
    machine: createMachineState(scene.machine || {}),
  };
}

function reduceState(state, action) {
  const nextMachineState = reduceMachineState(state.machine, action);
  if (nextMachineState !== state.machine) {
    return { ...state, machine: nextMachineState };
  }

  switch (action.type) {
    case "model/inspected": {
      const { id, info } = action.payload;
      return {
        ...state,
        modelsInfo: { ...state.modelsInfo, [id]: info },
        parsedShots: mergeById(state.parsedShots, info?.shots),
        parsedHotspots: mergeById(state.parsedHotspots, info?.hotspots),
      };
    }
    case "model/toggle-visibility": {
      const id = action.payload.id;
      return {
        ...state,
        visibility: {
          ...state.visibility,
          [id]: !state.visibility[id],
        },
      };
    }
    case "shot/set":
      return { ...state, shotId: action.payload.id };
    case "hotspot/set-active":
      return { ...state, activeHotspot: action.payload.id || null };
    case "autoplay/set":
      return { ...state, autoPlay: Boolean(action.payload.value) };
    case "variant/set":
      return { ...state, variantId: action.payload.id };
    case "parameter/set":
      if (state.parameters[action.payload.key] === action.payload.value) {
        return state;
      }
      return {
        ...state,
        parameters: {
          ...state.parameters,
          [action.payload.key]: action.payload.value,
        },
      };
    default:
      return state;
  }
}

/**
 * 创建一个不依赖 React Context 的场景运行时。
 * Three.js 对象、模型引用等非序列化数据仍由 SceneViewer 保存在 ref 中；
 * 这里仅保存可观察、可回放、可导出的场景状态。
 */
export function createSceneRuntime(scene) {
  let state = createInitialState(scene);
  const listeners = new Set();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch: (action) => {
      const nextState = reduceState(state, action);
      if (nextState === state) return;
      state = nextState;
      notify();
    },
  };
}

export function useSceneRuntime(runtime) {
  return useSyncExternalStore(
    runtime.subscribe,
    runtime.getState,
    runtime.getState
  );
}

