/**
 * 场景扩展注册表。
 *
 * 核心运行时只认识注册表，不需要知道雷达、粒子、飞线或业务面板的
 * 具体实现。新能力可以在 feature 模块中注册，再通过场景配置启用。
 */
const registries = {
  node: new Map(),
  effect: new Map(),
  command: new Map(),
};

function register(kind, id, implementation) {
  if (!id || typeof id !== "string") {
    throw new Error(`[scene-registry] ${kind} 插件必须提供字符串 id`);
  }
  if (!implementation) {
    throw new Error(`[scene-registry] ${kind}:${id} 缺少实现`);
  }

  registries[kind].set(id, implementation);
  return () => registries[kind].delete(id);
}

function get(kind, id) {
  return registries[kind].get(id);
}

function list(kind) {
  return [...registries[kind].entries()].map(([id, implementation]) => ({
    id,
    implementation,
  }));
}

export const sceneRegistry = {
  registerNode: (id, implementation) => register("node", id, implementation),
  registerEffect: (id, implementation) => register("effect", id, implementation),
  registerCommand: (id, implementation) => register("command", id, implementation),
  getNode: (id) => get("node", id),
  getEffect: (id) => get("effect", id),
  getCommand: (id) => get("command", id),
  listNodes: () => list("node"),
  listEffects: () => list("effect"),
  listCommands: () => list("command"),
};

