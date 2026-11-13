/*
 * conventions.js —— Blender 资产命名约定与解析
 *
 * 约定（在 Blender 里命名，导出 glb 后自动生效，实现"模型替换"）：
 *
 *   HOT_<id>        空物体 → 热点。位置取空物体的世界坐标。
 *                   可用 custom props（userData）覆盖：label / title / body
 *   CAM_<id>        空物体 → 镜头机位。位置取世界坐标，目标点为模型包围盒中心。
 *                   userData 可覆盖：label / durationMs
 *   VAR_<slot>      材质名 → 材质变体槽。材质变体只作用于挂该材质的网格；
 *                   没有 VAR_ 材质时，变体作用于全部网格（默认槽 default）。
 *
 * 场景 JSON 与自动解析的合并规则：
 *   - JSON 中的 hotspots / shots 与模型解析结果按 id 合并，JSON 优先（可覆盖位置）；
 *   - JSON 中 materialVariants 是变体定义，模型只决定它作用到哪些网格。
 */

import * as THREE from "three";

export const PREFIX = {
  HOTSPOT: "HOT_",
  CAMERA: "CAM_",
  VARIANT_SLOT: "VAR_",
};

function getSocketId(node) {
  const explicitId = node.userData?.socketId || node.userData?.mountId;
  if (explicitId) return String(explicitId);
  const name = node.name || "";
  for (const prefix of ["SOCKET_", "MOUNT_", "ANCHOR_"]) {
    if (name.startsWith(prefix)) return name.slice(prefix.length) || name;
  }
  return null;
}

function getNodeLabel(node) {
  return node.name?.trim() || node.type || "节点";
}

/**
 * 建立可供工作台使用的稳定节点路径，并可选地写回到 Object3D.userData。
 * 名称可能重复，因此路径同时包含同名兄弟节点的序号。
 */
export function buildNodeHierarchy(root, { annotate = false } = {}) {
  const nodes = [];

  const visit = (node, parentId = null, depth = 0, siblingIndex = 0) => {
    const label = getNodeLabel(node);
    const id = parentId ? `${parentId}/${label}[${siblingIndex}]` : "root";
    if (annotate) {
      node.userData = {
        ...(node.userData || {}),
        __editorNodeKey: id,
      };
    }

    const item = {
      id,
      name: node.name?.trim() || (parentId ? label : "根节点"),
      type: node.type || "Object3D",
      depth,
      parentId,
      isMesh: Boolean(node.isMesh),
      isSkinnedMesh: Boolean(node.isSkinnedMesh),
      childCount: node.children?.length || 0,
      visible: node.visible !== false,
    };
    nodes.push(item);

    const siblingCounts = new Map();
    for (const child of node.children || []) {
      const childLabel = getNodeLabel(child);
      const index = siblingCounts.get(childLabel) || 0;
      siblingCounts.set(childLabel, index + 1);
      visit(child, id, depth + 1, index);
    }
  };

  if (root) visit(root);
  return nodes;
}

export function parseSockets(root) {
  const sockets = [];
  if (!root) return sockets;
  root.updateMatrixWorld(true);
  root.traverse((node) => {
    const id = getSocketId(node);
    if (!id) return;
    node.userData = {
      ...(node.userData || {}),
      __editorSocketId: id,
    };
    sockets.push({
      id,
      label: node.userData?.label || node.name || id,
      nodeId: node.userData?.__editorNodeKey || null,
      position: node.getWorldPosition(new THREE.Vector3()).toArray(),
      quaternion: node.getWorldQuaternion(new THREE.Quaternion()).toArray(),
    });
  });
  return sockets;
}

/**
 * 解析 gltf 场景，提取命名约定信息
 * @param {THREE.Object3D} root gltf.scene（或克隆体）
 * @returns {{hotspots: Array, shots: Array, variantSlots: Map<string, THREE.Mesh[]>}}
 */
export function parseConventions(root) {
  const hotspots = [];
  const shots = [];
  const variantSlots = new Map();

  root.updateMatrixWorld(true);

  root.traverse((node) => {
    const name = node.name || "";

    if (name.startsWith(PREFIX.HOTSPOT)) {
      const id = name.slice(PREFIX.HOTSPOT.length);
      const pos = node.getWorldPosition(new THREE.Vector3());
      hotspots.push({
        id: `HOT_${id}`,
        label: node.userData?.label || id,
        anchor: "node",
        position: pos.toArray(),
        panel: {
          title: node.userData?.title || id,
          body: node.userData?.body || "",
        },
      });
    }

    if (name.startsWith(PREFIX.CAMERA)) {
      const id = name.slice(PREFIX.CAMERA.length);
      const pos = node.getWorldPosition(new THREE.Vector3());
      shots.push({
        id: `CAM_${id}`,
        label: node.userData?.label || id,
        position: pos.toArray(),
        durationMs: node.userData?.durationMs,
      });
    }

    if (node.isMesh) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (const mat of mats) {
        const matName = mat?.name || "";
        if (matName.startsWith(PREFIX.VARIANT_SLOT)) {
          const slot = matName.slice(PREFIX.VARIANT_SLOT.length);
          if (!variantSlots.has(slot)) variantSlots.set(slot, []);
          variantSlots.get(slot).push(node);
        }
      }
    }
  });

  return { hotspots, shots, variantSlots };
}

/**
 * 合并 JSON 配置与模型解析结果（JSON 优先，同 id 覆盖）
 */
export function mergeById(jsonList = [], parsedList = []) {
  const map = new Map();
  for (const item of parsedList) map.set(item.id, item);
  for (const item of jsonList) map.set(item.id, { ...map.get(item.id), ...item });
  return [...map.values()];
}

/**
 * 模型体检：网格/顶点/三角形统计、包围盒、材质清单、命名约定
 * 结果直接展示在模型管理面板（"模型数据"）
 * @param {THREE.Object3D} root
 */
export function inspectModel(root) {
  let meshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;
  const materialNames = new Set();
  const nodeNames = [];
  const box = new THREE.Box3();

  root.updateMatrixWorld(true);
  root.traverse((node) => {
    if (node.name) nodeNames.push(node.name);
    if (!node.isMesh) return;
    meshCount++;
    const geo = node.geometry;
    const pos = geo?.attributes?.position;
    if (pos) vertexCount += pos.count;
    if (geo?.index) triangleCount += geo.index.count / 3;
    else if (pos) triangleCount += pos.count / 3;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const m of mats) if (m?.name) materialNames.add(m.name);
    box.union(new THREE.Box3().setFromObject(node));
  });

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  return {
    meshCount,
    vertexCount,
    triangleCount: Math.round(triangleCount),
    materialNames: [...materialNames],
    nodeNames,
    nodeHierarchy: buildNodeHierarchy(root, { annotate: true }),
    sockets: parseSockets(root),
    bbox: { size: size.toArray(), center: center.toArray() },
    ...parseConventions(root),
  };
}
