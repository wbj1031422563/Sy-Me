/**
 * 本地方案展厅库 —— 工作台导出的展厅场景存放在 localStorage，
 * 场景库与 /viewer/:sceneId 可读取。
 */
export const SHOWCASE_LIBRARY_STORAGE_KEY = "sy-me.showcase-library.v1";

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function listShowcaseLibrary() {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(SHOWCASE_LIBRARY_STORAGE_KEY);
  const list = safeParse(raw || "[]", []);
  return Array.isArray(list) ? list : [];
}

export function getShowcaseLibraryEntry(id) {
  return listShowcaseLibrary().find((entry) => entry.id === id) || null;
}

export function saveShowcaseLibraryEntry(entry) {
  if (!entry?.id || !entry?.scene) {
    throw new Error("展厅方案需要 id 与 scene");
  }
  const list = listShowcaseLibrary().filter((item) => item.id !== entry.id);
  const next = [
    {
      id: entry.id,
      title: entry.title || entry.scene.title || "未命名展厅",
      kind: "showcase",
      status: "本地方案",
      detail: entry.detail || "工作台导出 · 热点 / 巡演",
      savedAt: entry.savedAt || new Date().toISOString(),
      scene: entry.scene,
      to: entry.to || `/viewer/${entry.id}`,
    },
    ...list,
  ];
  localStorage.setItem(SHOWCASE_LIBRARY_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removeShowcaseLibraryEntry(id) {
  const next = listShowcaseLibrary().filter((item) => item.id !== id);
  localStorage.setItem(SHOWCASE_LIBRARY_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function buildShowcaseExportScene(scene, {
  id = scene?.id || `showcase-${Date.now()}`,
  title = scene?.title || "展厅场景",
} = {}) {
  return {
    ...scene,
    id,
    title,
    kind: "showcase",
    machine: {
      ...(scene?.machine || {}),
      enabled: false,
    },
    exportedAt: new Date().toISOString(),
    exportedAs: "showcase",
  };
}
