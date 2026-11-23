import { serializeScene } from "../../core/scene/scene-normalize.js";
import { buildShowcaseExportScene } from "./showcase-library.js";

/**
 * 展会演示包：场景 JSON + 可分享元信息，供本机下载。
 */
export function buildShowcasePack(scene, {
  id,
  title,
  note = "",
} = {}) {
  const exported = buildShowcaseExportScene(scene, { id, title });
  const pack = {
    format: "sy-me.showcase-pack",
    version: 1,
    createdAt: new Date().toISOString(),
    title: exported.title,
    note,
    meta: {
      showroomSkin: exported.showroomSkin || null,
      visibilityPreset: exported.visibilityPreset || null,
      assemblyMode: exported.assemblyMode || null,
      modelCount: Array.isArray(exported.models) ? exported.models.length : 0,
      hotspotCount: Array.isArray(exported.hotspots) ? exported.hotspots.length : 0,
      shotCount: Array.isArray(exported.shots) ? exported.shots.length : 0,
      extensionTypes: (exported.extensions || []).map((item) => item.type),
      tour: exported.tour || null,
    },
    scene: exported,
  };
  return pack;
}

export function downloadShowcasePack(scene, options = {}) {
  const pack = buildShowcasePack(scene, options);
  const safeName = String(pack.title || "showcase")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "showcase";
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName}.showcase-pack.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  return pack;
}

export function downloadSerializedScene(scene, fileName = "scene.json") {
  const serialized = serializeScene(scene);
  const blob = new Blob([JSON.stringify(serialized, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
