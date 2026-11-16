/**
 * 场景文档版本协议。
 *
 * 迁移只处理文档结构，不处理模型、HDR 或纹理加载；资源校验和运行时
 * 默认值仍由 scene-normalize.js 负责。这样导入、预设库和未来接口都能
 * 共享同一条版本升级路径。
 */
export const SCENE_SCHEMA_ID = "sy-me.scene";
export const CURRENT_SCENE_SCHEMA_VERSION = 2;
export const LEGACY_SCENE_SCHEMA_VERSION = 1;

function readVersion(value) {
  const version = Number(value);
  return Number.isInteger(version) && version > 0 ? version : LEGACY_SCENE_SCHEMA_VERSION;
}

export function getSceneSchemaVersion(input = {}) {
  const source = input || {};
  return readVersion(source.schemaVersion ?? source.schema?.version ?? source.version);
}

function collectLegacyModels(source) {
  if (Array.isArray(source.models) && source.models.length > 0) return source.models;
  if (source.models && typeof source.models === "object") return Object.values(source.models);
  if (source.model && typeof source.model === "object" && (source.model.id || source.model.url)) {
    return [source.model];
  }
  return [];
}

function migrateV1Models(source) {
  return collectLegacyModels(source).map((model, index) => ({
    ...model,
    id: model.id || model.assetId || `model-${index + 1}`,
    // v1 的部分实验性装配配置使用 parent / groupId，v2 统一为显式关系字段。
    parentId: model.parentId ?? model.parent ?? null,
    assemblyId: model.assemblyId ?? model.groupId ?? null,
  }));
}

/**
 * 将场景文档迁移到当前 Schema 版本。
 *
 * 返回元信息方便 UI 在导入时给出“已迁移”提示；调用方通常只需要使用
 * result.scene。遇到高于当前版本的文档会主动失败，避免静默丢失新字段。
 */
export function migrateSceneDocument(input = {}) {
  const source = input || {};
  const fromVersion = getSceneSchemaVersion(source);
  if (fromVersion > CURRENT_SCENE_SCHEMA_VERSION) {
    throw new Error(
      `场景配置版本 ${fromVersion} 高于当前支持版本 ${CURRENT_SCENE_SCHEMA_VERSION}，请升级工作台后再导入。`
    );
  }

  let scene = { ...source };
  const appliedMigrations = [];
  if (fromVersion < 2) {
    scene = {
      ...scene,
      models: migrateV1Models(source),
    };
    appliedMigrations.push("v1-to-v2-model-relationships");
  }

  const schema = {
    ...(scene.schema || {}),
    id: SCENE_SCHEMA_ID,
    version: CURRENT_SCENE_SCHEMA_VERSION,
  };
  const hasCurrentMetadata = source.schema?.id === SCENE_SCHEMA_ID
    && source.schema?.version === CURRENT_SCENE_SCHEMA_VERSION
    && source.schemaVersion === CURRENT_SCENE_SCHEMA_VERSION
    && source.version === CURRENT_SCENE_SCHEMA_VERSION;

  return {
    scene: {
      ...scene,
      version: CURRENT_SCENE_SCHEMA_VERSION,
      schemaVersion: CURRENT_SCENE_SCHEMA_VERSION,
      schema,
    },
    fromVersion,
    toVersion: CURRENT_SCENE_SCHEMA_VERSION,
    migrated: appliedMigrations.length > 0 || !hasCurrentMetadata,
    appliedMigrations,
  };
}
