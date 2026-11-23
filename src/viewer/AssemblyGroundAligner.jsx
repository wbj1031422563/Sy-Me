import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { computeAdaptiveGroundLift, isWheelLikeModelId } from "./assembly-bounds.js";
import { VISUAL_LIMITS } from "../core/scene/scene-visual-limits.js";

/**
 * 自适应贴地：优先按轮系底面，其次整机包围盒，把装配根节点抬到 groundY。
 * 模型应放在 CAD 原坐标（外层 position.y≈0），由本组件统一抬升。
 * React 不要再写死 group.position.y，避免与测量结果抢控制权。
 */
export default function AssemblyGroundAligner({
  enabled = true,
  modelRefs,
  models = [],
  visibility = {},
  groundY = 0,
  wheelPatterns,
  fallbackLiftY = VISUAL_LIMITS.assembly.groundLiftY.default,
  assemblyRootRef,
  onAligned,
  maxWaitFrames = 180,
}) {
  const invalidate = useThree((state) => state.invalidate);
  const stateRef = useRef({
    lastSignature: "",
    settled: false,
    frames: 0,
    lastLiftY: fallbackLiftY,
  });

  useEffect(() => {
    stateRef.current = {
      lastSignature: "",
      settled: false,
      frames: 0,
      lastLiftY: fallbackLiftY,
    };
    if (assemblyRootRef?.current) {
      assemblyRootRef.current.position.y = fallbackLiftY;
    }
  }, [enabled, models, groundY, fallbackLiftY, assemblyRootRef]);

  useFrame(() => {
    if (!enabled || !assemblyRootRef?.current || !modelRefs?.current) return;

    const entries = models.map((model) => ({
      id: model.id,
      visible: visibility[model.id] !== false && model.visible !== false,
    }));
    const wheelIds = entries
      .filter((entry) => isWheelLikeModelId(entry.id, wheelPatterns))
      .map((entry) => entry.id);
    const visibleIds = entries.filter((entry) => entry.visible).map((entry) => entry.id);
    // 有轮系时以轮系加载进度为签名，避免显隐档切换反复清零抬升
    const trackIds = wheelIds.length > 0 ? wheelIds : visibleIds;
    const loadedCount = trackIds.reduce(
      (count, id) => count + (modelRefs.current.get(id) ? 1 : 0),
      0
    );
    const signature = `${trackIds.join("|")}@${groundY}@${loadedCount}`;
    if (signature !== stateRef.current.lastSignature) {
      stateRef.current.lastSignature = signature;
      stateRef.current.settled = false;
      stateRef.current.frames = 0;
    }
    if (stateRef.current.settled) return;

    // demand 帧循环下持续拉帧，直到测量收敛
    invalidate();
    stateRef.current.frames += 1;
    // 给 GLB 一两帧把矩阵算稳
    if (stateRef.current.frames < 2) {
      assemblyRootRef.current.position.y = stateRef.current.lastLiftY || fallbackLiftY;
      return;
    }

    // 先清零，按真实 CAD 世界盒测底面，再写入抬升
    assemblyRootRef.current.position.y = 0;
    assemblyRootRef.current.updateWorldMatrix(true, true);

    const result = computeAdaptiveGroundLift({
      modelEntries: entries,
      getObject: (id) => modelRefs.current.get(id),
      groundY,
      wheelPatterns,
      fallbackLiftY,
    });

    if (!result.ready) {
      assemblyRootRef.current.position.y = result.liftY;
      stateRef.current.lastLiftY = result.liftY;
      if (stateRef.current.frames >= maxWaitFrames) {
        stateRef.current.settled = true;
        onAligned?.(result);
      }
      return;
    }

    assemblyRootRef.current.position.y = result.liftY;
    assemblyRootRef.current.updateWorldMatrix(true, true);
    stateRef.current.lastLiftY = result.liftY;
    stateRef.current.settled = true;
    onAligned?.(result);
  });

  return null;
}
