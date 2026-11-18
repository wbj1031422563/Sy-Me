import { analyzeMotionCapabilities } from "./motion-analysis.js";

const EXTENSION_FORMATS = {
  glb: "glb",
  gltf: "gltf",
  fbx: "fbx",
  obj: "obj",
  stl: "stl",
  ply: "ply",
  dae: "dae",
};

export function getAssetFormat(fileName = "") {
  const extension = fileName.toLowerCase().split(".").pop();
  return EXTENSION_FORMATS[extension] || "unknown";
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function emptyReport(file, format) {
  return {
    fileName: file.name,
    format,
    size: formatSize(file.size),
    previewSupported: false,
    vertices: null,
    faces: null,
    triangles: null,
    meshes: null,
    materials: null,
    primitiveCount: null,
    textures: null,
    nodes: null,
    nodeNames: [],
    nodeHierarchy: [],
    sockets: [],
    materialNames: [],
    animations: null,
    clipNames: [],
    motion: null,
    performanceLevel: "unknown",
    performanceLabel: "待评估",
    recommendations: [],
    notes: [],
  };
}

function countPrimitiveTriangles(primitive, accessors) {
  const positionAccessor = accessors[primitive.attributes?.POSITION];
  if (!positionAccessor?.count) return 0;
  const vertexCount = accessors[primitive.indices]?.count || positionAccessor.count;
  const mode = primitive.mode ?? 4;
  if (mode === 4) return Math.floor(vertexCount / 3);
  if (mode === 5 || mode === 6) return Math.max(0, vertexCount - 2);
  return 0;
}

function assessPerformance(report, file, json) {
  const sizeBytes = file.size || 0;
  const triangles = report.triangles || 0;
  const primitives = report.primitiveCount || 0;
  const materials = report.materials || 0;
  const textures = report.textures || 0;
  const nodes = report.nodes || 0;
  const isHigh = triangles > 3000000
    || primitives > 400
    || materials > 120
    || textures > 48
    || sizeBytes > 300 * 1024 * 1024;
  const isMedium = !isHigh && (
    triangles > 1000000
    || primitives > 180
    || materials > 60
    || textures > 24
    || nodes > 500
    || sizeBytes > 120 * 1024 * 1024
  );
  const recommendations = [];
  if (triangles > 1000000) recommendations.push("建议减面，并准备近景 / 远景 LOD 版本。");
  if (primitives > 180 || materials > 60) recommendations.push("材质槽或绘制批次较多，建议合并材质并减少材质种类。");
  if (textures > 24 || sizeBytes > 120 * 1024 * 1024) recommendations.push("纹理或文件体积较大，建议压缩纹理并优先使用 KTX2 / WebP。");
  if (nodes > 500) recommendations.push("节点层级较深，建议清理不可见节点和无效空物体。");
  if (json.extensionsUsed?.includes("KHR_draco_mesh_compression")) recommendations.push("已使用 Draco 压缩，几何体加载带宽表现较好。");
  if (json.extensionsUsed?.includes("EXT_meshopt_compression")) recommendations.push("已使用 Meshopt 压缩，几何体加载带宽表现较好。");
  if (recommendations.length === 0) recommendations.push("当前资产适合直接进入模型展台预览。");
  report.performanceLevel = isHigh ? "high" : isMedium ? "medium" : "low";
  report.performanceLabel = isHigh ? "高负载" : isMedium ? "中等负载" : "轻量资产";
  report.recommendations = recommendations;
}

function parseGltfJson(json, report, file) {
  report.meshes = json.meshes?.length ?? 0;
  report.materials = json.materials?.length ?? 0;
  report.textures = json.images?.length ?? 0;
  report.nodes = json.nodes?.length ?? 0;
  report.nodeNames = (json.nodes || []).map((node) => node.name).filter(Boolean);
  report.materialNames = [...new Set((json.materials || []).map((material) => material.name).filter(Boolean))];
  report.animations = json.animations?.length ?? 0;
  report.clipNames = (json.animations || []).map((animation, index) => ({
    id: `clip-${index}-${animation.name || "animation"}`,
    label: animation.name || `动画片段 ${index + 1}`,
    duration: null,
  }));
  report.motion = analyzeMotionCapabilities(json);
  const accessors = json.accessors || [];
  let vertices = 0;
  let triangles = 0;
  let primitiveCount = 0;
  (json.meshes || []).forEach((mesh) => {
    (mesh.primitives || []).forEach((primitive) => {
      primitiveCount += 1;
      const positionAccessor = accessors[primitive.attributes?.POSITION];
      vertices += positionAccessor?.count || 0;
      triangles += countPrimitiveTriangles(primitive, accessors);
    });
  });
  report.vertices = vertices || null;
  report.faces = triangles || null;
  report.triangles = triangles || null;
  report.primitiveCount = primitiveCount;
  const hasExternalDependencies = [...(json.buffers || []), ...(json.images || [])]
    .some((item) => item.uri && !item.uri.startsWith("data:"));
  report.previewSupported = !hasExternalDependencies;
  assessPerformance(report, file, json);
  report.notes.push(
    hasExternalDependencies
      ? "模型依赖外部贴图或 BIN 文件，请打包成单文件 GLB。"
      : report.format === "gltf"
        ? "GLTF 依赖已内嵌，可直接进入浏览器预览。"
      : "GLB 可直接进入浏览器预览。"
  );
  return report;
}

async function inspectGltf(file, report) {
  if (report.format === "gltf") {
    return parseGltfJson(JSON.parse(await file.text()), report, file);
  }

  // 只读取文件头和 JSON 元数据，避免为了检查再分配一份完整的几何数据。
  const header = new DataView(await file.slice(0, 20).arrayBuffer());
  if (header.byteLength !== 20 || header.getUint32(0, true) !== 0x46546c67
    || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== file.size) {
    report.notes.push("文件不是有效的 GLB 2.0 文件。");
    return report;
  }
  const length = header.getUint32(12, true);
  if (header.getUint32(16, true) !== 0x4e4f534a || !length || 20 + length > file.size) {
    report.notes.push("GLB 的 JSON 元数据缺失或不完整，请重新导出模型。");
    return report;
  }

  return parseGltfJson(JSON.parse(await file.slice(20, 20 + length).text()), report, file);
}

async function inspectObj(file, report) {
  const text = await file.text();
  report.vertices = (text.match(/^v\s+/gm) || []).length;
  report.faces = (text.match(/^f\s+/gm) || []).length;
  report.notes.push("OBJ 通常需要同时提供 MTL 和贴图，推荐预处理成 GLB。\n");
  return report;
}

async function inspectStl(file, report) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 80));
  const header = new TextDecoder().decode(bytes).trim().toLowerCase();
  if (header.startsWith("solid")) {
    const text = new TextDecoder().decode(buffer);
    report.faces = (text.match(/\bfacet\s+normal\b/g) || []).length;
  } else if (buffer.byteLength >= 84) {
    report.faces = new DataView(buffer).getUint32(80, true);
  }
  report.notes.push("STL 只有几何体，通常需要在预处理阶段补充材质。\n");
  return report;
}

export async function inspectAssetFile(file) {
  const format = getAssetFormat(file.name);
  const report = emptyReport(file, format);

  try {
    if (format === "glb" || format === "gltf") return await inspectGltf(file, report);
    if (format === "obj") return await inspectObj(file, report);
    if (format === "stl") return await inspectStl(file, report);
    if (format === "fbx") {
      report.notes.push("FBX 已识别，但建议先在 Blender 中导出为 GLB 再进入展示场景。\n");
      return report;
    }
    report.notes.push("当前格式可以归档，但暂未提供浏览器内直接预览。\n");
    return report;
  } catch (error) {
    report.notes.push(`预处理读取失败：${error.message}`);
    return report;
  }
}

