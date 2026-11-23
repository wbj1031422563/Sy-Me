/**
 * 收获机分件 GLB 目录（经 public/model/harvester-parts → ../../glb junction）。
 *
 * 变换来源：各 GLB 根节点统一 scale=0.01 + 约 +90°X（CAD Z-up → Three Y-up），
 * 网格顶点已在同一 CAD 世界坐标中；除 005（分离室）根节点带 translation 外，
 * 其余根 translation≈0。场景层保持 identity 旋转/缩放，由嵌入变换拼装整机。
 *
 * 落地：转换后轮子底面约在 Y≈-1.57（地面默认 Y=0），不抬升会被地面遮住。
 * HARVESTER_ASSEMBLY_GROUND_OFFSET 仅作测量前兜底；运行时优先按轮底 AABB 自适应贴地。
 */

import {
  clampNumber,
  createDefaultAssemblyGroundOffset,
  VISUAL_LIMITS,
} from "../../core/scene/scene-visual-limits.js";

export const HARVESTER_PARTS_BASE = "/model/harvester-parts";

/**
 * 整机落地偏移（米）。默认取自 VISUAL_LIMITS.assembly.groundLiftY。
 */
export const HARVESTER_ASSEMBLY_GROUND_OFFSET = Object.freeze(
  createDefaultAssemblyGroundOffset()
);

export function offsetHarvesterAssemblyPoint(point = [0, 0, 0], offset = HARVESTER_ASSEMBLY_GROUND_OFFSET) {
  const safeOffset = [
    clampNumber(offset[0], VISUAL_LIMITS.position.min, VISUAL_LIMITS.position.max, 0),
    clampNumber(
      offset[1],
      VISUAL_LIMITS.assembly.groundLiftY.min,
      VISUAL_LIMITS.assembly.groundLiftY.max,
      VISUAL_LIMITS.assembly.groundLiftY.default
    ),
    clampNumber(offset[2], VISUAL_LIMITS.position.min, VISUAL_LIMITS.position.max, 0),
  ];
  return [
    (point[0] || 0) + safeOffset[0],
    (point[1] || 0) + safeOffset[1],
    (point[2] || 0) + safeOffset[2],
  ];
}

/** 探测用：体积适中、文件名无全角括号，便于 HEAD 检查 junction 是否可用 */
export const HARVESTER_PARTS_PROBE_FILE = "006text_model(tuolijiti).glb";

/**
 * @typedef {object} HarvesterPartDef
 * @property {string} id
 * @property {string} file
 * @property {string} label
 * @property {number} sizeMB
 * @property {boolean} [omitFromCore] 精简整机排除的超大体量件（默认含割台）
 */

/** @type {HarvesterPartDef[]} */
export const HARVESTER_PARTS = Object.freeze([
  { id: "part-001-header", file: "001text_model（guwugetai）.glb", label: "谷物割台", sizeMB: 637.3, omitFromCore: true },
  { id: "part-002-bridge", file: "002text_model(guoqiao).glb", label: "过桥传动", sizeMB: 27.5 },
  { id: "part-003-cab", file: "003text_model(jiashitai).glb", label: "驾驶台", sizeMB: 248.8 },
  { id: "part-004-feeder", file: "004text_model(weirugun+jishicao).glb", label: "喂入辊+集石槽", sizeMB: 15.6 },
  { id: "part-005-separator", file: "005text_model(fenlishizongcheng).glb", label: "分离室总成", sizeMB: 3.6 },
  { id: "part-006-threshing", file: "006text_model(tuolijiti).glb", label: "脱粒机体", sizeMB: 28.8 },
  { id: "part-007-tailings", file: "007text_model(zayushengyunqi).glb", label: "杂余升运器", sizeMB: 3.3 },
  { id: "part-008-grain-elevator", file: "008text_model(zilishengyunqi).glb", label: "籽粒升运器", sizeMB: 10.3 },
  { id: "part-009-chopper", file: "009text_model(qiesuiqi).glb", label: "切碎器", sizeMB: 12.8 },
  { id: "part-010-air", file: "010text_model(chuqizongcheng).glb", label: "储气总成", sizeMB: 4.3 },
  { id: "part-011-intake", file: "011text_model(jinqixizongcheng).glb", label: "进气系总成", sizeMB: 2.8 },
  { id: "part-012-exhaust", file: "012text_model(paiqihouchuli).glb", label: "排气后处理", sizeMB: 6.3 },
  { id: "part-013-fuel", file: "013text_model(ranyougongyou+youbengyouxiang).glb", label: "燃油供油+油箱", sizeMB: 14.0 },
  { id: "part-014-cooling", file: "014text_model(sanrechuchen).glb", label: "散热除尘", sizeMB: 13.9 },
  { id: "part-015-unload", file: "015text_model(zhediexieliangtong).glb", label: "折叠卸粮筒", sizeMB: 14.8 },
  { id: "part-016-ladder", file: "016text_model(shangcheti).glb", label: "上车梯", sizeMB: 15.4 },
  { id: "part-017-gearbox", file: "017text_model(biansuxiang).glb", label: "变速箱总成", sizeMB: 23.7 },
  { id: "part-018-wheels", file: "018text_model(zhaunxianglun+qudonglun).glb", label: "转向轮+驱动轮", sizeMB: 118.2 },
  { id: "part-019-axle", file: "019text_model(zhuanxiangqiao).glb", label: "转向桥总成", sizeMB: 8.8 },
  { id: "part-020-driveline", file: "020text_model(zhongjianzhou+zuoyouchuandong).glb", label: "中间轴+左右传动", sizeMB: 20.6 },
  { id: "part-021-covers", file: "021text_model(huzhao).glb", label: "护罩", sizeMB: 62.6 },
  { id: "part-022-grain-tank", file: "022text_model(liangxiang).glb", label: "粮箱", sizeMB: 38.5 },
  { id: "part-023-engine-cover", file: "023text_model(fadongjihuzhao).glb", label: "发动机护罩", sizeMB: 3.8 },
]);

export const HARVESTER_ASSEMBLY_MODES = Object.freeze({
  header: {
    id: "header",
    label: "仅割台",
    description: "只加载工作区割台硬链接，体量最小。",
  },
  core: {
    id: "core",
    label: "精简整机",
    description: "不含谷物割台的 22 个分件（约 0.7GB）。割台约 637MB，需切「整机装配」才加载。",
  },
  full: {
    id: "full",
    label: "整机装配",
    description: "全部 23 个分件（含谷物割台）按 CAD 世界坐标拼装（约 1.3GB，加载较慢）。",
  },
});

export function encodeHarvesterPartUrl(fileName) {
  const segments = `${HARVESTER_PARTS_BASE}/${fileName}`.split("/").map((segment) => {
    if (!segment) return segment;
    // Keep literal "+" — Vite on Windows resolves "%2B" to a missing path and
    // falls back to index.html (text/html), which breaks GLBs named with "+".
    return encodeURIComponent(segment)
      .replace(/%2F/gi, "/")
      .replace(/%2B/g, "+");
  });
  return segments.join("/");
}

export function listHarvesterParts(mode = "full") {
  if (mode === "header") return [];
  if (mode === "core") return HARVESTER_PARTS.filter((part) => !part.omitFromCore);
  return HARVESTER_PARTS.slice();
}

export function summarizeHarvesterParts(parts) {
  const sizeMB = parts.reduce((sum, part) => sum + (part.sizeMB || 0), 0);
  return {
    count: parts.length,
    sizeMB: Math.round(sizeMB * 10) / 10,
  };
}

/**
 * 探测 harvester-parts junction 是否可被开发服务器访问。
 * @returns {Promise<boolean>}
 */
export async function probeHarvesterPartsAvailable(fetchImpl = fetch) {
  const url = encodeHarvesterPartUrl(HARVESTER_PARTS_PROBE_FILE);
  try {
    const response = await fetchImpl(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) return false;
    if (contentType.includes("text/html")) return false;
    return true;
  } catch {
    return false;
  }
}
