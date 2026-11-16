import assert from "node:assert/strict";
import {
  CURRENT_SCENE_SCHEMA_VERSION,
  SCENE_SCHEMA_ID,
  getSceneSchemaVersion,
  migrateSceneDocument,
} from "../src/core/scene/scene-schema.js";
import { normalizeScene, serializeScene } from "../src/core/scene/scene-normalize.js";

const legacy = migrateSceneDocument({
  version: 1,
  id: "legacy",
  model: { assetId: "machine", url: "/model/machine.glb", parent: "root", groupId: "assembly" },
});

assert.equal(legacy.fromVersion, 1);
assert.equal(legacy.toVersion, CURRENT_SCENE_SCHEMA_VERSION);
assert.equal(legacy.migrated, true);
assert.deepEqual(legacy.scene.models[0], {
  assetId: "machine",
  url: "/model/machine.glb",
  parent: "root",
  groupId: "assembly",
  id: "machine",
  parentId: "root",
  assemblyId: "assembly",
});
assert.equal(legacy.scene.schema.id, SCENE_SCHEMA_ID);

const objectModels = migrateSceneDocument({
  schemaVersion: 1,
  models: {
    body: { url: "/model/body.glb" },
    wheel: { url: "/model/wheel.glb", parentId: "body" },
  },
});
assert.equal(objectModels.scene.models.length, 2);
assert.equal(objectModels.scene.models[0].id, "model-1");
assert.equal(getSceneSchemaVersion(objectModels.scene), CURRENT_SCENE_SCHEMA_VERSION);

const normalized = normalizeScene({
  version: 1,
  id: "normalized",
  models: [{ id: "root", url: "/model/root.glb" }],
});
assert.equal(normalized.version, CURRENT_SCENE_SCHEMA_VERSION);
assert.equal(normalized.schemaVersion, CURRENT_SCENE_SCHEMA_VERSION);
assert.equal(normalized.schema.id, SCENE_SCHEMA_ID);
assert.equal(serializeScene(normalized).schemaVersion, CURRENT_SCENE_SCHEMA_VERSION);

assert.throws(
  () => migrateSceneDocument({ version: CURRENT_SCENE_SCHEMA_VERSION + 1 }),
  /高于当前支持版本/
);

console.log("scene_schema: ok");
