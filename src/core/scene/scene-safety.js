const DEFAULT_POSITION = [0, 0, 0];
const DEFAULT_ROTATION = [0, 0, 0];

function normalizeVector(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return [0, 1, 2].map((index) => {
    const number = Number(source[index]);
    return Number.isFinite(number) ? number : fallback[index];
  });
}

function normalizeScale(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0.01 ? number : 1;
}

function normalizeId(value, fallback, usedIds) {
  const base = typeof value === "string" && value.trim() ? value.trim() : fallback;
  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function hasParentCycle(modelId, parentById) {
  const visited = new Set();
  let cursor = modelId;
  while (cursor) {
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = parentById.get(cursor) || null;
  }
  return false;
}

/**
 * 清洗外部场景/装配方案中的模型关系，保证 ID、向量和父子链可安全进入渲染层。
 * 正常数据保持原值；重复 ID、无效父级、循环关系和非法变换会被修正。
 */
export function normalizeModelCollection(rawModels = []) {
  if (!Array.isArray(rawModels)) return [];

  const usedIds = new Set();
  const sourceIdToId = new Map();
  const sourceParentIds = [];
  const sourceAssemblyIds = [];
  const models = rawModels.map((source, index) => {
    const model = source && typeof source === "object" ? source : {};
    const sourceId = typeof model.id === "string" ? model.id.trim() : "";
    const id = normalizeId(sourceId, `model-${index + 1}`, usedIds);
    if (sourceId && !sourceIdToId.has(sourceId)) sourceIdToId.set(sourceId, id);
    sourceParentIds.push(typeof model.parentId === "string" ? model.parentId.trim() : "");
    sourceAssemblyIds.push(typeof model.assemblyId === "string" ? model.assemblyId.trim() : "");
    return {
      ...model,
      id,
      assetId: typeof model.assetId === "string" && model.assetId.trim()
        ? model.assetId.trim()
        : id,
      position: normalizeVector(model.position, DEFAULT_POSITION),
      rotation: normalizeVector(model.rotation, DEFAULT_ROTATION),
      scale: normalizeScale(model.scale),
      visible: model.visible !== false,
      parentId: null,
      assemblyId: null,
    };
  });

  const parentById = new Map();
  models.forEach((model, index) => {
    const parentId = sourceIdToId.get(sourceParentIds[index]) || null;
    parentById.set(model.id, parentId === model.id ? null : parentId);
  });

  models.forEach((model, index) => {
    if (hasParentCycle(model.id, parentById)) parentById.set(model.id, null);
    const parentId = parentById.get(model.id) || null;
    model.parentId = parentId;
    const sourceAssemblyId = sourceAssemblyIds[index];
    model.assemblyId = sourceIdToId.get(sourceAssemblyId) || (parentId ? parentId : null);
  });

  return models;
}

export function hasRenderableModelUrl(models = []) {
  return Array.isArray(models)
    && models.length > 0
    && models.every((model) => typeof model?.url === "string" && model.url.trim());
}
