import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 收获机动画适配器（支持多模型装配）。
 *
 * 优先按命名约定驱动：
 * ANIM_WHEEL_* / ANIM_HEADER_* / ANIM_CONVEYOR_* / ANIM_UNLOAD
 * 若无约定节点，则按分件模型 id 做轻量示意旋转（轮系 / 割台 / 卸粮）。
 */
function collectAnimNodes(root) {
  const nodes = {
    wheels: [],
    headers: [],
    conveyors: [],
    unload: [],
  };
  if (!root) return nodes;
  root.traverse((node) => {
    const name = (node.name || "").toUpperCase();
    if (name.startsWith("ANIM_WHEEL")) nodes.wheels.push(node);
    if (name.startsWith("ANIM_HEADER")) nodes.headers.push(node);
    if (name.startsWith("ANIM_CONVEYOR")) nodes.conveyors.push(node);
    if (name.startsWith("ANIM_UNLOAD")) nodes.unload.push(node);
  });
  return nodes;
}

export default function HarvesterAnimationDriver({ modelRefs, modelId, machine, modelIds = [] }) {
  const machineRef = useRef(machine);
  const cacheRef = useRef({ signature: "", named: null, fallback: null });

  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);

  useFrame((_, delta) => {
    const refs = modelRefs?.current;
    if (!refs) return;

    const ids = modelIds.length > 0 ? modelIds : (modelId ? [modelId] : [...refs.keys()]);
    const signature = ids.join("|");
    if (cacheRef.current.signature !== signature || !cacheRef.current.named) {
      const named = { wheels: [], headers: [], conveyors: [], unload: [] };
      const fallback = { wheels: [], headers: [], unload: [] };
      ids.forEach((id) => {
        const root = refs.get(id);
        if (!root) return;
        const collected = collectAnimNodes(root);
        named.wheels.push(...collected.wheels);
        named.headers.push(...collected.headers);
        named.conveyors.push(...collected.conveyors);
        named.unload.push(...collected.unload);

        const lower = String(id).toLowerCase();
        if (lower.includes("wheel") || lower.includes("018") || lower.includes("axle") || lower.includes("019")) {
          fallback.wheels.push(root);
        }
        if (lower.includes("header") || lower.includes("001") || lower.includes("feeder") || lower.includes("004")) {
          fallback.headers.push(root);
        }
        if (lower.includes("unload") || lower.includes("015")) {
          fallback.unload.push(root);
        }
      });
      cacheRef.current = { signature, named, fallback };
    }

    const current = machineRef.current;
    if (!current) return;
    const state = current.state;
    const speed = current.telemetry?.speed || 0;
    const animationSpeed = current.animation?.speed || 1;
    const isDriving = state === "driving" || state === "harvesting";
    const isHarvesting = state === "harvesting";
    const rotation = delta * Math.max(speed, 0.6) * Math.max(animationSpeed, 0.2);

    const named = cacheRef.current.named;
    const fallback = cacheRef.current.fallback;
    const useNamed = named.wheels.length + named.headers.length + named.conveyors.length + named.unload.length > 0;

    if (isDriving) {
      const wheels = useNamed ? named.wheels : fallback.wheels;
      wheels.forEach((node) => {
        if (useNamed) node.rotation.x += rotation;
        else node.rotation.y += rotation * 0.15;
      });
    }
    if (isHarvesting) {
      const headers = useNamed ? named.headers : fallback.headers;
      headers.forEach((node) => {
        if (useNamed) node.rotation.y += rotation * 1.3;
        else node.rotation.y += rotation * 0.08;
      });
      named.conveyors.forEach((node) => {
        node.rotation.z += rotation * 1.8;
      });
    }

    const unloadTarget = state === "unloading" ? -Math.PI * 0.42 : 0;
    const unloadNodes = useNamed && named.unload.length ? named.unload : fallback.unload;
    unloadNodes.forEach((node) => {
      if (useNamed && named.unload.length) {
        node.rotation.z = THREE.MathUtils.damp(node.rotation.z, unloadTarget, 4, delta);
      } else {
        node.rotation.y = THREE.MathUtils.damp(node.rotation.y, unloadTarget * 0.35, 3, delta);
      }
    });
  });

  return null;
}
