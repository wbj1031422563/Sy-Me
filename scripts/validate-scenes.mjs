/* eslint-env node */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenesRoot = path.join(projectRoot, "src", "scenes");
const publicRoot = path.join(projectRoot, "public");
const failures = [];

function collectSceneFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSceneFiles(entryPath);
    return entry.name.endsWith(".scene.json") ? [entryPath] : [];
  });
}

function assertUnique(items, label, file) {
  const ids = items.map((item) => item?.id).filter(Boolean);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    failures.push(`${file}: ${label} 存在重复 id：${[...new Set(duplicates)].join(", ")}`);
  }
}

function resolvePublicAsset(url) {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("/")) return path.join(publicRoot, decodeURIComponent(url.slice(1)));
  return path.resolve(projectRoot, decodeURIComponent(url));
}

for (const file of collectSceneFiles(scenesRoot)) {
  const relativeFile = path.relative(projectRoot, file);
  let scene;
  try {
    scene = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`${relativeFile}: JSON 解析失败：${error.message}`);
    continue;
  }

  if (!scene.id) failures.push(`${relativeFile}: 缺少 scene.id`);
  if (!scene.title) failures.push(`${relativeFile}: 缺少 scene.title`);
  if (!Array.isArray(scene.models) || scene.models.length === 0) {
    failures.push(`${relativeFile}: models 必须是非空数组`);
    continue;
  }

  assertUnique(scene.models, "models", relativeFile);
  assertUnique(scene.shots || [], "shots", relativeFile);
  assertUnique(scene.hotspots || [], "hotspots", relativeFile);
  assertUnique(scene.materialVariants || [], "materialVariants", relativeFile);
  assertUnique(scene.machine?.parts || [], "machine.parts", relativeFile);

  for (const model of scene.models) {
    if (!model.id) failures.push(`${relativeFile}: 模型缺少 id`);
    if (!model.url) {
      failures.push(`${relativeFile}: 模型 ${model.id || "unknown"} 缺少 url`);
      continue;
    }
    const assetPath = resolvePublicAsset(model.url);
    if (assetPath && !fs.existsSync(assetPath)) {
      failures.push(`${relativeFile}: 模型资源不存在：${model.url}`);
    }
  }
}

if (failures.length > 0) {
  console.error("场景校验失败：");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("场景校验通过：所有 scene JSON、模型 URL 和 id 均有效。");
}

