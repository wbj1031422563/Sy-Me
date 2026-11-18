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
    case "model/set-visibility": {
      const visible = Boolean(action.payload.visible);
      const visibility = Object.fromEntries(
        Object.keys(state.visibility).map((id) => [id, visible])
      );
      return { ...state, visibility };
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
  let currentScene = scene;
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
    syncScene: (nextScene) => {
      if (!nextScene || nextScene === currentScene) return;
      const previousModels = new Map((currentScene.models || []).map((model) => [model.id, model]));
      const nextVisibility = Object.fromEntries(
        (nextScene.models || []).map((model) => {
          const previousModel = previousModels.get(model.id);
          const modelVisibilityChanged = previousModel?.visible !== model.visible;
          return [
            model.id,
            modelVisibilityChanged || state.visibility[model.id] == null
              ? model.visible !== false
              : state.visibility[model.id],
          ];
        })
      );
      const nextShotId = nextScene.camera?.defaultShot || nextScene.shots?.[0]?.id;
      const previousShotId = currentScene.camera?.defaultShot || currentScene.shots?.[0]?.id;
      const nextVariantId = nextScene.defaultVariant || nextScene.materialVariants?.[0]?.id;
      const previousVariantId = currentScene.defaultVariant || currentScene.materialVariants?.[0]?.id;
      const shotChanged = nextShotId !== previousShotId;
      const variantChanged = nextVariantId !== previousVariantId;
      const validShotIds = new Set([
        ...(nextScene.shots || []).map((shot) => shot.id),
        ...state.parsedShots.map((shot) => shot.id),
      ]);
      const validVariantIds = new Set((nextScene.materialVariants || []).map((variant) => variant.id));
      const shotId = shotChanged || !validShotIds.has(state.shotId)
        ? nextShotId
        : state.shotId;
      const variantId = variantChanged || !validVariantIds.has(state.variantId)
        ? nextVariantId
        : state.variantId;
      const visibilityChanged = Object.keys(nextVisibility).length !== Object.keys(state.visibility).length
        || Object.entries(nextVisibility).some(([id, value]) => state.visibility[id] !== value);
      currentScene = nextScene;
      if (!visibilityChanged && shotId === state.shotId && variantId === state.variantId) return;
      state = { ...state, visibility: nextVisibility, shotId, variantId };
      notify();
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

