import assert from "node:assert/strict";
import { hasRenderableModelUrl, normalizeModelCollection } from "../src/core/scene/scene-safety.js";
import { createSceneRuntime } from "../src/core/scene/scene-runtime.js";

const models = normalizeModelCollection([
  {
    id: "root",
    url: "/model/root.glb",
    parentId: "child",
    position: ["bad", 1, Number.POSITIVE_INFINITY],
    scale: 0,
  },
  {
    id: "child",
    url: "/model/child.glb",
    parentId: "root",
    rotation: [0, "bad", 2],
  },
  {
    id: "root",
    url: "/model/duplicate.glb",
    parentId: "missing",
  },
]);

assert.equal(models.length, 3);
assert.equal(new Set(models.map((model) => model.id)).size, 3);
assert.deepEqual(models[0].position, [0, 1, 0]);
assert.deepEqual(models[1].rotation, [0, 0, 2]);
assert.equal(models[0].scale, 1);
assert.equal(models[2].parentId, null);
assert.ok(hasRenderableModelUrl(models));

const parentById = new Map(models.map((model) => [model.id, model.parentId]));
models.forEach((model) => {
  const visited = new Set();
  let cursor = model.id;
  while (cursor) {
    assert.equal(visited.has(cursor), false, `检测到父子循环：${model.id}`);
    visited.add(cursor);
    cursor = parentById.get(cursor) || null;
  }
});

const runtimeScene = {
  models: [{ id: "machine", visible: true }],
  shots: [{ id: "hero" }],
  materialVariants: [{ id: "original" }],
  camera: { defaultShot: "hero" },
  defaultVariant: "original",
};
const runtime = createSceneRuntime(runtimeScene);
runtime.dispatch({ type: "model/toggle-visibility", payload: { id: "machine" } });
runtime.dispatch({ type: "model/inspected", payload: { id: "machine", info: { nodes: 1 } } });
runtime.syncScene({
  ...runtimeScene,
  models: [{ id: "machine", visible: false }],
});
assert.equal(runtime.getState().visibility.machine, false);
assert.deepEqual(runtime.getState().modelsInfo.machine, { nodes: 1 });
runtime.syncScene({
  ...runtimeScene,
  models: [{ id: "machine", visible: true }],
});
assert.equal(runtime.getState().visibility.machine, true);

console.log("scene_safety: ok");
