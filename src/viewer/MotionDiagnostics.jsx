import { useMemo, useRef } from "react";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);

function MotionAxisHelper({ root, containerRef, definition, index }) {
  const axisRef = useRef(null);
  const labelRef = useRef(null);
  const color = definition.kind === "rotation" ? "#ffb45e" : "#61d9ff";
  const label = definition.kind === "rotation" ? "旋转轴" : "平行轴";
  const worldLength = useMemo(() => {
    const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    return Math.max(size.length() * 0.12, 0.15);
  }, [root]);

  useFrame(() => {
    const container = containerRef.current;
    const axis = axisRef.current;
    const node = root.getObjectByName(definition.node);
    if (!container || !axis || !node) return;

    node.updateWorldMatrix(true, false);
    const worldOrigin = node.getWorldPosition(new THREE.Vector3());
    const worldPivot = definition.kind === "rotation" && definition.pivot
      ? node.localToWorld(new THREE.Vector3(...definition.pivot))
      : worldOrigin;
    const worldAxis = new THREE.Vector3(...(definition.axis || [0, 1, 0]))
      .transformDirection(node.matrixWorld)
      .normalize();
    const worldEnd = worldPivot.clone().addScaledVector(worldAxis, worldLength);
    const inverse = container.matrixWorld.clone().invert();
    const localPivot = worldPivot.applyMatrix4(inverse);
    const localEnd = worldEnd.applyMatrix4(inverse);
    const localAxis = localEnd.clone().sub(localPivot);
    const localLength = localAxis.length();
    if (!Number.isFinite(localLength) || localLength === 0) return;

    const localDirection = localAxis.normalize();
    axis.position.copy(localPivot);
    axis.quaternion.setFromUnitVectors(UP, localDirection);
    axis.scale.set(1, localLength, 1);
    if (labelRef.current) {
      labelRef.current.position.copy(localPivot).addScaledVector(localDirection, localLength * 1.08);
    }
  });

  return (
    <group userData={{ diagnosticIndex: index }}>
      <group ref={axisRef}>
        <Line points={[[0, 0, 0], [0, 1, 0]]} color={color} lineWidth={2} dashed={false} />
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.055, 12, 8]} />
          <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.9} />
        </mesh>
      </group>
      <group ref={labelRef}>
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <span className="scene-motion-diagnostic-label">{label} · {definition.label || definition.node}</span>
        </Html>
      </group>
    </group>
  );
}

export default function MotionDiagnostics({ root, containerRef, definitions = [], visible }) {
  if (!visible || definitions.length === 0) return null;
  return definitions.map((definition, index) => (
    <MotionAxisHelper
      key={`${definition.id || definition.node}-${index}`}
      root={root}
      containerRef={containerRef}
      definition={definition}
      index={index}
    />
  ));
}

