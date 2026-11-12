import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 收获机动画适配器。
 *
 * 模型节点命名约定：
 * ANIM_WHEEL_*       行走轮
 * ANIM_HEADER_*      割台 / 滚筒
 * ANIM_CONVEYOR_*    输送机构
 * ANIM_UNLOAD        卸粮筒
 */
export default function HarvesterAnimationDriver({ modelRefs, modelId, machine }) {
  const machineRef = useRef(machine);
  const nodesRef = useRef(null);

  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);

  useFrame((_, delta) => {
    if (!nodesRef.current) {
      const root = modelRefs.current.get(modelId);
      if (root) {
        const nodes = {
          wheels: [],
          headers: [],
          conveyors: [],
          unload: [],
        };
        root.traverse((node) => {
          const name = (node.name || "").toUpperCase();
          if (name.startsWith("ANIM_WHEEL")) nodes.wheels.push(node);
          if (name.startsWith("ANIM_HEADER")) nodes.headers.push(node);
          if (name.startsWith("ANIM_CONVEYOR")) nodes.conveyors.push(node);
          if (name.startsWith("ANIM_UNLOAD")) nodes.unload.push(node);
        });
        nodesRef.current = nodes;
      }
    }

    const nodes = nodesRef.current;
    if (!nodes) return;

    const current = machineRef.current;
    const state = current.state;
    const speed = current.telemetry.speed || 0;
    const animationSpeed = current.animation.speed || 1;
    const isDriving = state === "driving" || state === "harvesting";
    const isHarvesting = state === "harvesting";
    const rotation = delta * Math.max(speed, 0.6) * animationSpeed;

    if (isDriving) {
      nodes.wheels.forEach((node) => {
        node.rotation.x += rotation;
      });
    }
    if (isHarvesting) {
      nodes.headers.forEach((node) => {
        node.rotation.y += rotation * 1.3;
      });
      nodes.conveyors.forEach((node) => {
        node.rotation.z += rotation * 1.8;
      });
    }

    const unloadTarget = state === "unloading" ? -Math.PI * 0.42 : 0;
    nodes.unload.forEach((node) => {
      node.rotation.z = THREE.MathUtils.damp(
        node.rotation.z,
        unloadTarget,
        4,
        delta
      );
    });
  });

  return null;
}

