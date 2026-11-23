import { useMemo } from "react";
import * as THREE from "three";

/**
 * 展厅地台扩展：圆形抛光台 + 可选外环。
 * params: radius, innerRadius, y, color, metalness, roughness,
 *         ringColor, ringWidth, emissive, emissiveIntensity
 */
export default function ShowroomFloorExtension({ config }) {
  const params = config?.params || {};
  const radius = params.radius ?? 10;
  const innerRadius = params.innerRadius ?? radius * 0.72;
  const y = params.y ?? 0.01;
  const color = params.color || "#1a1f26";
  const metalness = params.metalness ?? 0.55;
  const roughness = params.roughness ?? 0.22;
  const ringColor = params.ringColor || "#f2c26b";
  const ringWidth = params.ringWidth ?? 0.18;
  const emissive = params.emissive || ringColor;
  const emissiveIntensity = params.emissiveIntensity ?? 0.55;
  const center = params.center || [0, 0, 0];

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
      }),
    [color, metalness, roughness]
  );

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: ringColor,
        emissive,
        emissiveIntensity,
        metalness: 0.4,
        roughness: 0.35,
        toneMapped: false,
      }),
    [emissive, emissiveIntensity, ringColor]
  );

  return (
    <group name={config?.id || "showroom-floor"} position={[center[0], 0, center[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow material={floorMaterial}>
        <circleGeometry args={[radius, 64]} />
      </mesh>
      {innerRadius > 0 && innerRadius < radius && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.012, 0]} material={floorMaterial}>
          <ringGeometry args={[innerRadius, Math.min(radius, innerRadius + 0.04), 64]} />
        </mesh>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.02, 0]} material={ringMaterial}>
        <ringGeometry args={[Math.max(0.1, radius - ringWidth), radius, 64]} />
      </mesh>
    </group>
  );
}
