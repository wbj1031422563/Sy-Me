const NAME_RULES = [
  {
    kind: "rotation",
    tokens: [
      "拨禾轮", "搅龙", "滚筒", "旋转", "转轴", "轮", "链轮", "皮带轮",
      "reel", "auger", "rotor", "roller", "wheel", "pulley", "gear", "shaft",
    ],
    label: "旋转部件",
  },
  {
    kind: "reciprocation",
    tokens: [
      "动刀", "切刀", "往复", "摆动", "振动", "筛", "刀片", "割刀",
      "knife", "blade", "cutter", "recip", "shaker", "sieve",
    ],
    label: "往复部件",
  },
];

function normalizeName(value = "") {
  return value.toLowerCase().replace(/[\s_\-./]+/g, "");
}

function inferAxis(name = "") {
  const normalized = normalizeName(name);
  if (/(?:绕|旋转|转轴)?x|横向|左右|横轴/.test(normalized)) return [1, 0, 0];
  if (/(?:绕|旋转|转轴)?z|纵向|前后|纵轴/.test(normalized)) return [0, 0, 1];
  return [0, 1, 0];
}

function findRule(name = "") {
  const normalized = normalizeName(name);
  return NAME_RULES.find((rule) => rule.tokens.some((token) => normalized.includes(normalizeName(token))));
}

function candidateId(index, nodeName, kind) {
  const slug = normalizeName(nodeName).replace(/[^a-z0-9\u4e00-\u9fff]+/g, "").slice(0, 24);
  return `detected-${index}-${kind}-${slug || "node"}`;
}

function createCandidate(nodeName, index, kind, source, reason, confidence, path, overrides = {}) {
  const rotating = kind === "rotation";
  return {
    id: candidateId(index, nodeName, kind),
    label: nodeName,
    node: nodeName,
    kind,
    kindLabel: rotating ? "旋转" : "往复",
    axis: inferAxis(nodeName),
    direction: 1,
    rate: rotating ? 24 : 2,
    maxRate: rotating ? 90 : 12,
    step: rotating ? 1 : 0.25,
    stroke: rotating ? undefined : 1,
    source,
    path,
    reason,
    confidence,
    ...overrides,
  };
}

/**
 * 只依赖 glTF JSON 元数据的动作能力分析。
 * 该分析不读取几何体，因此即使是数百 MB 的 GLB 也能快速完成初检。
 */
export function analyzeMotionCapabilities(json = {}) {
  const nodes = Array.isArray(json.nodes) ? json.nodes : [];
  const animations = Array.isArray(json.animations) ? json.animations : [];
  const byNode = new Map();
  let channelCount = 0;

  const addCandidate = (nodeName, index, kind, details) => {
    if (!nodeName || !kind) return;
    const key = `${nodeName}::${kind}`;
    const existing = byNode.get(key);
    const next = createCandidate(
      nodeName,
      index,
      kind,
      details.source,
      details.reason,
      details.confidence,
      details.path,
      details.overrides,
    );
    if (!existing || next.confidence > existing.confidence) {
      byNode.set(key, { ...existing, ...next });
    } else {
      byNode.set(key, {
        ...existing,
        source: existing.source === "animation" ? existing.source : details.source,
        reason: `${existing.reason}；${details.reason}`,
        confidence: Math.max(existing.confidence, details.confidence),
        path: existing.path || details.path,
      });
    }
  };

  animations.forEach((animation) => {
    (animation.channels || []).forEach((channel) => {
      const nodeIndex = channel.target?.node;
      const nodeName = nodes[nodeIndex]?.name;
      const path = channel.target?.path;
      const kind = path === "rotation"
        ? "rotation"
        : path === "translation"
          ? "reciprocation"
          : null;
      if (!nodeName || !kind) return;
      channelCount += 1;
      addCandidate(nodeName, nodeIndex, kind, {
        source: "animation",
        path,
        confidence: 0.98,
        reason: `内置动画通道：${path}`,
      });
    });
  });

  nodes.forEach((node, index) => {
    const metadata = node.extras?.motion || node.extras?.animation;
    const metadataKind = metadata?.kind === "rotation" || metadata?.kind === "reciprocation"
      ? metadata.kind
      : null;
    if (metadataKind) {
      addCandidate(node.name, index, metadataKind, {
        source: "metadata",
        confidence: 1,
        reason: "节点 extras.motion 动作元数据",
        overrides: {
          ...(Array.isArray(metadata.axis) ? { axis: metadata.axis } : {}),
          ...(Number.isFinite(metadata.rate) ? { rate: metadata.rate } : {}),
          ...(Number.isFinite(metadata.maxRate) ? { maxRate: metadata.maxRate } : {}),
          ...(Number.isFinite(metadata.stroke) ? { stroke: metadata.stroke } : {}),
          ...(metadata.direction === -1 ? { direction: -1 } : {}),
          ...(metadata.label ? { label: metadata.label } : {}),
        },
      });
    }
    const rule = findRule(node.name);
    if (!rule) return;
    addCandidate(node.name, index, rule.kind, {
      source: "naming",
      confidence: 0.72,
      reason: `节点命中${rule.label}命名规则`,
    });
  });

  const candidates = [...byNode.values()].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.label.localeCompare(b.label, "zh-CN");
  });

  return {
    clipCount: animations.length,
    channelCount,
    animatedNodeCount: new Set(
      animations.flatMap((animation) => (animation.channels || [])
        .map((channel) => channel.target?.node)
        .filter((index) => index != null))
    ).size,
    candidates,
    ready: candidates.length > 0,
  };
}

export function createMotionCapabilitiesFromDefinitions(definitions = []) {
  const candidates = definitions.map((definition, index) => ({
    ...definition,
    source: definition.source || "preset",
    reason: definition.reason || "已配置动作定义",
    confidence: definition.confidence ?? 1,
    kindLabel: definition.kind === "rotation" ? "旋转" : "往复",
    id: definition.id || `preset-${index}`,
  }));
  return {
    clipCount: 0,
    channelCount: 0,
    animatedNodeCount: 0,
    candidates,
    ready: candidates.length > 0,
  };
}

